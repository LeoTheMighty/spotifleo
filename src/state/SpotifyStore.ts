import { action, runInAction, toJS } from 'mobx';
import { useLocalObservable } from 'mobx-react';
import {
  searchForArtist,
  playPlayback,
  pausePlayback,
  getPlayback,
  nextPlayback,
  prevPlayback,
  seekPlayback,
  getAllCurrentUserPlaylists,
  getCurrentUserProfile,
  getAllPlaylistTracks,
  createPlaylist,
  getAllArtistAlbumsWithTracks,
  addAllTracksToPlaylist,
  playPlaylistPlayback,
  addTrackToPlaylist,
  changePlaylistDetails,
  removeTrackFromPlaylist,
  LIKED_INDICATOR,
  getAllCurrentUserLikedSongs,
  removeTrackFromLiked,
  addTrackToLiked,
  replaceAllPlaylistItems, toggleShuffle, setRepeatMode
} from '../api/Spotify';
import {
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
  getJustGoodPlaylistDescription,
  importMap,
  exportMap,
  getPlaylistUri,
  getID,
  justGoodToCached,
  nestProgress,
  wrapIndex,
  sleep, BACKOFF_LIMIT, backoffTimeoutMs
} from '../logic/common';
import {
  Artist,
  ArtistResponse,
  CachedPlaylist,
  Images,
  CachedJustGoodPlaylist,
  Token,
  Track,
  JustGoodPlaylist,
  DeepDiverViewType,
  Album,
  AlbumGroup,
  FetchedAlbum,
  Progress,
  FetchedCachedPlaylist,
  PlayingTrack,
  HelpViewType, APIError
} from '../types';
import { deserializeArtists, deserializePlayingTrack, deserializeTrack } from '../logic/serializers';
import { getUser, getToken, storeToken, storeUser, StoredUser, removeUser, removeToken } from '../logic/storage';
import { fetchRefreshToken, shouldRefreshToken } from '../auth/authHelper';

/*

// TODO !!!!!!!!!!!! YOU COULD LOOK AT SOMEONE ELSE'S PLAYLIST IN VIEW-MODE !!!!!!!!!!!!
TODO: DO PROMISE ALLs TO DO THINGS IN PARALLEL?
TODO:   COULD POTENTIALLY FIND THE TOTAL NUMBER OF REQUESTS (tracks.total) AND THEN FETCH IN PARALLEL
TODO: DETECT WHETHER A CHANGE IN A PLAYLIST HAS BEEN MADE WITH THE MOST RECENT TRACK?
TODO: DETECT A CHANGE IN ARTIST DISCOGRAPHY?
TODO: DON'T LOAD EVERYTHING AT ONCE AND UTILIZE OFFSET LOADING?

 */

const fail = (reason: string) => { throw new Error(`Failed Action: ${reason}`) };
const noToken = () => fail('No Token');
const notInitialized = (property?: string) => fail(`Not initialized${property ? `: ${property}` : ''}`);

/**
 * The store to store all the User's Spotify information.
 */
export interface SpotifyStore {
  // ============ PROPERTIES ================
  // Spotify Authentication
  token?: Token;

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
  justGoodPlaylistMap?: Map<string, CachedJustGoodPlaylist>,
  justGoodPlaylistArtistMap?: Map<string, CachedJustGoodPlaylist>,

  // Deep Diver
  currentPlayingJustGoodPlaylist?: CachedJustGoodPlaylist;
  currentJustGoodPlaylist?: JustGoodPlaylist;
  currentDeepDiveView?: DeepDiverViewType;
  currentArtistDeepDiveAlbumIds?: Set<string>;
  currentDeepDiveArtistDiscography?: Map<string, FetchedAlbum>; // album ID to Album object
  currentDeepDiveArtistAlbumIDsGrouped?: string[]; // always sorted chronologically, albums, singles, appears
  currentDeepDiveArtistAlbumIDsOrdered?: string[]; // album IDs current ordering, not including missing ones

  // High Level Spotify Edit Actions
  artistResults: Artist[];

  // High Level Spotify Player
  currentTrack?: PlayingTrack;

  // Loading Logic
  progress?: Progress; // Not loading if undefined

  // Help Logic
  helpView?: HelpViewType;
  welcomeStep?: number;

  // ============ COMPUTED ================
  likedPlaylist: CachedPlaylist | undefined;
  likedTrackSet: Set<string> | undefined;

  allJustGoodPlaylists: CachedJustGoodPlaylist[] | undefined;
  currentDeepDiveArtistDiscographyGrouped: FetchedAlbum[] | undefined;
  currentDeepDiveArtistDiscographyOrdered: FetchedAlbum[] | undefined;

  isPlayingCurrentDeepDivePlaylist: boolean;

  playing: boolean;

  // ============ FUNCTIONS ================
  // Spotify Authentication
  useToken: () => Promise<string | undefined>;
  newToken: (accessToken: string, refreshToken: string, expiresIn: number) => void;
  fetchToken: () => void;
  deauthorize: () => void;

  // User Setup
  fetchUser: () => Promise<void>;
  setupUser: () => Promise<StoredUser>;
  saveUser: () => void;
  storeUser: (userId: string, userName: string, userImg: Images, userPlaylists: CachedPlaylist[], deepDiverPlaylistIndexes: Map<string, number>, deepDiverPlaylistTrackSets: Map<string, Set<string>>, justGoodPlaylists: CachedJustGoodPlaylist[]) => StoredUser;
  resetUser: () => Promise<void>;
  evictUser: () => void;

