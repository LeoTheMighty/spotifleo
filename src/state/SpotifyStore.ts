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
} from '../api/SpotifyHelper';
import { artistString, getImages } from '../logic/common';

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
  token?: string;
  setToken: (token: string) => void;

  // High Level Spotify Edit Actions
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

  // test: () => void;
}

const useSpotifyStore = () => {
  const store: SpotifyStore = useLocalObservable<SpotifyStore>(() => ({
    token: Cookies.get(spotifyAuthTokenCookieLocation),
    setToken: action((token: string) => {
      store.token = token;
      // TODO: Set initial states for app?
    }),

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
    //
    //   // store.token && console.log());
    //   const playback: PlaybackResponse = await getPlayback(store.token);
    //   console.log(playback);
    //   store.progress = (playback.progress_ms && playback.item.duration_ms) ?
    //     (playback.progress_ms / playback.item.duration_ms) * 100:
    //     0;
    // }),

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
      if (!store.token) return respondNoToken();

      if (store.playing) {
        try {
          await pausePlayback(store.token);
        } catch (error: any) {
          return respondError(error);
        }
      } else {
        try {
          await playPlayback(store.token);
        } catch (error: any) {
          return respondError(error);
        }
      }
      store.updatePlayer();
      return respondSuccess();
    }),

    skipNext: action(async () => {
      if (!store.token) return respondNoToken();

      try {
        await nextPlayback(store.token);
      } catch (error: any) {
        return respondError(error);
      }
      store.updatePlayer();
      return respondSuccess();
    }),

    skipPrevious: action(async () => {
      if (!store.token) return respondNoToken();

      try {
        await prevPlayback(store.token);
      } catch (error: any) {
        return respondError(error);
      }
      store.updatePlayer();
      return respondSuccess();
    }),

    seekToPosition: action(async (value: number) => {
      if (!store.token) return respondNoToken();

      try {
        await seekPlayback(value, store.token);
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
      if (!store.token) return respondNoToken();

      try {
        const playback = await getPlayback(store.token);

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
