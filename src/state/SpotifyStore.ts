import { action, runInAction } from 'mobx';
import { useLocalObservable } from 'mobx-react';
import Cookies from 'js-cookie';
import {
  getArtistAlbums,
  getPlaylistTracks,
  getAlbumTracks,
  searchForArtist,
  callNext,
  getCurrentUserPlaylists,
  playPlayback,
  pausePlayback,
  getPlayback,
  nextPlayback,
  prevPlayback,
  seekPlayback,
  getAllCurrentUserPlaylists,
  getCurrentUserProfile
} from '../api/Spotify';
import {
  artistString,
  getImages,
  JUST_GOOD_INDICATOR,
  PROGRESS_INDICATOR,
  splitJustGoodPlaylists,
  splitPlaylists
} from '../logic/common';
import { Artist, ArtistResponse, CachedPlaylist, Images, JustGoodPlaylist, Token, Track } from '../types';
import { serializeArtists } from '../logic/serializers';
import { getUser, getToken, storeToken, storeUser, StoredUser } from '../logic/storage';
import { fetchRefreshToken, shouldRefreshToken } from '../auth/authHelper';

export type Response = Promise<boolean>;
// export type Response<T> = Promise<{
//   success: boolean;
//   body?: T;
//   error?: Error;
// }> | undefined;

// const respondSuccess = (body?: any) => ({ success: true, body });
// const respondError = (error: Error) => ({ success: false, error });
const respondNoToken = () => { throw new Error('No Spotify Token') };

export interface SpotifyStore {
  // Spotify Authentication
  token?: Token;
  useToken: () => Promise<string | undefined>;
  newToken: (accessToken: string, refreshToken: string, expiresIn: number) => void;
  fetchToken: () => void;

  // User Setup
  setupLoading: boolean;

  userId?: string;
  userName?: string;
  userImg?: Images;
  userPlaylists?: CachedPlaylist[];
  justGoodPlaylists?: JustGoodPlaylist[];
  inProgressJustGoodPlaylists?: JustGoodPlaylist[];

  fetchUser: () => Response;
  setupUser: () => Promise<StoredUser>;

  // High Level Spotify Edit Actions
  artistResults: Artist[];
  loadedTracks: Track[];

  searchArtists: (term: string) => Response;
  clearSearchArtistResults: () => Response;
  loadAllArtistTracks: (artistID: string) => Response;
  applyLoadedToNewPlaylist: (name: string, description: string) => Response;
  getPlaylistTracks: (trackID: string) => Response;
  addTrackToPlaylist: (trackID: string, playlistID: string) => Response;
  removeTrackFromPlaylist: (trackID: string, playlistID: string) => Response;

  // High Level Spotify Player
  playing: boolean;
  currentTrackName: string;
  currentTrackArtist: string;

  // both milliseconds
  currentTrackProgress: number;
  currentTrackDuration: number;
  currentTrackSmallImageURL: string,
  currentTrackLargeImageURL: string,

  togglePlaying: () => Response;
  skipNext: () => Response;
  skipPrevious: () => Response;
  seekToPosition: (value: number) => Response;
  pretendToProceedPosition: () => void;
  updatePlayer: () => Response;
}

