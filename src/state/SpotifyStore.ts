import { action, observable, runInAction, toJS } from 'mobx';
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
  getCurrentUserProfile,
  getAllPlaylistTracks,
  getAllArtistAlbums,
  createPlaylist,
  getAllArtistAlbumsWithTracks,
  addTracksToPlaylist,
  addAllTracksToPlaylist,
  playPlaylistPlayback,
  addTrackToPlaylist,
  changePlaylistDetails,
  removeTrackFromPlaylist
} from '../api/Spotify';
import {
  artistString,
  DEEP_DIVE_INDICATOR,
  getImages,
  JUST_GOOD_INDICATOR,
  IN_PROGRESS_INDICATOR,
  splitJustGoodPlaylists,
  splitPlaylists,
  getDeepDivePlaylistName,
  getDeepDivePlaylistDescription,
  getJustGoodPlaylistName,
  getInProgressJustGoodPlaylistName,
  getInProgressJustGoodPlaylistDescription,
  importMapOfSets,
  exportMapOfSets,
  sleep,
  getJustGoodPlaylistDescription, importMap, exportMap, getPlaylistUri
} from '../logic/common';
import {
  Artist,
  ArtistResponse,
  CachedPlaylist,
  Images,
  CachedJustGoodPlaylist,
  Token,
  Track,
  JustGoodPlaylist, DeepDiverViewType, Album, AlbumGroup
} from '../types';
import { deserializeArtists } from '../logic/serializers';
import { getUser, getToken, storeToken, storeUser, StoredUser, removeUser, removeToken } from '../logic/storage';
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

// TODO: Use Maps instead of Javascript objects!
// TODO:

export interface SpotifyStore {
  // Spotify Authentication
  token?: Token;
  useToken: () => Promise<string | undefined>;
  newToken: (accessToken: string, refreshToken: string, expiresIn: number) => void;
  fetchToken: () => void;
  deauthorize: () => void;

  // User Setup
  setupLoading: boolean;

  userId?: string;
  userName?: string;
  userImg?: Images;
  userPlaylists?: CachedPlaylist[];
  deepDiverPlaylistIndexes?: Map<string, number>; // which ones are activated
  deepDiverPlaylistTrackSets?: Map<string, Set<string>>; // track sets for the activated deep diver playlists
  justGoodPlaylists?: CachedJustGoodPlaylist[];
  inProgressJustGoodPlaylists?: CachedJustGoodPlaylist[];
  plannedJustGoodPlaylists?: CachedJustGoodPlaylist[];
  justGoodPlaylistMap?: { [id: string]: CachedJustGoodPlaylist }, // TODO convert
  justGoodPlaylistArtistMap?: { [artistId: string]: CachedJustGoodPlaylist }, // TODO convert

  fetchUser: () => Response;
  setupUser: () => Promise<StoredUser>;
  saveUser: () => void;
  storeUser: (userId: string, userName: string, userImg: Images, userPlaylists: CachedPlaylist[], deepDiverPlaylistIndexes: Map<string, number>, deepDiverPlaylistTrackSets: Map<string, Set<string>>, justGoodPlaylists: CachedJustGoodPlaylist[]) => StoredUser;
  resetUser: () => Response;
  evictUser: () => void;

  // Deep Diver
  currentCachedJustGoodPlaylist?: CachedJustGoodPlaylist;
  currentJustGoodPlaylist?: JustGoodPlaylist;
  // currentDeepDivePlaylistIndex?: number; // for deep dive driver
  currentDeepDiveView?: DeepDiverViewType;
  currentArtistDeepDiveAlbumIds?: Set<string>;
  currentDeepDiveArtistDiscography?: Album[];

  fetchCurrentDeepDiverPlaylist: (playlist_id: string, view: DeepDiverViewType) => Response;
  toggleAlbumForDeepDive: (albumId: string) => void;
  toggleAlbumGroupForDeepDive: (albumGroup: AlbumGroup) => void;
  createDeepDivePlaylist: () => Response;
  playCurrentDeepDivePlaylistTrack: () => Response;
  toggleCurrentTrackInJustGood: () => Response;
  markJustGoodPlaylistComplete: () => Response;
  togglePlaylistInDeepDiverPlaylists: (playlist: CachedPlaylist, i: number) => Response;

  // High Level Spotify Edit Actions
  artistResults: Artist[];
  loadedTracks: Track[];