  // Deep Diver
  fetchCurrentDeepDiverPlaylist: (playlist_id: string, view?: DeepDiverViewType) => Promise<void>;
  toggleAlbumForDeepDive: (albumId: string) => void;
  toggleAlbumGroupForDeepDive: (albumGroup: AlbumGroup) => void;
  createOrUpdateDeepDivePlaylist: (albums: FetchedAlbum[]) => Promise<void>;
  playCurrentDeepDivePlaylistTrack: () => Promise<void>;
  playTrackInDeepDivePlaylist: (track: Track) => Promise<void>;
  toggleCurrentTrackInJustGood: () => Promise<void>;
  toggleTrackInJustGood: (track: Track) => Promise<void>;
  toggleTrackInPlayingJustGood: (track: Track) => Promise<void>;
  toggleCurrentTrackInPlayingJustGood: () => Promise<void>;
  toggleJustGoodPlaylistComplete: () => Promise<void>;
  togglePlaylistInDeepDiverPlaylists: (playlist: CachedPlaylist, i: number) => Promise<void>;
  updateJustGoodPlaylistFromCurrent: () => void;
  prevDeepDiveTrack: () => Promise<void>;
  nextDeepDiveTrack: () => Promise<void>;

  // Artist Search
  searchArtists: (term: string) => Promise<void>;
  clearSearchArtistResults: () => Promise<void>;
  createJustGoodPlaylist: (artist: Artist) => Promise<void>;

  // High Level Spotify Player
  togglePlaying: () => Promise<void>;
  skipNext: () => Promise<void>;
  skipPrevious: () => Promise<void>;
  seekToPosition: (value: number) => Promise<void>;
  pretendToProceedPosition: () => void;
  updatePlayer: () => Promise<void>;
  toggleTrackInDeepDiverPlaylist: (track: Track, playlist: CachedPlaylist) => Promise<void>;
  toggleCurrentTrackInPlaylist: (playlist: CachedPlaylist) => Promise<void>;

  // Low Level Helpers
  toggleTrackInFetchedPlaylist: (track: Track, playlist: FetchedCachedPlaylist) => Promise<void>;

  // Loading Logic
  startProgress: (task?: string) => void;
  updateProgress: (progress: number, current?: string) => void;
  finishProgress: () => void;

  // Help
  setHelpView: (helpView: HelpViewType) => void;
  skipWelcome: () => void;

  call: <T>(apiPromise: Promise<T>, backoff?: number) => Promise<T>;

  // ============ DEBUGGING ================
  logStore: () => void;
}

/**
 * Use the Spotify Mobx Store. A ridiculously monolith-ed mobx store because I am quite
 * new at this mobx stuff don't judge me breh.
 */