const useSpotifyStore = () => {
  const store: SpotifyStore = useLocalObservable<SpotifyStore>(() => ({
    token: undefined,
    useToken: action(async () => {
      if (!store.token) {
        store.fetchToken();
      }
      if (store.token && shouldRefreshToken(store.token)) {
        console.log('Refreshing token');

        const response = await fetchRefreshToken(store.token.refreshToken);

        store.newToken(response.access_token, store.token.refreshToken, response.expires_in);
      }

      return store.token?.accessToken;
    }),
    newToken: action((accessToken, refreshToken, expiresIn) => {
      // getTime and constructor is in milliseconds
      const expires = new Date(new Date().getTime() + (expiresIn * 1000));
      const token: Token = {
        refreshToken,
        accessToken,
        expires,
      };
      storeToken(token);
      store.token = token;
    }),
    fetchToken: action(async () => {
      store.token = getToken();

      // Set initial states for app
      await store.fetchUser();
    }),

    setupLoading: false,
    userId: undefined,
    userName: undefined,
    userImg: undefined,
    userPlaylists: undefined,
    justGoodPlaylists: undefined,
    inProgressJustGoodPlaylists: undefined,

    fetchUser: action(async () => {
      let user = getUser();

      if (!user) {
        user = await store.setupUser();
      }

      store.userId = user.userId;
      store.userName = user.userName;
      store.userImg = user.userImg;
      store.userPlaylists = user.userPlaylists;

      const { inProgressJustGoodPlaylists, finishedJustGoodPlaylists } = splitJustGoodPlaylists(user.justGoodPlaylists);

      store.justGoodPlaylists = finishedJustGoodPlaylists;
      store.inProgressJustGoodPlaylists = inProgressJustGoodPlaylists;

      return true;
    }),

    setupUser: action(async () => {
      const token = await store.useToken();
      if (!token) return respondNoToken();

      store.setupLoading = true;

      console.log('Fetching user profile!')

      const user = await getCurrentUserProfile(token);

      console.log('Loaded profile.');
      console.log(user);

      store.userId = user.id;
      store.userName = user.display_name;
      store.userImg = getImages(user.images);

      console.log('Fetching all user playlists...')

      const playlists = await getAllCurrentUserPlaylists(token);

      console.log('Fetched.');
      console.log(playlists);

      console.log('splitting the playlists...');

      const { justGoodPlaylists: justJustGoodPlaylists, progressPlaylists, userPlaylists } = splitPlaylists(playlists);

      console.log('splitted');
      console.log({ justJustGoodPlaylists, progressPlaylists, userPlaylists });

      const justGoodPlaylists: JustGoodPlaylist[] = [];
      const progressMap: { [artistName: string]: CachedPlaylist } = {};

      progressPlaylists.forEach((playlist) => {
        progressMap[playlist.name.substring(PROGRESS_INDICATOR.length).trim()] = playlist;
      });

      console.log('Created the progress map.');
      console.log(progressMap);

      for (let i = 0; i < justJustGoodPlaylists.length; i++) {
        console.log(`Processing Just Good playlist ${i}.`);
        const playlist = justJustGoodPlaylists[i];
        console.log(playlist);
        const artistName = playlist.name.substring(JUST_GOOD_INDICATOR.length).trim();
        console.log(`Artist Name from playlist: ${artistName}`);

        const artist: ArtistResponse | undefined = (await searchForArtist(artistName, 1, token)).artists.items[0];
        console.log('Artist received from search:');
        console.log(artist);

        justGoodPlaylists.push({
          ...playlist,
          artistId: artist?.id,
          artistName,
          artistImg: getImages(artist?.images),
          progressPlaylist: progressMap[artistName],
        });

        console.log('Finished just good playlist.');
        console.log(justGoodPlaylists[justGoodPlaylists.length - 1]);
      }

      store.userPlaylists = userPlaylists;
      store.justGoodPlaylists = justGoodPlaylists;

      const storedUser: StoredUser = {
        userId: store.userId,
        userImg: store.userImg,
        userName: store.userName,
        userPlaylists: store.userPlaylists,
        justGoodPlaylists: store.justGoodPlaylists,
      };

      storeUser(storedUser);

      store.setupLoading = false;

      return storedUser;
    }),

    artistResults: [],
    loadedTracks: [],

    searchArtists: action(async (term: string) => {
      const token = await store.useToken();
      if (!token) return false;

      const response = await searchForArtist(term, 5, token);

      // response.artists.items[0].followers.total;

      store.artistResults.push(...serializeArtists(response.artists.items));

      return true;
    }),

    clearSearchArtistResults: action(async () => {
      store.artistResults = [];
      return true;
    }),

    loadAllArtistTracks: async (artistID: string) => {
      return false;
    },
    applyLoadedToNewPlaylist: async (name: string, description: string) => {
      return false;
    },
    getPlaylistTracks: async (trackID: string) => {
      return false;
    },
    addTrackToPlaylist: async (trackID: string, playlistID: string) => {
      return false;
    },
    removeTrackFromPlaylist: async (trackID: string, playlistID: string) => {
      return false;
    },

    playing: false,
    currentTrackName: '',
    currentTrackArtist: '',
    currentTrackProgress: 0,
    currentTrackDuration: 0,
    currentTrackSmallImageURL: '',
    currentTrackLargeImageURL: '',

    togglePlaying: action(async () => {
      const token = await store.useToken();
      if (!token) return false;

      await (store.playing ? pausePlayback(token) : playPlayback(token));

      return await store.updatePlayer();
    }),

    skipNext: action(async () => {
      const token = await store.useToken();
      if (!token) return false;

      await nextPlayback(token);

      return await store.updatePlayer();
    }),

    skipPrevious: action(async () => {
      const token = await store.useToken();
      if (!token) return false;

      await prevPlayback(token);

      return await store.updatePlayer();
    }),

    seekToPosition: action(async (value: number) => {
      const token = await store.useToken();
      if (!token) return false;

      await seekPlayback(value, token);

      return await store.updatePlayer();
    }),

    /**
     * For when you want to update the playing bar without actually playing it
     */
    pretendToProceedPosition: action(() => {
      store.currentTrackProgress += 1000; // 1 second
    }),

    updatePlayer: action(async () => {
      const token = await store.useToken();
      if (!token) return false;

      const playback = await getPlayback(token);

      runInAction(() => {
        store.playing = playback.is_playing;
        store.currentTrackName = playback.item?.name || '';
        store.currentTrackArtist = artistString(playback.item?.artists);
        store.currentTrackProgress = playback.progress_ms || 0;
        store.currentTrackDuration = playback.item?.duration_ms || 0;
        const { small, large } = getImages(playback.item.album?.images);
        store.currentTrackSmallImageURL = small;
        store.currentTrackLargeImageURL = large;

        // console.log('CHECK PLAYER STATUS UPDATED TO:');
        // console.log(`Playing: ${store.playing}`);
        // console.log(`Track Name: ${store.currentTrackName}`);
        // console.log(`Track Artist: ${store.currentTrackArtist}`);
        // console.log(`Track Progress: ${store.currentTrackProgress}`);
        // console.log(`Track Duration: ${store.currentTrackDuration}`);
        // console.log(`Small Image URL: ${store.currentTrackSmallImageURL}`);
        // console.log(`Large Image URL: ${store.currentTrackLargeImageURL}`);
      });

      return true;
    }),
  }));

  return store;
};

export default useSpotifyStore;
