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
  replaceAllPlaylistItems,
  toggleShuffle,
  setRepeatMode,
  getPlaylistDetails,
  getLatestArtistAlbum,
  getFirstPlaylistTrack,
  getArtist
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
  sleep, BACKOFF_LIMIT, backoffTimeoutMs, setSubtraction, setIntersection, getTrackUri, externalBaseUrl
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
  HelpViewType,
  APIError,
  User,
  JustGoodPlaylistDescriptionContent,
  CachedDeepDivePlaylist,
  DeepDivePlaylistDescriptionContent
} from '../types';
import {
  deserializeArtists,
  deserializeCachedPlaylist,
  deserializePlayingTrack,
  deserializeTrack
} from '../logic/serializers';
import { getUser, getToken, storeToken, storeUser, removeUser, removeToken } from '../logic/storage';
import { fetchRefreshToken, shouldRefreshToken } from '../auth/authHelper';

/*

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
  previewMode: boolean;

  userId?: string;
  userName?: string;
  userImg?: Images;
  userPlaylists?: CachedPlaylist[];
  deepDiverPlaylistIndexes?: Map<string, number>; // which ones are activated
  deepDiverPlaylistTrackSets?: Map<string, Set<string>>; // track sets for the activated deep diver playlists
  loadingDeepDiverPlaylists: Set<string>; // which ones are loading
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
  // TODO: Do we need to cache the tracks as well?
  currentDeepDiveArtistDiscographyTracks?: Map<string, Track>; // track ID to Track object
  currentDeepDiveArtistAlbumIDsGrouped?: string[]; // always sorted chronologically, albums, singles, appears
  currentDeepDiveArtistAlbumIDsOrdered?: string[]; // album IDs current ordering, not including missing ones
  currentDeepDiveArtistTrackIDsOrdered?: string[]; // helps us do the individual track view as well
  currentExternalPlaylistOwnerName?: string;

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
  currentJustGoodPlaylistList: CachedJustGoodPlaylist[] | undefined;
  currentDeepDiveArtistDiscographyGrouped: FetchedAlbum[] | undefined;
  currentDeepDiveArtistDiscographyOrdered: FetchedAlbum[] | undefined;
  currentDeepDiveArtistDiscographyTracksOrdered: Track[] | undefined;

  currentDeepDiveExternalURL: string | undefined;

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
  setupUser: () => Promise<User>;
  saveUser: () => void;
  storeUser: (userId: string, userName: string, userImg: Images, userPlaylists: CachedPlaylist[], deepDiverPlaylistIndexes: Map<string, number>, deepDiverPlaylistTrackSets: Map<string, Set<string>>, justGoodPlaylists: CachedJustGoodPlaylist[]) => User;
  resetUser: () => Promise<void>;
  evictUser: () => void;

  // Deep Diver
  fetchCurrentDeepDiverPlaylist: (playlist_id: string, view?: DeepDiverViewType) => Promise<void>;
  fetchExternalDeepDivePlaylist: (playlistId: string, deepDiveId: string) => Promise<void>;
  toggleAlbumForDeepDive: (albumId: string) => void;
  toggleAlbumGroupForDeepDive: (albumGroup: AlbumGroup) => void;
  createOrUpdateDeepDivePlaylist: (tracks: Track[], sortType: number, importLiked?: boolean) => Promise<void>;
  playCurrentDeepDivePlaylistTrack: () => Promise<void>;
  playTrackInDeepDivePlaylist: (track: Track) => Promise<void>;
  toggleCurrentTrackInJustGood: () => Promise<void>;
  toggleTrackInJustGood: (track: Track) => Promise<void>;
  toggleTrackInPlayingJustGood: (track: Track) => Promise<void>;
  toggleCurrentTrackInPlayingJustGood: () => Promise<void>;
  toggleTrackNotGood: (trackId: string) => Promise<void>;
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
  toggleShuffle: () => Promise<void>;
  toggleRepeat: () => Promise<void>;
  pretendToProceedPosition: () => void;
  updatePlayer: () => Promise<void>;
  toggleTrackInDeepDiverPlaylist: (track: Track, playlist: CachedPlaylist) => Promise<void>;
  toggleCurrentTrackInPlaylist: (playlist: CachedPlaylist) => Promise<void>;

  // Low Level Helpers
  toggleTrackInFetchedPlaylist: (track: Track, playlist: FetchedCachedPlaylist) => Promise<void>;
  playlistOutOfDate: (playlist: CachedPlaylist) => Promise<boolean>;
  artistOutOfDate: (playlist: CachedJustGoodPlaylist) => Promise<boolean>;

  // Loading Logic
  startProgress: (task?: string) => void;
  updateProgress: (progress: number, current?: string) => void;
  finishProgress: () => void;

  // Help
  setHelpView: (helpView: HelpViewType) => void;
  skipWelcome: () => void;
  backfill: () => Promise<void>;

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
    previewMode: false,

    loadingDeepDiverPlaylists: new Set(),

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

    get currentJustGoodPlaylistList(): CachedJustGoodPlaylist[] | undefined {
      if (!store.currentJustGoodPlaylist) return undefined;
      const { id } = store.currentJustGoodPlaylist;
      const lists: (CachedJustGoodPlaylist[] | undefined)[] = [store.justGoodPlaylists, store.inProgressJustGoodPlaylists, store.plannedJustGoodPlaylists];
      for (let i = 0; i < lists.length; i++) {
        if (lists[i]?.find(p => p.id === id)) return lists[i];
      }
      return undefined;
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

    get currentDeepDiveArtistDiscographyTracksOrdered(): Track[] | undefined {
      if (!store.currentDeepDiveArtistDiscographyTracks || !store.currentDeepDiveArtistTrackIDsOrdered) return undefined;

      const tracks: Track[] = [];
      for (let i = 0; i < store.currentDeepDiveArtistTrackIDsOrdered.length; i++) {
        const id = store.currentDeepDiveArtistTrackIDsOrdered[i];
        const track = store.currentDeepDiveArtistDiscographyTracks.get(id);
        if (track) {
          tracks.push(track);
        }
      }
      return tracks;
    },

    get currentDeepDiveExternalURL(): string | undefined {
      if (!store.currentJustGoodPlaylist?.id || !store.currentJustGoodPlaylist.deepDivePlaylist?.id) return undefined;

      return `${externalBaseUrl}/spotifleo/deepdiver?playlist_id=${store.currentJustGoodPlaylist.id}&deep_dive_id=${store.currentJustGoodPlaylist.deepDivePlaylist.id}&view=external`;
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

      const deepDiveMap: { [justGoodPlaylist: string]: CachedDeepDivePlaylist } = {};
      deepDivePlaylists.forEach((playlist) => {
        if (playlist.deepDiveContent.justGoodPlaylist === '') {
          deepDiveMap[playlist.name.substring(DEEP_DIVE_INDICATOR.length).trim()] = playlist;
        } else {
          deepDiveMap[playlist.deepDiveContent.justGoodPlaylist] = playlist;
        }
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

          const { artistId } = playlist.justGoodContent;

          let artist: ArtistResponse | undefined;
          // console.log(`Artist Name from playlist: ${artistName}`);

          if (artistId === '') {
            const artistName = playlist.name.substring(prefix.length).trim();
            artist = (await store.call(searchForArtist(artistName, 1, token))).artists.items[0];
            console.log('Artist received from search:');
            const deepDivePlaylist = deepDiveMap[artistName];
            if (deepDivePlaylist) {
              delete deepDiveMap[artistName];
              deepDiveMap[playlist.id] = deepDivePlaylist;
            }
            playlist.justGoodContent = {
              ...playlist.justGoodContent,
              artistId: artist?.id,
              deepDivePlaylist: deepDivePlaylist?.id,
              inProgress,
            }
          } else {
            artist = await store.call(getArtist(artistId, token))
          }
          // const artist: ArtistResponse | undefined = (await store.call(searchForArtist(artistName, 1, token))).artists.items[0];

          // console.log(artist);

          justGoodPlaylists.unshift({
            ...playlist,
            artistId: artist?.id,
            artistName: artist?.name,
            artistImg: getImages(artist?.images),
            progress: 0,
            deepDivePlaylist: deepDiveMap[playlist.id],
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

    loadPreviewData: action(() => {
      // TODO: Load in the offline data so that you can
      // userId?: string;
      // userName?: string;
      // userImg?: Images;
      // userPlaylists?: CachedPlaylist[];
      // deepDiverPlaylistIndexes?: Map<string, number>; // which ones are activated
      // deepDiverPlaylistTrackSets?: Map<string, Set<string>>; // track sets for the activated deep diver playlists
      // justGoodPlaylists?: CachedJustGoodPlaylist[];
      // inProgressJustGoodPlaylists?: CachedJustGoodPlaylist[];
      // plannedJustGoodPlaylists?: CachedJustGoodPlaylist[];
      // justGoodPlaylistMap?: Map<string, CachedJustGoodPlaylist>,
      // justGoodPlaylistArtistMap?: Map<string, CachedJustGoodPlaylist>,

        // Deep Diver
      // currentPlayingJustGoodPlaylist?: CachedJustGoodPlaylist;
      // currentJustGoodPlaylist?: JustGoodPlaylist;
      // currentArtistDeepDiveAlbumIds?: Set<string>;
      // currentDeepDiveArtistDiscography?: Map<string, FetchedAlbum>; // album ID to Album object
      // currentDeepDiveArtistAlbumIDsGrouped?: string[]; // always sorted chronologically, albums, singles, appears
      // currentDeepDiveArtistAlbumIDsOrdered?: string[]; // album IDs current ordering, not including missing ones

      // TODO: Search bar will have to be disabled

      // High Level Spotify Player
      // currentTrack?: PlayingTrack;
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

          store.currentDeepDiveArtistTrackIDsOrdered = [];
          store.currentDeepDiveArtistAlbumIDsOrdered = [];
          store.currentDeepDiveArtistDiscographyTracks = new Map();
          for (let i = 0; i < deepDivePlaylistTracks.length; i++) {
            const track = deepDivePlaylistTracks[i];
            store.currentDeepDiveArtistDiscographyTracks.set(track.id, track);
            store.currentDeepDiveArtistTrackIDsOrdered.push(track.id);
            if (track.albumId && !store.currentDeepDiveArtistAlbumIDsOrdered.find(id => id === track.albumId)) {
              store.currentDeepDiveArtistAlbumIDsOrdered.push(track.albumId);
            }
          }

          // TODO: Necessary to deep copy like this?
          store.currentJustGoodPlaylist = {
            ...playlist,
            deepDivePlaylist: {
              ...playlist.deepDivePlaylist,
              deepDiveContent: {
                ...playlist.deepDivePlaylist.deepDiveContent,
              },
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

        // Move the playlist to the front of the playlist
        if (store.currentJustGoodPlaylistList) {
          const list = store.currentJustGoodPlaylistList;
          const playlist = list.splice(store.currentJustGoodPlaylistList.findIndex(p => p.id === store.currentJustGoodPlaylist?.id), 1)[0];
          console.log(playlist);
          list.unshift(playlist);

          store.saveUser();
        }
      }

      // Set the default view
      const defaultView = playlist.deepDivePlaylist ? (playlist.justGoodContent.inProgress ? 'deep-dive' : 'view-deep-dive') : 'edit-deep-dive';

      store.currentDeepDiveView = view || defaultView;

      store.finishProgress();

      await store.updatePlayer();
    },

    fetchExternalDeepDivePlaylist: action(async (playlistId: string, deepDiveId: string) => {
      const token = await store.useToken();
      if (!token) return noToken();

      store.currentDeepDiveView = undefined;

      if (store.currentJustGoodPlaylist?.id !== playlistId) {
        console.log(`searching for playlist with id = ${playlistId}`);
        const playlistResponse = await store.call(getPlaylistDetails(playlistId, token));
        const deepDivePlaylistResponse = await store.call(getPlaylistDetails(deepDiveId, token));

        if (!playlistResponse || !deepDivePlaylistResponse) throw new Error('External Deep Diver URL malformed');

        store.currentExternalPlaylistOwnerName = playlistResponse.owner.display_name;

        const playlist = deserializeCachedPlaylist(playlistResponse);
        const deepDivePlaylist = deserializeCachedPlaylist(deepDivePlaylistResponse);

        if (!playlist.justGoodContent || !deepDivePlaylist.deepDiveContent) throw new Error('External description contents malformed');

        const { artistId } = playlist.justGoodContent;

        const artist: ArtistResponse | undefined = (await store.call(getArtist(artistId, token)));

        if (!artist) throw new Error('Could not find artist from playlist');
        console.log(`Artist Name from playlist: ${artist.name}`);
        store.startProgress('Fetching External Just Good Playlist');
        store.updateProgress(0.1, 'Getting just good details');

        store.updateProgress(0.1, 'Getting all albums and tracks for the artist');
        console.log('Fetching all artist albums');
        const cb1 = (p: number) => store.updateProgress(nestProgress(p, 0.1, 0.7));
        const response = await store.call(getAllArtistAlbumsWithTracks(artist.id, token, cb1));
        console.log(response);

        store.currentDeepDiveArtistAlbumIDsGrouped = [];
        store.currentDeepDiveArtistDiscography = new Map();
        for (let i = 0; i < response.length; i++) {
          const album = response[i];
          store.currentDeepDiveArtistAlbumIDsGrouped.push(album.id);
          store.currentDeepDiveArtistDiscography.set(album.id, album);
        }

        store.updateProgress(0.7, 'Fetching all just good playlist tracks');
        console.log('loading deep dive playlist');
        const cb2 = (p: number) => store.updateProgress(nestProgress(p, 0.7, 0.8));
        const justGoodPlaylistTrackIds = new Set((await store.call(getAllPlaylistTracks(playlist.id, token, cb2))).map(t => t.id));
        store.updateProgress(0.8, 'Fetching all deep dive playlist tracks');
        const cb3 = (p: number) => store.updateProgress(nestProgress(p, 0.8, 0.9));
        const deepDivePlaylistTracks = (await store.call(getAllPlaylistTracks(deepDivePlaylist.id, token, cb3)));

        store.currentDeepDiveArtistAlbumIDsOrdered = [];
        for (let i = 0; i < deepDivePlaylistTracks.length; i++) {
          const track = deepDivePlaylistTracks[i];
          if (track.albumId && !store.currentDeepDiveArtistAlbumIDsOrdered.find(id => id === track.albumId)) {
            store.currentDeepDiveArtistAlbumIDsOrdered.push(track.albumId);
          }
        }

        store.currentJustGoodPlaylist = {
          id: playlist.id,
          name: playlist.name,
          numTracks: justGoodPlaylistTrackIds.size,
          artistName: artist.name,
          artistImg: getImages(artist.images),
          justGoodContent: {
            deepDivePlaylist: deepDivePlaylist.id,
            artistId: artistId,
            inProgress: playlist.justGoodContent.inProgress,
            type: 0,
          },
          progress: 0,
          artistId: artist.id,
          deepDivePlaylist: {
            id: deepDivePlaylist.id,
            name: deepDivePlaylist.name,
            numTracks: deepDivePlaylistTracks.length,
            deepDiveContent: {
              justGoodPlaylist: playlist.id,
              sortType: deepDivePlaylist.deepDiveContent.sortType,
              type: 1,
            }
          },
          trackIds: justGoodPlaylistTrackIds,
          deepDiveTracks: deepDivePlaylistTracks,
        };

        store.currentArtistDeepDiveAlbumIds = new Set();
        for (let i = 0; i < deepDivePlaylistTracks.length; i++) {
          const { albumId } = deepDivePlaylistTracks[i];
          if (albumId !== undefined) store.currentArtistDeepDiveAlbumIds.add(albumId);
        }
      }

      store.currentDeepDiveView = 'external';

      store.finishProgress();

      await store.updatePlayer();
    }),

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
    createOrUpdateDeepDivePlaylist: action(async (tracks: Track[], sortType: number, importLiked: boolean = false) => {
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
      let content: DeepDivePlaylistDescriptionContent;
      if (store.currentJustGoodPlaylist.deepDivePlaylist === undefined) {
        console.log('CREATING DEEP DIVE PLAYLIST');
        store.updateProgress(0.1, 'Creating the playlist');
        // 1. Create Deep Dive Playlist
        content = {
          justGoodPlaylist: store.currentJustGoodPlaylist.id,
          sortType,
          type: 1,
        };
        const response = await store.call(createPlaylist(
          getDeepDivePlaylistName(artistName),
          getDeepDivePlaylistDescription(artistName, content),
          false,
          token,
        ));
        deepDiveId = response.id;
        deepDiveName = response.name;
      } else {
        deepDiveId = store.currentJustGoodPlaylist.deepDivePlaylist.id;
        deepDiveName = store.currentJustGoodPlaylist.deepDivePlaylist.name;
        content = {
          ...store.currentJustGoodPlaylist.deepDivePlaylist.deepDiveContent,
          sortType,
        };
      }

      console.log('GETTING ALL TRACKS');
      store.updateProgress(0.2, 'Getting all artist albums and tracks');

      // 2. Get all album tracks (in order) (let's go through the disco playlist)
      // 3. Get all appears on tracks (filter for only those that have the artist in them).
      const filteredTracks = tracks.filter((t) => store.currentArtistDeepDiveAlbumIds?.has(t.albumId || ''));
      const trackURIs: string[] = [];
      const trackIds: Set<string> = new Set();
      filteredTracks.forEach((t) => {
        trackIds.add(t.id);
        trackURIs.push(t.uri)
      });

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
          numTracks: filteredTracks.length,
          deepDiveContent: content,
        },
        trackIds: new Set((await store.call(getAllPlaylistTracks(store.currentJustGoodPlaylist.id, token, cb))).map(t => t.id)),
        deepDiveTracks: filteredTracks,
        progress: 0,
      };

      await store.call(changePlaylistDetails(
        store.currentJustGoodPlaylist.id,
        getInProgressJustGoodPlaylistName(store.currentJustGoodPlaylist.artistName),
        getInProgressJustGoodPlaylistDescription(store.currentJustGoodPlaylist.artistName,
          { deepDivePlaylist: deepDiveId, artistId: store.currentJustGoodPlaylist.artistId, inProgress: true, type: 0 }),
        undefined,
        token,
      ));

      if (importLiked) {
        console.log('IMPORT EXISTING LIKED INTO THE JUST GOOD PLAYLIST');
        if (store.likedTrackSet) {
          // D, L, C
          // Get the intersection of the deep dive track Ids and liked IDs and subtract current track IDs
          // (D U L) - C
          const toImport = setSubtraction(setIntersection(trackIds, store.likedTrackSet), store.currentJustGoodPlaylist.trackIds);

          const importTrackUris: string[] = [];
          toImport.forEach(id => {
            importTrackUris.push(getTrackUri(id))
            store.currentJustGoodPlaylist?.trackIds.add(id);
          });

          await store.call(addAllTracksToPlaylist(store.currentJustGoodPlaylist.id, importTrackUris, token));
        } else {
          console.error('Cannot import because LIKED track set is not initialized');
        }
      }

      const index = store.plannedJustGoodPlaylists?.findIndex(p => p.id === store.currentJustGoodPlaylist!.id);
      store.plannedJustGoodPlaylists?.splice(index, 1);
      store.inProgressJustGoodPlaylists.unshift(store.currentJustGoodPlaylist);

      store.currentDeepDiveArtistAlbumIDsOrdered = [];
      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        if (track.albumId && !store.currentDeepDiveArtistAlbumIDsOrdered.find(id => id === track.albumId)) {
          store.currentDeepDiveArtistAlbumIDsOrdered.push(track.albumId);
        }
      }

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
        artistId: '',
        artistName: 'aristn',
        justGoodContent: {
          inProgress: true,
          artistId: '',
          type: 0,
        },
        progress: 0,
        numTracks: 0,
      });

      const name = getInProgressJustGoodPlaylistName(artist.name);
      const description = getInProgressJustGoodPlaylistDescription(
        artist.name,
        { artistId: artist.id, inProgress: true, type: 0 },
      );
      const response = await store.call(createPlaylist(name, description, false, token));

      const justGoodPlaylist: CachedJustGoodPlaylist = {
        id: response.id,
        name,
        artistName: artist.name,
        artistId: artist.id,
        artistImg: artist.img,
        justGoodContent: {
          artistId: artist.id,
          inProgress: true,
          type: 0,
        },
        progress: 0,
        numTracks: 0,
        notGoodIds: new Set(),
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

      if (!store.currentJustGoodPlaylist.justGoodContent.inProgress) {
        store.helpView = 'not-in-progress';
        return;
      }

      const playlistId = store.currentJustGoodPlaylist?.id;
      if (playlistId === undefined || !track) return fail('Tracks not initialized');

      await store.toggleTrackInFetchedPlaylist(track, store.currentJustGoodPlaylist);

      if (store.currentJustGoodPlaylist.notGoodIds?.has(track.id)) {
        store.currentJustGoodPlaylist.notGoodIds?.delete(track.id)
      }

      if (store.isPlayingCurrentDeepDivePlaylist) {
        // Update the duplicated playlist if they're the same
        if (store.currentPlayingJustGoodPlaylist?.trackIds?.has(track.id)) {
          store.currentPlayingJustGoodPlaylist?.trackIds?.add(track.id);
          store.currentPlayingJustGoodPlaylist?.numTracks && (store.currentPlayingJustGoodPlaylist.numTracks += 1);
        } else {
          store.currentPlayingJustGoodPlaylist?.trackIds?.delete(track.id);
          store.currentPlayingJustGoodPlaylist?.numTracks && (store.currentPlayingJustGoodPlaylist.numTracks -= 1);
        }

        if (store.currentPlayingJustGoodPlaylist?.notGoodIds?.has(track.id)) {
          store.currentPlayingJustGoodPlaylist?.notGoodIds?.delete(track.id)
        }
      }
    }),

    toggleTrackInPlayingJustGood: action(async (track: Track) => {
      const token = await store.useToken();
      if (!token) return noToken();
      if (!store.currentPlayingJustGoodPlaylist?.trackIds) return notInitialized();

      if (!store.currentPlayingJustGoodPlaylist.justGoodContent.inProgress) {
        store.helpView = 'not-in-progress';
        return;
      }

      const playlistId = store.currentPlayingJustGoodPlaylist?.id;
      if (playlistId === undefined || !track) return fail('Tracks not initialized');

      await store.toggleTrackInFetchedPlaylist(track, store.currentPlayingJustGoodPlaylist);

      if (store.currentPlayingJustGoodPlaylist?.notGoodIds?.has(track.id)) {
        store.currentPlayingJustGoodPlaylist?.notGoodIds?.delete(track.id)
      }

      if (store.isPlayingCurrentDeepDivePlaylist) {
        // Update the duplicated playlist if they're the same
        if (store.currentJustGoodPlaylist?.trackIds.has(track.id)) {
          store.currentJustGoodPlaylist?.trackIds?.add(track.id);
          store.currentJustGoodPlaylist?.numTracks && (store.currentJustGoodPlaylist.numTracks += 1);
        } else {
          store.currentJustGoodPlaylist?.trackIds?.delete(track.id);
          store.currentJustGoodPlaylist?.numTracks && (store.currentJustGoodPlaylist.numTracks -= 1);
        }

        if (store.currentJustGoodPlaylist?.notGoodIds?.has(track.id)) {
          store.currentJustGoodPlaylist?.notGoodIds?.delete(track.id)
        }
      }
    }),

    /**
     * TODO
     */
    toggleCurrentTrackInJustGood: action(async () => {
      if (store.currentJustGoodPlaylist?.progress === undefined || !store.currentJustGoodPlaylist.deepDiveTracks) return notInitialized();

      return store.toggleTrackInJustGood(store.currentJustGoodPlaylist.deepDiveTracks[store.currentJustGoodPlaylist.progress]);
    }),

    toggleCurrentTrackInPlayingJustGood: action(async () => {
      if (store.currentTrack === undefined) return notInitialized();

      return store.toggleTrackInPlayingJustGood(store.currentTrack);
    }),

    toggleTrackNotGood: async (trackId: string) => {
      if (!store.currentJustGoodPlaylist) return notInitialized();

      if (store.currentJustGoodPlaylist.notGoodIds === undefined) {
        store.currentJustGoodPlaylist.notGoodIds = new Set();
      }

      if (store.currentJustGoodPlaylist.notGoodIds?.has(trackId)) {
        store.currentJustGoodPlaylist.notGoodIds?.delete(trackId);
      } else {
        store.currentJustGoodPlaylist.notGoodIds?.add(trackId);
      }

      if (store.currentPlayingJustGoodPlaylist?.notGoodIds?.has(trackId)) {
        store.currentPlayingJustGoodPlaylist?.notGoodIds?.delete(trackId);
      } else {
        store.currentPlayingJustGoodPlaylist?.notGoodIds?.add(trackId);
      }

      store.saveUser();
    },

    /**
     * TODO
     */
    toggleJustGoodPlaylistComplete: action(async () => {
      const token = await store.useToken();
      if (!token) return noToken();

      const inProgress = store.currentJustGoodPlaylist?.justGoodContent.inProgress;
      const playlistID = store.currentJustGoodPlaylist?.id;
      const artistName = store.currentJustGoodPlaylist?.artistName;

      if (!store.currentJustGoodPlaylist || !playlistID || !artistName || !store.inProgressJustGoodPlaylists || !store.justGoodPlaylists || inProgress === undefined) return fail('mark playlist complete not initialized');

      const name = inProgress ? getJustGoodPlaylistName(artistName) : getInProgressJustGoodPlaylistName(artistName);
      const content: JustGoodPlaylistDescriptionContent = {
        deepDivePlaylist: store.currentJustGoodPlaylist.deepDivePlaylist?.id,
        artistId: store.currentJustGoodPlaylist.artistId,
        inProgress,
        type: 0,
      }
      const description = inProgress ?
        getJustGoodPlaylistDescription(artistName, content) :
        getInProgressJustGoodPlaylistDescription(artistName, content);

      await store.call(changePlaylistDetails(playlistID, name, description, inProgress, token));

      store.currentJustGoodPlaylist.name = name;
      store.currentJustGoodPlaylist.justGoodContent.inProgress = !inProgress;

      // Remove the playlist
      const index = (inProgress ? store.inProgressJustGoodPlaylists : store.justGoodPlaylists)?.findIndex((p) => p.id === playlistID);
      const playlist = inProgress ? store.inProgressJustGoodPlaylists[index] : store.justGoodPlaylists[index];
      inProgress ? store.inProgressJustGoodPlaylists.splice(index, 1) : store.justGoodPlaylists.splice(index, 1);

      // Add to the other playlist
      inProgress ? store.justGoodPlaylists.unshift(playlist) : store.inProgressJustGoodPlaylists.unshift(playlist);

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
      store.loadingDeepDiverPlaylists.add(id);
      if (store.deepDiverPlaylistIndexes.has(id)) {
        store.deepDiverPlaylistIndexes.delete(id);
      } else {
        store.startProgress('Adding additional playlist')
        store.updateProgress(0.1, 'Adding all playlist tracks to cache');
        store.deepDiverPlaylistIndexes.set(id, i)
        store.deepDiverPlaylistTrackSets.set(id, new Set((await store.call(getAllPlaylistTracks(id, token))).map(t => t.id)));
        store.finishProgress();
      }
      store.loadingDeepDiverPlaylists.delete(id);

      store.saveUser();
    }),

    updateJustGoodPlaylistFromCurrent: action(() => {
      if (!store.currentJustGoodPlaylist || !store.plannedJustGoodPlaylists || !store.inProgressJustGoodPlaylists || !store.justGoodPlaylists) return notInitialized();

      let justGoodList: CachedJustGoodPlaylist[]
      if (!store.currentJustGoodPlaylist.deepDivePlaylist) {
        justGoodList = store.plannedJustGoodPlaylists;
      } else if (store.currentJustGoodPlaylist.justGoodContent.inProgress) {
        justGoodList = store.inProgressJustGoodPlaylists;
      } else {
        justGoodList = store.justGoodPlaylists;
      }
      const index = justGoodList.findIndex(p => p.id === store.currentJustGoodPlaylist?.id);
      if (index === -1) fail('Could not find just good playlist to update.');
      justGoodList[index] = justGoodToCached(store.currentJustGoodPlaylist);
      if (!store.currentJustGoodPlaylist.deepDivePlaylist) {
        store.plannedJustGoodPlaylists = [...justGoodList];
      } else if (store.currentJustGoodPlaylist.justGoodContent.inProgress) {
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
     *
     */
    toggleShuffle: action(async () => {
      const token = await store.useToken();
      if (!token) return noToken();

      if (store.currentTrack?.shuffle) {
        await store.call(toggleShuffle(false, token));
      } else {
        await store.call(toggleShuffle(true, token));
      }

      return await store.updatePlayer();
    }),

    /**
     *
     */
    toggleRepeat: action(async () => {
      const token = await store.useToken();
      if (!token) return noToken();

      const state = store.currentTrack?.repeat;
      if (state === 'off') {
        await store.call(setRepeatMode('context', token));
      } else if (state === 'context') {
        await store.call(setRepeatMode('track', token));
      } else if (state === 'track') {
        await store.call(setRepeatMode('off', token));
      }

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

    playlistOutOfDate: async (playlist: CachedPlaylist) => {
      const token = await store.useToken();
      if (!token) return noToken();
      if (!playlist.last || !playlist.id) return notInitialized();

      return (await getFirstPlaylistTrack(playlist.id, token))?.id !== playlist.last;
    },

    artistOutOfDate: async (playlist: CachedJustGoodPlaylist) => {
      const token = await store.useToken();
      if (!token) return noToken();
      if (!playlist.artistId || !playlist.artistLast) return notInitialized();

      return (await getLatestArtistAlbum(playlist.artistId, token)).id !== playlist.artistLast;
    },

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
          throw new Error('Failed to retry API call')
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

    backfill: action(async () => {
      const token = await store.useToken();
      if (!token) return noToken();
      if (!store.justGoodPlaylists || !store.inProgressJustGoodPlaylists || !store.plannedJustGoodPlaylists) return notInitialized();

      for (let i = 0; i < store.justGoodPlaylists.length; i++) {
        const p = store.justGoodPlaylists[i];
        if (p.deepDivePlaylist) {
          await changePlaylistDetails(
            p.id,
            getJustGoodPlaylistName(p.artistName),
            getJustGoodPlaylistDescription(p.artistName, {
              deepDivePlaylist: p.deepDivePlaylist.id,
              artistId: p.artistId,
              inProgress: false,
              type: 0,
            }),
            true,
            token,
          );
          await changePlaylistDetails(
            p.deepDivePlaylist.id,
            getDeepDivePlaylistName(p.artistName),
            getDeepDivePlaylistDescription(p.artistName, {
              justGoodPlaylist: p.id,
              sortType: p.id === '3U37OoxcHb7P3p7GFqfKJV' ? 1 : 0,
              type: 1,
            }),
            true,
            token,
          );
        }
      }
      for (let i = 0; i < store.inProgressJustGoodPlaylists.length; i++) {
        const p = store.inProgressJustGoodPlaylists[i];
        if (p.deepDivePlaylist) {
          await changePlaylistDetails(
            p.id,
            getInProgressJustGoodPlaylistName(p.artistName),
            getInProgressJustGoodPlaylistDescription(p.artistName, {
              deepDivePlaylist: p.deepDivePlaylist!.id,
              artistId: p.artistId,
              inProgress: true,
              type: 0,
            }),
            true,
            token,
          );
          await changePlaylistDetails(
            p.deepDivePlaylist.id,
            getDeepDivePlaylistName(p.artistName),
            getDeepDivePlaylistDescription(p.artistName, {
              justGoodPlaylist: p.id,
              sortType: p.id === '3U37OoxcHb7P3p7GFqfKJV' ? 1 : 0,
              type: 1,
            }),
            true,
            token,
          );
        }
      }
      for (let i = 0; i < store.plannedJustGoodPlaylists.length; i++) {
        const p = store.plannedJustGoodPlaylists[i];
        await changePlaylistDetails(
          p.id,
          getInProgressJustGoodPlaylistName(p.artistName),
          getInProgressJustGoodPlaylistDescription(p.artistName, {
            artistId: p.artistId,
            inProgress: true,
            type: 0
          }),
          true,
          token,
        );
      }
    }),
  }));

  return store;
};

export default useSpotifyStore;
