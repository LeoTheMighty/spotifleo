import {
  ArtistResponse,
  CachedPlaylist,
  ImageResponse,
  Images,
  CachedJustGoodPlaylist,
  JustGoodPlaylist, AlbumType, AlbumGroup
} from '../types';
import defaultAvatar from '../images/default_avatar.jpeg';
import { capitalize } from 'lodash';

export const JUST_GOOD_INDICATOR = '(TESTING) Just Good';
export const IN_PROGRESS_INDICATOR = '(TESTING) [WIP] Just Good';
export const DEEP_DIVE_INDICATOR = '(TESTING) Deep Dive of';

export const formatResp = async (r: Response): Promise<any> => new Promise((resolve, reject) => {
  if (r.status === 204) return resolve(true);
  if (r.headers.get('content-length') === '0') return resolve(true);
  r.json().then((resp) => {
    if (resp.error) {
      reject(resp.error);
    } else {
      resolve(resp);
    }
  });
});

const myTag = 'Created using Leo Belyi\'s Deep Diver :)';
export const getDeepDivePlaylistName = (artistName: string) => `${DEEP_DIVE_INDICATOR} ${artistName}`;
export const getDeepDivePlaylistDescription = (artistName: string) => (
  `The playlist of the artist's discography to make the "${getJustGoodPlaylistName(artistName)}" playlist! ${myTag}`
);
export const getJustGoodPlaylistName = (artistName: string) => `${JUST_GOOD_INDICATOR} ${artistName}`;
export const getJustGoodPlaylistDescription = (artistName: string) => (
  `Only the good songs from the "${getDeepDivePlaylistName(artistName)}" playlist. ${myTag}`
);
export const getInProgressJustGoodPlaylistName = (artistName: string) => `${IN_PROGRESS_INDICATOR} ${artistName}`;
export const getInProgressJustGoodPlaylistDescription = (artistName: string) => (
  `!!! NOT FINISHED !!! Will be just the good songs from the "${getDeepDivePlaylistName(artistName)}" playlist. ${myTag}`
);

export const formatQueryList = (list: string[]) => list.join(',');

export const chunkList = <T>(list: T[], maxLength: number): T[][] => {
  const chunkedList: T[][] = [];
  for (let i = 0; i < list.length; i += maxLength) {
    chunkedList.push(list.slice(i, i + maxLength));
  }
  return chunkedList;
}

export const getParams = (): { [key: string]: string } => {
  return window ? window.location.search
    .substring(1)
    .split('&')
    .reduce((initial: { [key: string]: string }, item) => {
      if (item) {
        const parts: string[] = item.split('=');
        initial[parts[0]] = decodeURIComponent(parts[1]);
      }
      return initial;
    }, {}) : {};
};

export const getArtistIds = (artists?: ArtistResponse[]): string[] | undefined => (
  artists && artists.map((a) => a.id)
);

export const artistString = (artists?: ArtistResponse[]) => (
  artists ? artists.map((artist) => artist.name).join(', ') : ''
);

export const getImages = (images?: ImageResponse[]): Images => {
  let minURL = undefined;
  let minHeight = Infinity;
  let maxURL = undefined;
  let maxHeight = -1;

  for (let i = 0; i < (images?.length || 0); i++) {
    const image = images![i];
    if (image.height < minHeight) {
      minURL = image.url;
      minHeight = image.height;
    }
    if (image.height > maxHeight) {
      maxURL = image.url;
      maxHeight = image.height
    }
  }

  return { small: minURL, large: maxURL };
}

export const getGenre = (genres: string[]): string => genres.join(', ');

export const getScope = (scopes: string[]): string => scopes.join(' ');