  searchArtists: (term: string) => Response;
  createJustGoodPlaylist: (artist: Artist) => Response;
  clearSearchArtistResults: () => Response;
  loadAllArtistTracks: (artistID: string) => Response;
  applyLoadedToNewPlaylist: (name: string, description: string) => Response;
  getPlaylistTracks: (trackID: string) => Response;
  addTrackToPlaylist: (trackID: string, playlistID: string) => Response;
  removeTrackFromPlaylist: (trackID: string, playlistID: string) => Response;

  // High Level Spotify Player
  playing: boolean;
  currentTrackID?: string;
  currentTrackURI?: string;
  currentTrackName?: string;
  currentTrackArtist?: string;

  // both milliseconds
  currentTrackProgress?: number;
  currentTrackDuration?: number;
  currentTrackSmallImageURL?: string,
  currentTrackLargeImageURL?: string,

  // Up next/prev previewer
  // TODO: currentContextTracks: Images[]; ?

  togglePlaying: () => Response;
  skipNext: () => Response;
  skipPrevious: () => Response;
  seekToPosition: (value: number) => Response;
  pretendToProceedPosition: () => void;
  updatePlayer: () => Response;
  addCurrentTrackToPlaylist: (playlist: CachedPlaylist) => Response;
  // Want to also figure out whether this track is already in all the playlists in the cached? Store all of the track ids
  // inside memory? Load them in on load of app? Could be a lot, but don't want to make hella network requests either.
  // addCurrentTrackToLiked: () => Response; TODO: Do we want to load all of a person's liked songs tho?

  logStore: () => void;
}

