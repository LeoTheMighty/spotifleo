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
  playPlayback, pausePlayback, getPlayback, nextPlayback, prevPlayback, seekPlayback
} from '../api/Spotify';
import { artistString, getImages } from '../logic/common';
import { Artist, Token, Track } from '../types';
import { serializerArtists } from '../logic/serializers';
import { getToken, storeToken } from '../logic/storage';
import { fetchRefreshToken, shouldRefreshToken } from '../auth/authHelper';

const spotifyAuthTokenCookieLocation: string = 'spotifyAuthToken';

export type Response = Promise<{
  success: boolean;
  body?: any;
  error?: Error;
}> | undefined;

const respondSuccess = (body?: any) => ({ success: true, body });
const respondError = (error: Error) => ({ success: false, error });
const respondNoToken = () => respondError(new Error('No Spotify Token'));

export interface SpotifyStore {
  // Spotify Authentication
  token?: Token;
  useToken: () => Promise<string | undefined>;
  newToken: (accessToken: string, refreshToken: string, expiresIn: number) => void;
  fetchToken: () => void;
  // setToken: (token: string) => void;

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
  // both milliseconds
  currentTrackName: string;
  currentTrackArtist: string;
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
    }),
    fetchToken: action(() => {
      store.token = getToken();
      // TODO: Set initial states for app?
    }),
    // setToken: action((token: string) => {
    //   store.token = token;
    // }),

    // test: action(async () => {
    //   if (!store.token) {
    //     return;
    //   }
    //
    //   console.log('test');
    //   const doja = '5cj0lLjcoR7YOSnhnX0Po5';
    //   const dojaDeepDivePlaylist = '60CudX0GVgmf5MZ4fGF4Bl';
    //   const dojaAlbum = '1MmVkhiwTH0BkNOU3nw5d3';
    //
    //   console.log('GET ARTIST ALBUMS');
    //   store.token && console.log(await getArtistAlbums(doja, store.token));
    //   // console.log('GET PLAYLIST TRACKS');
    //   // store.token && console.log(await getPlaylistTracks(dojaDeepDivePlaylist, 20, 0, store.token));
    //   // console.log('GET CURRENT USER PLAYLISTS');
    //   // store.token && console.log(await getCurrentUserPlaylists(20, 0, store.token));
    //   // console.log('GET ALBUM TRACKS');
    //   // store.token && console.log(await getAlbumTracks(dojaAlbum, store.token));
    //   // console.log('SEARCH FOR ARTIST');
    //   // store.token && console.log(await searchForArtist('doja', 20, store.token));
    // }),
    artistResults: [],
    loadedTracks: [],

    searchArtists: action(async (term: string) => {
      const token = await store.useToken();
      if (!token) return respondNoToken();

      const response = await searchForArtist(term, 5, token);

      // response.artists.items[0].followers.total;

      store.artistResults.push(...serializerArtists(response.artists.items));

      return respondSuccess();
    }),

    clearSearchArtistResults: action(async () => respondSuccess(store.artistResults = [])),

    loadAllArtistTracks: (artistID: string) => undefined,
    applyLoadedToNewPlaylist: (name: string, description: string) => undefined,
    getPlaylistTracks: (trackID: string) => undefined,
    addTrackToPlaylist: (trackID: string, playlistID: string) => undefined,
    removeTrackFromPlaylist: (trackID: string, playlistID: string) => undefined,

    playing: false,
    currentTrackName: '',
    currentTrackArtist: '',
    currentTrackProgress: 0,
    currentTrackDuration: 0,
    currentTrackSmallImageURL: '',
    currentTrackLargeImageURL: '',

    togglePlaying: action(async () => {
      const token = await store.useToken();
      if (!token) return respondNoToken();

      if (store.playing) {
        try {
          await pausePlayback(token);
        } catch (error: any) {
          return respondError(error);
        }
      } else {
        try {
          await playPlayback(token);
        } catch (error: any) {
          return respondError(error);
        }
      }
      store.updatePlayer();
      return respondSuccess();
    }),

    skipNext: action(async () => {
      const token = await store.useToken();
      if (!token) return respondNoToken();

      try {
        await nextPlayback(token);
      } catch (error: any) {
        return respondError(error);
      }
      store.updatePlayer();
      return respondSuccess();
    }),

    skipPrevious: action(async () => {
      const token = await store.useToken();
      if (!token) return respondNoToken();

      try {
        await prevPlayback(token);
      } catch (error: any) {
        return respondError(error);
      }
      store.updatePlayer();
      return respondSuccess();
    }),

    seekToPosition: action(async (value: number) => {
      const token = await store.useToken();
      if (!token) return respondNoToken();

      try {
        await seekPlayback(value, token);
      } catch (error: any) {
        return respondError(error);
      }
      store.updatePlayer();
      return respondSuccess();
    }),

    /**
     * For when you want to update the playing bar without actually playing it
     */
    pretendToProceedPosition: action(() => {
      store.currentTrackProgress += 1000; // 1 second
    }),

    updatePlayer: action(async () => {
      const token = await store.useToken();
      if (!token) return respondNoToken();

      try {
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

          console.log('CHECK PLAYER STATUS UPDATED TO:');
          console.log(`Playing: ${store.playing}`);
          console.log(`Track Name: ${store.currentTrackName}`);
          console.log(`Track Artist: ${store.currentTrackArtist}`);
          console.log(`Track Progress: ${store.currentTrackProgress}`);
          console.log(`Track Duration: ${store.currentTrackDuration}`);
          console.log(`Small Image URL: ${store.currentTrackSmallImageURL}`);
          console.log(`Large Image URL: ${store.currentTrackLargeImageURL}`);
        });
      } catch (error: any) {
        return respondError(error);
      }

      return respondSuccess();
    }),
  }));

  return store;
};

export default useSpotifyStore;