const useSpotifyStore = () => {
  const store: SpotifyStore = useLocalObservable<SpotifyStore>(() => ({
    // ============ INITIAL PROPERTIES ================
    setupLoading: true,

    artistResults: [],

    showHelpScreen: false,

    welcomeStep: undefined,

    // ============ COMPUTED ================
    get likedPlaylist(): CachedPlaylist | undefined {
      return store.userPlaylists?.[0];
    },

    get likedTrackSet(): Set<string> | undefined {
      return store.deepDiverPlaylistTrackSets?.get(LIKED_INDICATOR);
    },

    get allJustGoodPlaylists(): CachedJustGoodPlaylist[] | undefined {
      return (store.justGoodPlaylists && store.inProgressJustGoodPlaylists && store.plannedJustGoodPlaylists) ?
        [...store.justGoodPlaylists, ...store.inProgressJustGoodPlaylists, ...store.plannedJustGoodPlaylists] :
        undefined;
    },

    get currentDeepDiveArtistDiscographyGrouped(): FetchedAlbum[] | undefined {
      if (!store.currentDeepDiveArtistDiscography || !store.currentDeepDiveArtistAlbumIDsGrouped) return undefined;

      const albums: FetchedAlbum[] = [];
      for (let i = 0; i < store.currentDeepDiveArtistAlbumIDsGrouped.length; i++) {
        const id = store.currentDeepDiveArtistAlbumIDsGrouped[i];
        const album = store.currentDeepDiveArtistDiscography.get(id);
        if (album) {
          albums.push(album);
        }
      }
      return albums;
    },

    get currentDeepDiveArtistDiscographyOrdered(): FetchedAlbum[] | undefined {
      if (!store.currentDeepDiveArtistDiscography || !store.currentDeepDiveArtistAlbumIDsOrdered) return undefined;

      const albums: FetchedAlbum[] = [];
      for (let i = 0; i < store.currentDeepDiveArtistAlbumIDsOrdered.length; i++) {
        const id = store.currentDeepDiveArtistAlbumIDsOrdered[i];
        const album = store.currentDeepDiveArtistDiscography.get(id);
        if (album) {
          albums.push(album);
        }
      }
      return albums;
    },

    get isPlayingCurrentDeepDivePlaylist(): boolean {
      return store.currentJustGoodPlaylist?.id ?
        (store.currentJustGoodPlaylist.id === store.currentPlayingJustGoodPlaylist?.id) :
        false;
    },

    get playing(): boolean {
      return store.currentTrack?.playing || false;
    },

    // ============ FUNCTIONS ================

    /**
     * Use an access token for Spotify. Handles fetching and refreshing if necessary.
     */
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

    /**
     * Store a newly created token.
     */
    newToken: action((accessToken, refreshToken, expiresIn) => {
      // getTime and constructor is in milliseconds
      const expires = new Date(new Date().getTime() + (expiresIn * 1000));
      const token: Token = { refreshToken, accessToken, expires };

      storeToken(token);
      store.token = token;
    }),

    /**
     * Fetches a token from the
     */
    fetchToken: action(async () => {
      store.setupLoading = true;

      store.token = getToken();

      if (store.token) {
        // Set initial states for app
        await store.fetchUser();
      }

      store.setupLoading = false;
    }),

    /**
     *
     */
    deauthorize: action(() => {
      store.setupLoading = true;

      store.evictUser();

      removeToken();

      store.token = undefined;

      store.setupLoading = false;
    }),

    /**
     * TODO
     */
    fetchUser: action(async () => {
      let user = getUser();

      if (!user) {
        user = await store.setupUser();
      }

      store.userId = user.userId;
      store.userName = user.userName;
      store.userImg = user.userImg;
      store.userPlaylists = user.userPlaylists;
      store.deepDiverPlaylistIndexes = importMap(user.deepDiverPlaylistIndexes);
      store.deepDiverPlaylistTrackSets = importMapOfSets(user.deepDiverPlaylistTrackSets);

      // Remove any extraneous info that might have been loaded in
      // TODO We should not save it in the first place...
      // user.justGoodPlaylists = user.justGoodPlaylists.map(justGoodToCached);

      store.justGoodPlaylistMap = new Map();
      store.justGoodPlaylistArtistMap = new Map();
      for (let i = 0; i < user.justGoodPlaylists.length; i++) {
        const playlist = user.justGoodPlaylists[i];
        store.justGoodPlaylistMap.set(playlist.id, playlist);
        if (playlist.artistId) {
          store.justGoodPlaylistArtistMap.set(playlist.artistId, playlist);
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
    }),

    /**
     * Creates and stores a new user, fetching all of the details using the spotify API.
     *
     * Fetches:
     * - User profile
     * - All User playlists
     *    - The normal ones
     *    - The Just Good Playlists already created
     */
    setupUser: action(async () => {
      const token = await store.useToken();
      if (!token) return noToken();

      store.startProgress('Setting up the user');
      store.welcomeStep = 0;
      store.helpView = 'welcome';

      store.setupLoading = true;

      console.log('Fetching user profile!')

      const user = await store.call(getCurrentUserProfile(token));

      console.log('Loaded profile.');
      console.log(user);

      store.userId = user.id;
      store.userName = user.display_name;
      store.userImg = getImages(user.images);

      console.log('Fetching all user playlists...')
      store.updateProgress(0.1, 'Fetching all user playlists')

      const cb1 = (p: number) => store.updateProgress(nestProgress(p, 0.1, 0.3));
      const playlists = await store.call(getAllCurrentUserPlaylists(token, cb1));

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

      store.updateProgress(0.3, 'Fetching Just Good Details from existing playlists...');

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

          const artist: ArtistResponse | undefined = (await store.call(searchForArtist(artistName, 1, token))).artists.items[0];
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

          store.updateProgress(nestProgress(justGoodPlaylists.length / (justJustGoodPlaylists.length + inProgressJustGoodPlaylists.length), 0.3, 0.6));
        }
      }

      store.userPlaylists = userPlaylists;

      console.log('Fetching User Liked songs');
      store.updateProgress(0.6, 'Fetching and caching all User Liked tracks...');

      const cb2 = (progress: number, c?: string) => store.updateProgress(nestProgress(progress, 0.6, 0.9), c);
      const trackSet = new Set((await store.call(getAllCurrentUserLikedSongs(token, cb2))).map((t) => t.id));

      const likedPlaylist: CachedPlaylist = {
        id: LIKED_INDICATOR,
        name: 'Liked Songs',
        numTracks: trackSet.size,
      };

      store.deepDiverPlaylistIndexes = new Map();
      store.deepDiverPlaylistTrackSets = new Map();

      store.userPlaylists.unshift(likedPlaylist);
      store.deepDiverPlaylistIndexes.set(LIKED_INDICATOR, 0);
      store.deepDiverPlaylistTrackSets.set(LIKED_INDICATOR, trackSet);

      const storedUser = store.storeUser(
        store.userId,
        store.userName,
        store.userImg,
        store.userPlaylists,
        store.deepDiverPlaylistIndexes,
        store.deepDiverPlaylistTrackSets,
        justGoodPlaylists,
      );

      console.log('Storing finished user information');
      store.finishProgress();

      store.setupLoading = false;

      return storedUser;
    }),

    /**
     * TODO
     */
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

    /**
     * TODO
     *
     * @param userId
     * @param userName
     * @param userImg
     * @param userPlaylists
     * @param deepDiverPlaylistIndexes
     * @param deepDiverPlaylistTrackSets
     * @param justGoodPlaylists
     */
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

    /**
     * TODO
     */
    resetUser: action(async () => {
      store.evictUser();
      await store.fetchUser();
      console.log("FINISHED RESETTING USER");
    }),

    /**
     * TODO
     */
    evictUser: action(() => {
      removeUser();

      store.userId = undefined;
      store.userName = undefined;
      store.userImg = undefined;
      store.userPlaylists = undefined;
      store.justGoodPlaylists = undefined;
      store.inProgressJustGoodPlaylists = undefined;
    }),

    /**
     *
     * @param playlistId
     * @param view
     */
    fetchCurrentDeepDiverPlaylist: async (playlistId: string, view?: DeepDiverViewType) => {
      const token = await store.useToken();
      if (!token) return noToken();

      console.log(`searching for playlist with id = ${playlistId}`);
      const playlist = store.justGoodPlaylistMap && store.justGoodPlaylistMap.get(playlistId);
      if (!playlist || !playlist.artistId) return notInitialized();

      store.currentDeepDiveView = undefined;

      if (store.currentJustGoodPlaylist?.id !== playlistId) {
        store.startProgress(`Fetching Just Good ${playlist.artistName}`);
        store.updateProgress(0.1, 'Getting all albums and tracks for the artist');
        console.log('Fetching all artist albums');
        const cb1 = (p: number) => store.updateProgress(nestProgress(p, 0.1, 0.7));
        const response = await store.call(getAllArtistAlbumsWithTracks(playlist.artistId, token, cb1));
        console.log(response);

        store.currentDeepDiveArtistAlbumIDsGrouped = [];
        store.currentDeepDiveArtistDiscography = new Map();
        for (let i = 0; i < response.length; i++) {
          const album = response[i];
          store.currentDeepDiveArtistAlbumIDsGrouped.push(album.id);
          store.currentDeepDiveArtistDiscography.set(album.id, album);
        }

        if (playlist.deepDivePlaylist) {
          store.updateProgress(0.7, 'Fetching all just good playlist tracks');
          console.log('loading deep dive playlist');
          const cb2 = (p: number) => store.updateProgress(nestProgress(p, 0.7, 0.8));
          const justGoodPlaylistTrackIds = new Set((await store.call(getAllPlaylistTracks(playlist.id, token, cb2))).map(t => t.id));
          store.updateProgress(0.8, 'Fetching all deep dive playlist tracks');
          const cb3 = (p: number) => store.updateProgress(nestProgress(p, 0.8, 0.9));
          const deepDivePlaylistTracks = (await store.call(getAllPlaylistTracks(playlist.deepDivePlaylist.id, token, cb3)));

          store.currentDeepDiveArtistAlbumIDsOrdered = [];
          for (let i = 0; i < deepDivePlaylistTracks.length; i++) {
            const track = deepDivePlaylistTracks[i];
            if (track.albumId && !store.currentDeepDiveArtistAlbumIDsOrdered.find(id => id === track.albumId)) {
              store.currentDeepDiveArtistAlbumIDsOrdered.push(track.albumId);
            }
          }

          store.currentJustGoodPlaylist = {
            ...playlist,
            deepDivePlaylist: {
              id: playlist.deepDivePlaylist.id,
              name: playlist.deepDivePlaylist.name,
              numTracks: playlist.deepDivePlaylist.numTracks,
            },
            trackIds: justGoodPlaylistTrackIds,
            deepDiveTracks: deepDivePlaylistTracks,
          };

          store.currentArtistDeepDiveAlbumIds = new Set();
          for (let i = 0; i < deepDivePlaylistTracks.length; i++) {
            const { albumId } = deepDivePlaylistTracks[i];
            if (albumId !== undefined) store.currentArtistDeepDiveAlbumIds.add(albumId);
          }
        } else {
          // set:
          store.currentJustGoodPlaylist = {
            ...playlist,
            trackIds: new Set<string>(),
          };

          store.currentArtistDeepDiveAlbumIds = new Set(response.map(a => a.id));
        }
      }

      // Set the default view
      const defaultView = playlist.deepDivePlaylist ? (playlist.inProgress ? 'deep-dive' : 'view-deep-dive') : 'edit-deep-dive';

      store.currentDeepDiveView = view || defaultView;

      store.finishProgress();

      await store.updatePlayer();
    },

    /**
     * TODO
     */
    toggleAlbumForDeepDive: action((albumId: string) => {
      if (!store.currentArtistDeepDiveAlbumIds) return notInitialized();

      if (store.currentArtistDeepDiveAlbumIds.has(albumId)) {
        store.currentArtistDeepDiveAlbumIds.delete(albumId);
      } else {
        store.currentArtistDeepDiveAlbumIds.add(albumId);
      }
    }),

    /**
     * TODO
     */
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

    /**
     * TODO
     */
    createOrUpdateDeepDivePlaylist: action(async (albums: FetchedAlbum[]) => {
      console.log('STARTING DEEP DIVE');
      store.startProgress(`${store.currentJustGoodPlaylist?.deepDivePlaylist ? 'Updating' : 'Creating'} Deep Dive Playlist`);
      store.logStore();
      const token = await store.useToken();
      if (!token) return noToken();
      if (!store.currentJustGoodPlaylist || !store.currentDeepDiveArtistDiscography || !store.currentArtistDeepDiveAlbumIds || store.inProgressJustGoodPlaylists === undefined || store.plannedJustGoodPlaylists === undefined) return notInitialized();

      const { artistId, artistName } = store.currentJustGoodPlaylist;
      if (!artistId || !artistName) return notInitialized('Artist details for just good playlist');

      let deepDiveId;
      let deepDiveName;
      if (store.currentJustGoodPlaylist.deepDivePlaylist === undefined) {
        console.log('CREATING DEEP DIVE PLAYLIST');
        store.updateProgress(0.1, 'Creating the playlist');
        // 1. Create Deep Dive Playlist
        const response = await store.call(createPlaylist(getDeepDivePlaylistName(artistName), getDeepDivePlaylistDescription(artistName), false, token));
        deepDiveId = response.id;
        deepDiveName = response.name;
      } else {
        deepDiveId = store.currentJustGoodPlaylist.deepDivePlaylist.id;
        deepDiveName = store.currentJustGoodPlaylist.deepDivePlaylist.name;
      }

      console.log('GETTING ALL TRACKS');
      store.updateProgress(0.2, 'Getting all artist albums and tracks');

      // 2. Get all album tracks (in order) (let's go through the disco playlist)
      // 3. Get all appears on tracks (filter for only those that have the artist in them).
      const filteredAlbums = albums.filter((a) => store.currentArtistDeepDiveAlbumIds?.has(a.id));
      const trackURIs: string[] = [];
      const tracks: Track[] = [];
      filteredAlbums.forEach((a) => a.tracks.forEach((t) => {
        tracks.push(t);
        trackURIs.push(t.uri)
      }));

      console.log(trackURIs)
      console.log('ADDING ALL TRACKS TO PLAYLIST');
      store.updateProgress(0.6, 'Adding all chosen tracks to playlist');

      if (store.currentJustGoodPlaylist.deepDivePlaylist === undefined) {
        // 4. Add all to playlist.
        await store.call(addAllTracksToPlaylist(deepDiveId, trackURIs, token));
      } else {
        await store.call(replaceAllPlaylistItems(deepDiveId, trackURIs, token));
      }

      store.updateProgress(0.8, 'Parsing all playlist track IDs');

      const cb = (p: number) => store.updateProgress(nestProgress(p, 0.8, 0.9));
      store.currentJustGoodPlaylist = {
        ...store.currentJustGoodPlaylist,
        deepDivePlaylist: {
          id: deepDiveId,
          name: deepDiveName,
          numTracks: tracks.length,
        },
        trackIds: new Set((await store.call(getAllPlaylistTracks(store.currentJustGoodPlaylist.id, token, cb))).map(t => t.id)),
        deepDiveTracks: tracks,
        progress: 0,
      };

      const index = store.plannedJustGoodPlaylists?.findIndex(p => p.id === store.currentJustGoodPlaylist!.id);
      store.plannedJustGoodPlaylists?.splice(index, 1);
      store.inProgressJustGoodPlaylists.push(store.currentJustGoodPlaylist);

      store.currentDeepDiveArtistAlbumIDsOrdered = albums.map(a => a.id);

      store.saveUser();

      store.finishProgress();
    }),

    /**
     * TODO
     */
    searchArtists: action(async (term: string) => {
      const token = await store.useToken();
      if (!token) return noToken();

      const response = await store.call(searchForArtist(term, 5, token));

      store.artistResults = deserializeArtists(response.artists.items);
    }),

    /**
     * TODO
     */
    createJustGoodPlaylist: action(async (artist: Artist) => {
      const token = await store.useToken();
      if (!token) return noToken();
      if (!store.justGoodPlaylistMap || !store.justGoodPlaylistArtistMap || store.justGoodPlaylistArtistMap?.hasOwnProperty(artist.id)) return fail('artist map not intialized');

      // ok i figured it out i wrote a "mutex lock"
      store.justGoodPlaylistArtistMap.set(artist.id, {
        id: '',
        name: 'name',
        artistName: 'aristn',
        inProgress: true,
        progress: 0,
        numTracks: 0,
      });

      const name = getInProgressJustGoodPlaylistName(artist.name);
      const description = getInProgressJustGoodPlaylistDescription(artist.name);
      const response = await store.call(createPlaylist(name, description, false, token));

      const justGoodPlaylist: CachedJustGoodPlaylist = {
        id: response.id,
        name,
        artistName: artist.name,
        artistId: artist.id,
        artistImg: artist.img,
        inProgress: true,
        progress: 0,
        numTracks: 0,
      }

      store.plannedJustGoodPlaylists = [justGoodPlaylist, ...(store.plannedJustGoodPlaylists || [])];
      store.justGoodPlaylistMap.set(response.id, justGoodPlaylist);
      store.justGoodPlaylistArtistMap.set(artist.id, justGoodPlaylist);

      await store.saveUser();
    }),

    /**
     * TODO
     */
    playCurrentDeepDivePlaylistTrack: action(async () => {
      const token = await store.useToken();
      if (!token) return noToken();
      if (!store.currentJustGoodPlaylist || (store.currentJustGoodPlaylist.progress === undefined)) return fail('Current just good playlist not initialized');
      if (!store.currentJustGoodPlaylist?.deepDivePlaylist?.id) return fail('Just good playlist has no id?');

      console.log('Playing current deep dive playlist track');

      if (store.currentTrack?.id === store.currentJustGoodPlaylist?.deepDiveTracks?.[store.currentJustGoodPlaylist.progress].id) {
        if (store.currentTrack?.playing) {
          await store.call(pausePlayback(token));
        } else {
          await store.call(playPlayback(token));
        }
      } else {
        const uri = getPlaylistUri(store.currentJustGoodPlaylist.deepDivePlaylist.id);
        const { progress } = store.currentJustGoodPlaylist;
        await store.call(playPlaylistPlayback(uri, progress, token));
        await store.call(toggleShuffle(false, token));
        await store.call(setRepeatMode('context', token));
      }

      setTimeout(() => store.updatePlayer(), 500);

      return await store.updatePlayer();
    }),

    prevDeepDiveTrack: action(async () => {
      const token = await store.useToken();
      if (!token) return noToken();
      if (store.currentJustGoodPlaylist?.progress === undefined || !store.currentJustGoodPlaylist.deepDiveTracks) return notInitialized();

      if (store.isPlayingCurrentDeepDivePlaylist) {
        await store.skipPrevious();
      } else {
        store.currentJustGoodPlaylist.progress = wrapIndex(store.currentJustGoodPlaylist.progress - 1, store.currentJustGoodPlaylist.deepDiveTracks.length)
      }
    }),

    nextDeepDiveTrack: action(async () => {
      const token = await store.useToken();
      if (!token) return noToken();
      if (store.currentJustGoodPlaylist?.progress === undefined || !store.currentJustGoodPlaylist.deepDiveTracks) return notInitialized();

      if (store.isPlayingCurrentDeepDivePlaylist) {
        await store.skipNext();
      } else {
        store.currentJustGoodPlaylist.progress = wrapIndex(store.currentJustGoodPlaylist.progress + 1, store.currentJustGoodPlaylist.deepDiveTracks.length)
      }
    }),

    /**
     * TODO
     */
    playTrackInDeepDivePlaylist: action(async (track: Track) => {
      if (!store.currentJustGoodPlaylist?.deepDiveTracks) return notInitialized();

      for (let i = 0; i < store.currentJustGoodPlaylist?.deepDiveTracks.length; i++) {
        const progressTrack = store.currentJustGoodPlaylist?.deepDiveTracks[i];
        if (progressTrack.id === track.id) {
          store.currentJustGoodPlaylist.progress = i;
          await store.playCurrentDeepDivePlaylistTrack();
        }
      }
    }),

    toggleTrackInJustGood: action(async (track: Track) => {
      console.log('toggle');

      const token = await store.useToken();
      if (!token) return noToken();
      if (!store.currentJustGoodPlaylist?.trackIds) return notInitialized();

      if (!store.currentJustGoodPlaylist.inProgress) {
        store.helpView = 'not-in-progress';
        return;
      }

      const playlistId = store.currentJustGoodPlaylist?.id;
      if (playlistId === undefined || !track) return fail('Tracks not initialized');

      await store.toggleTrackInFetchedPlaylist(track, store.currentJustGoodPlaylist);

      if (store.isPlayingCurrentDeepDivePlaylist) {
        // Update the duplicated playlist if they're the same
        if (store.currentJustGoodPlaylist.trackIds.has(track.id)) {
          store.currentPlayingJustGoodPlaylist?.trackIds?.add(track.id);
          store.currentPlayingJustGoodPlaylist?.numTracks && (store.currentPlayingJustGoodPlaylist.numTracks += 1);
        } else {
          store.currentPlayingJustGoodPlaylist?.trackIds?.delete(track.id);
          store.currentPlayingJustGoodPlaylist?.numTracks && (store.currentPlayingJustGoodPlaylist.numTracks -= 1);
        }
      }
    }),

    toggleTrackInPlayingJustGood: action(async (track: Track) => {
      const token = await store.useToken();
      if (!token) return noToken();
      if (!store.currentPlayingJustGoodPlaylist?.trackIds) return notInitialized();

      if (!store.currentPlayingJustGoodPlaylist.inProgress) {
        store.helpView = 'not-in-progress';
        return;
      }

      const playlistId = store.currentPlayingJustGoodPlaylist?.id;
      if (playlistId === undefined || !track) return fail('Tracks not initialized');

      await store.toggleTrackInFetchedPlaylist(track, store.currentPlayingJustGoodPlaylist);

      if (store.isPlayingCurrentDeepDivePlaylist) {
        // Update the duplicated playlist if they're the same
        if (store.currentPlayingJustGoodPlaylist.trackIds.has(track.id)) {
          store.currentJustGoodPlaylist?.trackIds?.add(track.id);
          store.currentJustGoodPlaylist?.numTracks && (store.currentJustGoodPlaylist.numTracks += 1);
        } else {
          store.currentJustGoodPlaylist?.trackIds?.delete(track.id);
          store.currentJustGoodPlaylist?.numTracks && (store.currentJustGoodPlaylist.numTracks -= 1);
        }
      }
    }),

    /**
     * TODO
     */
    toggleCurrentTrackInJustGood: action(async () => {
      if (store.currentJustGoodPlaylist?.progress === undefined || !store.currentJustGoodPlaylist.deepDiveTracks) return notInitialized();

      return store.toggleTrackInJustGood(store.currentJustGoodPlaylist.deepDiveTracks[store.currentJustGoodPlaylist.progress])
    }),

    toggleCurrentTrackInPlayingJustGood: action(async () => {
      if (store.currentTrack === undefined) return notInitialized();

      return store.toggleTrackInPlayingJustGood(store.currentTrack);
    }),

    /**
     * TODO
     */
    toggleJustGoodPlaylistComplete: action(async () => {
      const token = await store.useToken();
      if (!token) return noToken();

      const inProgress = store.currentJustGoodPlaylist?.inProgress;
      const playlistID = store.currentJustGoodPlaylist?.id;
      const artistName = store.currentJustGoodPlaylist?.artistName;

      if (!store.currentJustGoodPlaylist || !playlistID || !artistName || !store.inProgressJustGoodPlaylists || !store.justGoodPlaylists || inProgress === undefined) return fail('mark playlist complete not initialized');

      const name = inProgress ? getJustGoodPlaylistName(artistName) : getInProgressJustGoodPlaylistName(artistName);
      const description = inProgress ? getJustGoodPlaylistDescription(artistName) : getInProgressJustGoodPlaylistDescription(artistName);

      await store.call(changePlaylistDetails(playlistID, name, description, inProgress, token));

      store.currentJustGoodPlaylist.name = name;
      store.currentJustGoodPlaylist.inProgress = !inProgress;

      // Remove the playlist
      const index = (inProgress ? store.inProgressJustGoodPlaylists : store.justGoodPlaylists)?.findIndex((p) => p.id === playlistID);
      const playlist = inProgress ? store.inProgressJustGoodPlaylists[index] : store.justGoodPlaylists[index];
      inProgress ? store.inProgressJustGoodPlaylists.splice(index, 1) : store.justGoodPlaylists.splice(index, 1);

      // Add to the other playlist
      inProgress ? store.justGoodPlaylists.push(playlist) : store.inProgressJustGoodPlaylists.push(playlist);

      await store.saveUser();
    }),

    /**
     * TODO
     */
    togglePlaylistInDeepDiverPlaylists: action(async (playlist: CachedPlaylist, i: number) => {
      const token = await store.useToken();
      if (!token) return noToken();
      if (store.deepDiverPlaylistTrackSets === undefined || store.deepDiverPlaylistIndexes === undefined) return fail('Deep diver playlists not initialized');

      const { id } = playlist;
      if (store.deepDiverPlaylistIndexes.has(id)) {
        store.deepDiverPlaylistIndexes.delete(id);
      } else {
        store.startProgress('Adding additional playlist')
        store.updateProgress(0.1, 'Adding all playlist tracks to cache');
        store.deepDiverPlaylistIndexes.set(id, i)
        store.deepDiverPlaylistTrackSets.set(id, new Set((await store.call(getAllPlaylistTracks(id, token))).map(t => t.id)));
        store.finishProgress();
      }

      store.saveUser();
    }),

    updateJustGoodPlaylistFromCurrent: action(() => {
      if (!store.currentJustGoodPlaylist || !store.plannedJustGoodPlaylists || !store.inProgressJustGoodPlaylists || !store.justGoodPlaylists) return notInitialized();

      let justGoodList: CachedJustGoodPlaylist[]
      if (!store.currentJustGoodPlaylist.deepDivePlaylist) {
        justGoodList = store.plannedJustGoodPlaylists;
      } else if (store.currentJustGoodPlaylist.inProgress) {
        justGoodList = store.inProgressJustGoodPlaylists;
      } else {
        justGoodList = store.justGoodPlaylists;
      }
      const index = justGoodList.findIndex(p => p.id === store.currentJustGoodPlaylist?.id);
      if (index === -1) fail('Could not find just good playlist to update.');
      justGoodList[index] = justGoodToCached(store.currentJustGoodPlaylist);
      if (!store.currentJustGoodPlaylist.deepDivePlaylist) {
        store.plannedJustGoodPlaylists = [...justGoodList];
      } else if (store.currentJustGoodPlaylist.inProgress) {
        store.inProgressJustGoodPlaylists = [...justGoodList];
      } else {
        store.justGoodPlaylists = [...justGoodList];
      }

      store.saveUser();
    }),

    /**
     * TODO
     */
    clearSearchArtistResults: action(async () => {
      store.artistResults = [];
    }),

    togglePlaying: action(async () => {
      const token = await store.useToken();
      if (!token) return noToken();

      await store.call(store.currentTrack?.playing ? pausePlayback(token) : playPlayback(token));

      return await store.updatePlayer();
    }),

    skipNext: action(async () => {
      const token = await store.useToken();
      if (!token) return noToken();

      await store.call(nextPlayback(token));

      setTimeout(() => store.updatePlayer(), 500);

      return await store.updatePlayer();
    }),

    skipPrevious: action(async () => {
      const token = await store.useToken();
      if (!token) return noToken();

      await store.call(prevPlayback(token));

      setTimeout(() => store.updatePlayer(), 500);

      return await store.updatePlayer();
    }),

    seekToPosition: action(async (value: number) => {
      const token = await store.useToken();
      if (!token) return noToken();

      await store.call(seekPlayback(Math.trunc(value), token));

      return await store.updatePlayer();
    }),

    /**
     * For when you want to update the playing bar without actually playing it
     */
    pretendToProceedPosition: action(() => {
      if (!store.currentTrack) return notInitialized();
      if (store.currentTrack.progress === undefined) store.currentTrack.progress = 0;
      store.currentTrack.progress += 1000; // 1 second
    }),

    /**
     *
     */
    updatePlayer: action(async () => {
      const token = await store.useToken();
      if (!token) return noToken();

      const playback = await store.call(getPlayback(token));

      runInAction(() => {
        store.currentTrack = playback.item && deserializePlayingTrack(playback);

        // console.log(toJS(store.currentTrack));

        if (store.currentTrack?.context) {
          const { allJustGoodPlaylists } = store;
          if (allJustGoodPlaylists) {
            // console.log(allJustGoodPlaylists.length);
            for (let i = 0; i < allJustGoodPlaylists.length; i++) {
              const justGoodPlaylist = allJustGoodPlaylists[i];
              if (justGoodPlaylist.deepDivePlaylist?.id === store.currentTrack.context.id) {
                // TODO: Does this mess up anything else? without fetching the details?
                console.log('Fetching playing just good details');
                runInAction(async () => {
                  const trackIds = justGoodPlaylist.trackIds || (new Set((await store.call(getAllPlaylistTracks(justGoodPlaylist.id, token))).map(t => t.id)));
                  runInAction(() => {
                    store.currentPlayingJustGoodPlaylist = {
                      ...justGoodPlaylist,
                      trackIds,
                    };
                  });
                });
                break;
              }
              if (i === (allJustGoodPlaylists.length - 1)) {
                store.currentPlayingJustGoodPlaylist = undefined;
              }
            }
          }
        }

        if (store.currentJustGoodPlaylist?.deepDiveTracks && store.currentJustGoodPlaylist?.deepDivePlaylist && playback.context?.uri === getPlaylistUri(store.currentJustGoodPlaylist.deepDivePlaylist?.id)) {
          console.log('Updating current just good progress!');
          // Track number isn't zero-indexed
          for (let i = 0; i < store.currentJustGoodPlaylist.deepDiveTracks.length; i++) {
            // Find the index for the item in the curren just good playlist
            // TODO: more performant way of doing this?
            if (store.currentJustGoodPlaylist.deepDiveTracks[i].id === playback.item.id) {
              console.log('Updating just good playlist with progress');
              store.currentJustGoodPlaylist.progress = i;
              console.log(store.currentJustGoodPlaylist.progress);

              store.updateJustGoodPlaylistFromCurrent();
              break;
            }
          }
        }

        store.logStore();
      });
    }),

    toggleTrackInDeepDiverPlaylist: action(async (track: Track, playlist: CachedPlaylist) => {
      const token = await store.useToken();
      if (!token) return noToken();
      if (!track || !playlist || !playlist.id) return notInitialized();

      return store.toggleTrackInFetchedPlaylist(track, {
        ...playlist,
        trackIds: store.deepDiverPlaylistTrackSets?.get(playlist.id),
      });
    }),

    toggleTrackInFetchedPlaylist: action(async (track?: Track, playlist?: FetchedCachedPlaylist) => {
      const token = await store.useToken();
      if (!token) return noToken();
      if (!track || !playlist || !playlist.trackIds || !track.id || !track.uri || !playlist.id) return notInitialized();

      const { id, uri } = track;
      const { id: playlistID, trackIds } = playlist;

      if (trackIds.has(id)) {
        if (playlistID === LIKED_INDICATOR) {
          await store.call(removeTrackFromLiked(id, token));
        } else {
          await store.call(removeTrackFromPlaylist(uri, playlistID, token));
        }
        trackIds.delete(id);
        playlist.numTracks -= 1;
      } else {
        if (playlistID === LIKED_INDICATOR) {
          await store.call(addTrackToLiked(id, token));
        } else {
          await store.call(addTrackToPlaylist(playlist.id, uri, token));
        }
        trackIds.add(id);
        playlist.numTracks += 1;
      }

      await store.saveUser();
    }),

    /**
     *
     */
    toggleCurrentTrackInPlaylist: action(async (playlist: CachedPlaylist) => {
      const token = await store.useToken();
      if (!token) return noToken();
      if (store.currentTrack?.uri === undefined || store.currentTrack?.id === undefined) return fail('No current track');

      const trackSet = store.deepDiverPlaylistTrackSets?.get(playlist.id);
      if (!store.deepDiverPlaylistTrackSets?.has(playlist.id) || !trackSet) return fail('Playlist not recognized');

      if (trackSet.has(store.currentTrack.id)) {
        if (playlist.id === LIKED_INDICATOR) {
          await store.call(removeTrackFromLiked(store.currentTrack.id, token));
        } else {
          await store.call(removeTrackFromPlaylist(store.currentTrack.uri, playlist.id, token));
        }
        trackSet.delete(store.currentTrack.id);
        playlist.numTracks -= 1;
      } else {
        if (playlist.id === LIKED_INDICATOR) {
          await store.call(addTrackToLiked(store.currentTrack.id, token));
        } else {
          await store.call(addTrackToPlaylist(playlist.id, store.currentTrack.uri, token));
        }
        trackSet.add(store.currentTrack.id);
        playlist.numTracks += 1;
      }

      await store.saveUser();
    }),

    startProgress: action((task?: string) => {
      store.progress = { task: (task || ''), current: '', progress: 0 };
    }),

    updateProgress: action((progress: number, current?: string) => {
      store.progress = {
        task: store.progress?.task || '',
        progress,
        current: current || store.progress?.current || '',
      };
    }),

    finishProgress: action(() => {
      if (store.progress) {
        store.progress = {
          task: store.progress?.task || '',
          progress: 1,
          current: ''
        };

        setTimeout(() => runInAction(() => (store.progress = undefined)), 1000);
      }
    }),

    setHelpView: action((helpView: HelpViewType) => {
      store.helpView = helpView;
      store.updatePlayer();
    }),

    // really slow
    logStore: () => console.log(Object.fromEntries(Object.entries(toJS(store)).filter(([key, value]) => (typeof value !== 'function')))),

    call: async <T>(apiPromise: Promise<T>, backoff: number = 0): Promise<T> => {
      if (backoff > 0) {
        if (backoff > BACKOFF_LIMIT) {

        }
        await sleep(backoffTimeoutMs(backoff));
      }

      try {
        return await apiPromise;
      } catch (error) {
        if (error instanceof APIError && error.status && error.reason) {
          if (error.status === 404 && error.reason === 'NO_ACTIVE_DEVICE') {
            store.setHelpView('usage');
          } else if (error.status === 429) {
            console.error('Rate limited');
            return store.call(apiPromise, backoff + 1);
          } else if (error.status === 403) {
            // TODO: Could this also check to see if the refresh token is expired
            console.error('Forbidden');
            if (error.reason === 'User not registered in the Developer Dashboard') {
              store.deauthorize();
              store.setHelpView('not-in-beta')
            }
          }
        }
        throw error;
      }
    },

    skipWelcome: action(() => { store.welcomeStep = undefined; store.helpView = undefined; }),
  }));

  return store;
};

export default useSpotifyStore;