export const formatMs = (ms?: number) => {
  ms ||= 0;
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${(seconds % 60) < 10 ? '0' : ''}${seconds % 60}`
};

export const splitPlaylists = (playlists: CachedPlaylist[]): {
  justGoodPlaylists: CachedPlaylist[],
  inProgressJustGoodPlaylists: CachedPlaylist[],
  deepDivePlaylists: CachedPlaylist[],
  userPlaylists: CachedPlaylist[],
} => {
  const justGoodPlaylists: CachedPlaylist[] = [];
  const inProgressJustGoodPlaylists: CachedPlaylist[] = [];
  const deepDivePlaylists: CachedPlaylist[] = [];
  const userPlaylists: CachedPlaylist[] = [];

  playlists.forEach((playlist) => {
    const { name } = playlist;
    if (name.startsWith(JUST_GOOD_INDICATOR)) {
      justGoodPlaylists.push(playlist);
    } else if (name.startsWith(IN_PROGRESS_INDICATOR)) {
      inProgressJustGoodPlaylists.push(playlist);
    } else if (name.startsWith(DEEP_DIVE_INDICATOR)) {
      deepDivePlaylists.push(playlist)
    } else {
      userPlaylists.push(playlist);
    }
  });

  return { justGoodPlaylists, inProgressJustGoodPlaylists, deepDivePlaylists, userPlaylists };
};

export const splitJustGoodPlaylists = (playlists: CachedJustGoodPlaylist[]): {
  finishedJustGoodPlaylists: CachedJustGoodPlaylist[],
  inProgressJustGoodPlaylists: CachedJustGoodPlaylist[],
  plannedJustGoodPlaylists: CachedJustGoodPlaylist[],
} => {
  const finishedJustGoodPlaylists: CachedJustGoodPlaylist[] = [];
  const inProgressJustGoodPlaylists: CachedJustGoodPlaylist[] = [];
  const plannedJustGoodPlaylists: CachedJustGoodPlaylist[] = [];

  for (let i = 0; i < playlists.length; i++) {
    const playlist = playlists[i];
    if (!playlist.deepDivePlaylist) {
      plannedJustGoodPlaylists.push(playlist);
    } else if (playlist.inProgress) {
      inProgressJustGoodPlaylists.push(playlist);
    } else {
      finishedJustGoodPlaylists.push(playlist);
    }
  }

  return {
    finishedJustGoodPlaylists,
    inProgressJustGoodPlaylists,
    plannedJustGoodPlaylists,
  };
}

// export const getID = (uri: string) => uri.split(':').at(-1);
export const getID = (uri: string) => arrayGetWrap(uri.split(':'), -1);
// export const getID = (uri: string) => arrayGetWrap(uri.split(':'), -1);
export const getUri = (type: string, id: string) => `spotify:${type}:${id}`;
export const getUrl = (type: string, id: string) => `https://open.spotify.com/${type}/${id}`;
export const getPlaylistUri = (id: string) => getUri('playlist', id);
export const getPlaylistUrl = (id: string) => getUrl('playlist', id);

export const exportSet = <T>(set: Set<T>): T[] => Array.from(set);
export const importSet = <T>(array: T[]): Set<T> => new Set(array);
export const exportMap = <V>(map: Map<string, V>): { [key: string]: V } => Object.fromEntries(map);
export const importMap = <V>(object: { [key: string]: V }): Map<string, V> => new Map(Object.entries(object));
export const exportMapOfSets = <T>(map: Map<string, Set<T>>): { [key: string]: T[] } => {
  const final: { [key: string ]: T[] } = {};
  const obj = exportMap(map);
  Object.entries(obj).forEach(([key, set]) => {
    final[key] = exportSet(set);
  });
  return final;
}
export const importMapOfSets = <T>(object: { [key: string]: T[] }): Map<string, Set<T>> => {
  const final: Map<string, Set<T>> = new Map();
  const m = importMap(object);
  m.forEach((v, k) => {
    final.set(k, importSet(v));
  });
  return final;
}

export const sleep = async (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const wrapIndex = (index: number, length: number) => (index % length + length) % length;
export const arrayGetWrap = <T>(array: T[], index: number) => array[wrapIndex(index, array.length)];

// Navigate To
export const deepDiver = (playlistID: string, view?: string) => ({
  pathname: '/spotifleo/deepdiver',
  search: `?playlist_id=${playlistID}${view ? `&view=${view}` : ''}`,
});
export const viewDeepDiver = (playlistID: string) => deepDiver(playlistID, 'view-deep-dive');
export const driveDeepDiver = (playlistID: string) => deepDiver(playlistID, 'deep-dive');
export const editDeepDiver = (playlistID: string) => deepDiver(playlistID, 'edit-deep-dive');

export const justGoodToCached = (justGoodPlaylist: JustGoodPlaylist): CachedJustGoodPlaylist => ({
  id: justGoodPlaylist.id,
  name: justGoodPlaylist.name,
  artistName: justGoodPlaylist.artistName,
  artistImg: justGoodPlaylist.artistImg,
  deepDivePlaylist: justGoodPlaylist.deepDivePlaylist,
  inProgress: justGoodPlaylist.inProgress,
  progress: justGoodPlaylist.progress,
  artistId: justGoodPlaylist.artistId,
});

export const newTab = { target: "_blank", rel: "noreferrer noopener" };

export const nestProgress = (value: number, min: number, max: number) => (min + (value * (max - min)));

export const albumGroupString = (type: AlbumGroup): string => type.split('_').map(capitalize).join(' '); // overkill but sick