const useSpotifyStore = () => {
  const store: SpotifyStore = useLocalObservable<SpotifyStore>(() => ({

    token: undefined,
    useToken: action(async () => {
      if (!store.token) {
        await store.fetchToken();
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

      if (store.token) {
        // Set initial states for app
        await store.fetchUser();
      }
    }),
    deauthorize: action(() => {
      store.evictUser();

      removeToken();

      store.token = undefined;
    }),

    setupLoading: false,
    userId: undefined,
    userName: undefined,
    userImg: undefined,
    userPlaylists: undefined,
    justGoodPlaylists: undefined,
    inProgressJustGoodPlaylists: undefined,
    plannedJustGoodPlaylists: undefined,
    justGoodPlaylistMap: undefined,

    fetchUser: action(async () => {
      let user = getUser();

      if (!user) {
        user = await store.setupUser();
      }

      // console.log('Fetched the user!');
      // console.log(user);

      store.userId = user.userId;
      store.userName = user.userName;
      store.userImg = user.userImg;
      store.userPlaylists = user.userPlaylists;
      store.deepDiverPlaylistIndexes = importMap(user.deepDiverPlaylistIndexes);
      store.deepDiverPlaylistTrackSets = importMapOfSets(user.deepDiverPlaylistTrackSets);

      store.justGoodPlaylistMap = {};
      store.justGoodPlaylistArtistMap = {};
      for (let i = 0; i < user.justGoodPlaylists.length; i++) {
        const playlist = user.justGoodPlaylists[i];
        store.justGoodPlaylistMap[playlist.id] = playlist;
        if (playlist.artistId) {
          store.justGoodPlaylistArtistMap[playlist.artistId] = playlist;
        }
      }

      const {
        finishedJustGoodPlaylists,
        inProgressJustGoodPlaylists,
        plannedJustGoodPlaylists,
      } = splitJustGoodPlaylists(user.justGoodPlaylists);

      store.justGoodPlaylists = finishedJustGoodPlaylists;
      store.inProgressJustGoodPlaylists = inProgressJustGoodPlaylists;
      store.plannedJustGoodPlaylists = plannedJustGoodPlaylists;

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

      const {
        justGoodPlaylists: justJustGoodPlaylists,
        inProgressJustGoodPlaylists,
        deepDivePlaylists,
        userPlaylists,
      } = splitPlaylists(playlists);

      console.log('splitted');
      console.log({ justJustGoodPlaylists, inProgressJustGoodPlaylists, deepDivePlaylists, userPlaylists });

      const justGoodPlaylists: CachedJustGoodPlaylist[] = [];

      const deepDiveMap: { [artistName: string]: CachedPlaylist } = {};
      deepDivePlaylists.forEach((playlist) => {
        deepDiveMap[playlist.name.substring(DEEP_DIVE_INDICATOR.length).trim()] = playlist;
      });

      console.log('Created the deep dive map.');
      console.log(deepDiveMap);

      for (let x = 0; x < 2; x++) {
        const inProgress: boolean = x === 1;
        const playlists = inProgress ? inProgressJustGoodPlaylists : justJustGoodPlaylists;
        const prefix = inProgress ? IN_PROGRESS_INDICATOR : JUST_GOOD_INDICATOR;

        for (let i = 0; i < playlists.length; i++) {
          console.log(`Processing ${inProgress ? 'In Progress' : ''} Just Good playlist ${i}.`);
          const playlist = playlists[i];

          console.log(playlist);
          const artistName = playlist.name.substring(prefix.length).trim();
          console.log(`Artist Name from playlist: ${artistName}`);

          const artist: ArtistResponse | undefined = (await searchForArtist(artistName, 1, token)).artists.items[0];
          console.log('Artist received from search:');
          console.log(artist);

          justGoodPlaylists.push({
            ...playlist,
            artistId: artist?.id,
            artistName,
            artistImg: getImages(artist?.images),
            inProgress,
            progress: 0,
            deepDivePlaylist: deepDiveMap[artistName],
          });

          console.log('Finished just good playlist.');
          console.log(justGoodPlaylists[justGoodPlaylists.length - 1]);
        }
      }

      store.userPlaylists = userPlaylists;
      store.deepDiverPlaylistIndexes = new Map();
      store.deepDiverPlaylistTrackSets = new Map();
      // store.justGoodPlaylists = justGoodPlaylists;

      const storedUser = store.storeUser(
        store.userId,
        store.userName,
        store.userImg,
        store.userPlaylists,
        store.deepDiverPlaylistIndexes,
        store.deepDiverPlaylistTrackSets,
        justGoodPlaylists,
      );

      store.setupLoading = false;

      return storedUser;
    }),

    saveUser: () => {
      if (store.userId && store.userName && store.userImg && store.userPlaylists && store.deepDiverPlaylistIndexes && store.deepDiverPlaylistTrackSets && store.justGoodPlaylists && store.inProgressJustGoodPlaylists && store.plannedJustGoodPlaylists) {
        console.log('saving user');
        store.storeUser(
          store.userId,
          store.userName,
          store.userImg,
          store.userPlaylists,
          store.deepDiverPlaylistIndexes,
          store.deepDiverPlaylistTrackSets,
          [...store.justGoodPlaylists, ...store.inProgressJustGoodPlaylists, ...store.plannedJustGoodPlaylists]
        )
      }
    },
    storeUser: (
      userId: string,
      userName: string,
      userImg: Images,
      userPlaylists: CachedPlaylist[],
      deepDiverPlaylistIndexes: Map<string, number>,
      deepDiverPlaylistTrackSets: Map<string, Set<string>>,
      justGoodPlaylists: CachedJustGoodPlaylist[],
    ) => (
      storeUser({
        userId,
        userImg,
        userName,
        userPlaylists,
        deepDiverPlaylistIndexes: exportMap(deepDiverPlaylistIndexes),
        deepDiverPlaylistTrackSets: exportMapOfSets(deepDiverPlaylistTrackSets),
        justGoodPlaylists,
      })
    ),

    resetUser: action(async () => {
      store.evictUser();
      await store.fetchUser();
      console.log("FINISHED RESETTING USER");
      return true;
    }),

    evictUser: action(() => {
      removeUser();

      store.userId = undefined;
      store.userName = undefined;
      store.userImg = undefined;
      store.userPlaylists = undefined;
      store.justGoodPlaylists = undefined;
      store.inProgressJustGoodPlaylists = undefined;
    }),

    currentCachedJustGoodPlaylist: undefined,
    currentJustGoodPlaylist: undefined,
    currentDeepDivePlaylistIndex: undefined, // for playing
    currentDeepDiveView: undefined,
    currentArtistDeepDiveAlbumIds: undefined,
    currentDeepDiveArtistDiscography: undefined,
    fetchCurrentDeepDiverPlaylist: async (playlistId: string, view: DeepDiverViewType) => {
      const token = await store.useToken();
      if (!token) return false;

      console.log(`searching for playlist with id = ${playlistId}`);
      const playlist = store.justGoodPlaylistMap && store.justGoodPlaylistMap[playlistId];

      console.log(toJS(playlist));

      if (playlist && playlist.artistId) {
        if (playlist.deepDivePlaylist) {
          // TODO: Load the just good playlist
          // TODO: Then it is already created and we just want to edit it.

          console.log('loading deep dive playlist');
          const justGoodPlaylistTrackIds = new Set((await getAllPlaylistTracks(playlist.id, token)).map(t => t.id));
          const deepDivePlaylistTracks = (await getAllPlaylistTracks(playlist.deepDivePlaylist.id, token));

          store.currentJustGoodPlaylist = {
            ...playlist,
            deepDivePlaylist: {
              id: playlist.deepDivePlaylist.id,
              name: playlist.deepDivePlaylist.name,
            },
            trackIds: justGoodPlaylistTrackIds,
            deepDiveTracks: deepDivePlaylistTracks,
          };

          console.log(toJS(store.currentJustGoodPlaylist));

          if (playlist.inProgress) {
            // store.currentDeepDivePlaylistIndex = playlist.progress || 0;
          } else {

          }
        } else {
          // set:
          store.currentCachedJustGoodPlaylist = playlist;

          // store.currentJustGoodPlaylist

          console.log('Fetching all artist albums');
          const response = await getAllArtistAlbums(playlist.artistId, token);
          console.log(response);

          store.currentDeepDiveArtistDiscography = response;

          const response2 = await getAllArtistAlbumsWithTracks(playlist.artistId, token);
          console.log("ACTUAL TEST");
          console.log(response2)

          store.currentArtistDeepDiveAlbumIds = new Set(response.map(a => a.id));
        }

        store.currentDeepDiveView = view;

        await store.updatePlayer();

        return true;
      } else {
        return false;
      }
    },
    toggleAlbumForDeepDive: action((albumId: string) => {
      if (!store.currentArtistDeepDiveAlbumIds) return;

      if (store.currentArtistDeepDiveAlbumIds.has(albumId)) {
        store.currentArtistDeepDiveAlbumIds.delete(albumId);
      } else {
        store.currentArtistDeepDiveAlbumIds.add(albumId);
      }
    }),
    toggleAlbumGroupForDeepDive: action((albumGroup: AlbumGroup) => {
      let turnOnAll = true;
      store.currentDeepDiveArtistDiscography?.forEach((album) => {
        if (album.albumGroup === albumGroup && store.currentArtistDeepDiveAlbumIds?.has(album.id)) {
          // this means we want to turn off
          store.toggleAlbumForDeepDive(album.id);
          turnOnAll = false;
        }
      });
      if (turnOnAll) {
        store.currentDeepDiveArtistDiscography?.forEach((album) => {
          if (album.albumGroup === albumGroup) {
            store.currentArtistDeepDiveAlbumIds?.add(album.id);
          }
        });
      }
    }),
    createDeepDivePlaylist: action(async () => {
      console.log('STARTING DEEP DIVE');
      const token = await store.useToken();
      if (!token) return false;
      if (!store.currentCachedJustGoodPlaylist || !store.currentDeepDiveArtistDiscography || !store.currentArtistDeepDiveAlbumIds) return false;

      const { artistId, artistName } = store.currentCachedJustGoodPlaylist;
      if (!artistId || !artistName) return false;


      console.log('CREATING DEEP DIVE PLAYLIST');
      // 1. Create Deep Dive Playlist
      const response = await createPlaylist(getDeepDivePlaylistName(artistName), getDeepDivePlaylistDescription(artistName), token);

      // 2. Get all album tracks (in order) (let's go through the disco playlist)
      // for (let i = 0; i < store.currentDeepDiveArtistDiscography.length; i++) {
      //   const album = store.currentDeepDiveArtistDiscography[i];
      //   if (store.currentArtistDeepDiveAlbumIds.has(album.id)) {
      //     // Fetch all tracks in any case.
      //     // const albumTracks = await getAlbumTracks()
      //     if (album.albumGroup === 'appears_on') {
      //
      //     }
      //   }
      // }
      console.log('GETTING ALL TRACKS');

      // 3. Get all appears on tracks (filter for only those that have the artist in them).
      const albums = (await getAllArtistAlbumsWithTracks(artistId, token)).filter((a) => store.currentArtistDeepDiveAlbumIds?.has(a.id));
      const trackURIs: string[] = [];
      const tracks: Track[] = [];
      albums.forEach((a) => a.tracks.forEach((t) => {
        tracks.push(t);
        trackURIs.push(t.uri)
      }));

      console.log(trackURIs)
      console.log('ADDING ALL TRACKS TO PLAYLIST');

      // 4. Add all to playlist.
      await addAllTracksToPlaylist(response.id, trackURIs, token);

      store.currentJustGoodPlaylist = {
        ...store.currentCachedJustGoodPlaylist,
        deepDivePlaylist: {
          id: response.id,
          name: response.name,
        },
        trackIds: new Set((await getAllPlaylistTracks(store.currentCachedJustGoodPlaylist.id, token)).map(t => t.id)),
        deepDiveTracks: tracks,
      };

      console.log('done');
      // 5. Update locally
      return true;
    }),

    artistResults: [],
    loadedTracks: [],

    searchArtists: action(async (term: string) => {
      const token = await store.useToken();
      if (!token) return false;

      const response = await searchForArtist(term, 5, token);

      // response.artists.items[0].followers.total;

      store.artistResults = deserializeArtists(response.artists.items);

      return true;
    }),

    createJustGoodPlaylist: action(async (artist: Artist) => {
      const token = await store.useToken();
      if (!token) return false;
      if (!store.justGoodPlaylistArtistMap || store.justGoodPlaylistArtistMap?.hasOwnProperty(artist.id)) return false;

      // TODO: ???????
      store.justGoodPlaylistArtistMap[artist.id] = {
        id: 'id',
        name: 'name',
        artistName: 'aristn',
        inProgress: true,
        progress: 0,
      };

      const name = getInProgressJustGoodPlaylistName(artist.name);
      const description = getInProgressJustGoodPlaylistDescription(artist.name);
      const response = await createPlaylist(name, description, token);

      const justGoodPlaylist: CachedJustGoodPlaylist = {
        id: response.id,
        name,
        artistName: artist.name,
        artistId: artist.id,
        artistImg: artist.img,
        inProgress: true,
        progress: 0,
      }

      store.plannedJustGoodPlaylists = [justGoodPlaylist, ...(store.plannedJustGoodPlaylists || [])];
      if (store.justGoodPlaylistArtistMap) store.justGoodPlaylistArtistMap[artist.id] = justGoodPlaylist;

      store.saveUser();

      return true;
    }),

    playCurrentDeepDivePlaylistTrack: action(async () => {
      const token = await store.useToken();
      if (!token) return false;
      if (!store.currentJustGoodPlaylist || (store.currentJustGoodPlaylist.progress === undefined)) return false;
      if (!store.currentJustGoodPlaylist?.deepDivePlaylist?.id) return false;

      console.log('Playing current deep dive playlist track');

      if (store.currentTrackID === store.currentJustGoodPlaylist.deepDiveTracks[store.currentJustGoodPlaylist.progress].id) {
        if (store.playing) {
          await pausePlayback(token);
        } else {
          await playPlayback(token);
        }
      } else {
        await playPlaylistPlayback(getPlaylistUri(store.currentJustGoodPlaylist?.deepDivePlaylist?.id), store.currentJustGoodPlaylist.progress, token);
      }

      return await store.updatePlayer();
    }),

    toggleCurrentTrackInJustGood: action(async () => {
      const token = await store.useToken();
      if (!token) return false;

      const playlistId = store.currentJustGoodPlaylist?.id;
      const track = store.currentJustGoodPlaylist?.progress !== undefined && store.currentJustGoodPlaylist?.deepDiveTracks?.[store.currentJustGoodPlaylist.progress];
      if (playlistId === undefined || !track) return false;

      if (store.currentJustGoodPlaylist?.trackIds.has(track.id)) {
        await removeTrackFromPlaylist(track.uri, playlistId, token);
        store.currentJustGoodPlaylist?.trackIds.delete(track.id);
      } else {
        await addTrackToPlaylist(playlistId, track.uri, token);
        store.currentJustGoodPlaylist?.trackIds.add(track.id);
      }

      return true;
    }),

    markJustGoodPlaylistComplete: action(async () => {
      const token = await store.useToken();
      if (!token) return false;

      const playlistID = store.currentJustGoodPlaylist?.id;
      const artistName = store.currentJustGoodPlaylist?.artistName;

      if (!store.currentJustGoodPlaylist || !playlistID || !artistName || !store.inProgressJustGoodPlaylists || !store.justGoodPlaylists) return false;

      const name = getJustGoodPlaylistName(artistName);
      const description = getJustGoodPlaylistDescription(artistName);

      await changePlaylistDetails(playlistID, name, description, token);

      store.currentJustGoodPlaylist.name = name;

      // Remove the playlist
      const index = store.inProgressJustGoodPlaylists?.findIndex((p) => p.id === playlistID);
      const playlist = store.inProgressJustGoodPlaylists[index];
      store.inProgressJustGoodPlaylists.splice(index);
      // Add to the finished
      store.justGoodPlaylists.push(playlist);

      return true;
    }),

    togglePlaylistInDeepDiverPlaylists: action(async (playlist: CachedPlaylist, i: number) => {
      const token = await store.useToken();
      if (!token) return false;
      if (store.deepDiverPlaylistTrackSets === undefined) return false;

      if (store.deepDiverPlaylistIndexes === undefined) return false;
      const { id } = playlist;
      if (store.deepDiverPlaylistIndexes.has(id)) {
        store.deepDiverPlaylistIndexes.delete(id);
      } else {
        store.deepDiverPlaylistIndexes.set(id, i)
        store.deepDiverPlaylistTrackSets.set(id, new Set((await getAllPlaylistTracks(id, token)).map(t => t.id)));
      }
      store.deepDiverPlaylistIndexes = { ...store.deepDiverPlaylistIndexes };
      store.saveUser();
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

      // await sleep(3000);
      setTimeout(() => store.updatePlayer(), 500);

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
      if (store.currentTrackProgress === undefined) store.currentTrackProgress = 0;
      store.currentTrackProgress += 1000; // 1 second
    }),

    updatePlayer: action(async () => {
      const token = await store.useToken();
      if (!token) return false;

      const playback = await getPlayback(token);

      runInAction(() => {
        store.playing = playback.is_playing;
        store.currentTrackID = playback.item?.id;
        store.currentTrackURI = playback.item?.uri;
        store.currentTrackName = playback.item?.name;
        store.currentTrackArtist = artistString(playback.item?.artists);
        store.currentTrackProgress = playback.progress_ms;
        store.currentTrackDuration = playback.item?.duration_ms;
        const { small, large } = getImages(playback.item?.album?.images);
        store.currentTrackSmallImageURL = small;
        store.currentTrackLargeImageURL = large;

        if (store.currentJustGoodPlaylist?.deepDivePlaylist && playback.context?.uri === getPlaylistUri(store.currentJustGoodPlaylist.deepDivePlaylist?.id)) {
          console.log('Updating current just good progress!');
          // Track number isn't zero-indexed
          for (let i = 0; i < store.currentJustGoodPlaylist.deepDiveTracks.length; i++) {
            // Find the index for the item in the curren just good playlist
            // TODO: more performant way of doing this?
            if (store.currentJustGoodPlaylist.deepDiveTracks[i].id === playback.item.id) {
              store.currentJustGoodPlaylist.progress = i;
              break;
            }
          }
        }

        console.log('CHECK PLAYER STATUS UPDATED TO:');
        console.log(`Playing: ${store.playing}`);
        console.log(`ID: ${store.currentTrackID}`);
        console.log(`URI: ${store.currentTrackURI}`);
        console.log(`Track Name: ${store.currentTrackName}`);
        console.log(`Track Artist: ${store.currentTrackArtist}`);
        console.log(`Track Progress: ${store.currentTrackProgress}`);
        console.log(`Track Duration: ${store.currentTrackDuration}`);
        console.log(`Small Image URL: ${store.currentTrackSmallImageURL}`);
        console.log(`Large Image URL: ${store.currentTrackLargeImageURL}`);
      });

      return true;
    }),

    addCurrentTrackToPlaylist: action(async (playlist: CachedPlaylist) => {
      const token = await store.useToken();
      if (!token) return false;
      if (store.currentTrackURI === undefined) return false;

      await addTrackToPlaylist(playlist.id, store.currentTrackURI, token);

      return true;
    }),

    // really slow
    logStore: () => console.log(Object.fromEntries(Object.entries(toJS(store)).filter(([key, value]) => (typeof value !== 'function')))),
  }));

  return store;
};

export default useSpotifyStore;
