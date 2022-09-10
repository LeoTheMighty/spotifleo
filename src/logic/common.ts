import {
  ArtistResponse,
  CachedPlaylist,
  ImageResponse,
  Images,
  CachedJustGoodPlaylist,
  JustGoodPlaylist,
  AlbumType,
  AlbumGroup,
  Track,
  Artist,
  APIError,
  FetchedAlbum,
  JustGoodPlaylistDescriptionContent,
  DeepDivePlaylistDescriptionContent, CachedDeepDivePlaylist, CachedPlaylistWithJustGoodContent
} from '../types';
import { capitalize } from 'lodash';

export const externalBaseUrl = window.location.host;

const IN_BETA = false;
const IN_HOMESCREEN = window.matchMedia('(display-mode: standalone)').matches;

// TODO: Test
// alert(IN_HOMESCREEN);

const BETA_TAG = '(TESTING) '
export const JUST_GOOD_INDICATOR = `${IN_BETA ? BETA_TAG : ''}Just Good`;
export const IN_PROGRESS_INDICATOR = `${IN_BETA ? BETA_TAG : ''}[WIP] Just Good`;
export const DEEP_DIVE_INDICATOR = `${IN_BETA ? BETA_TAG : ''}Deep Dive of`;

export const BACKOFF_LIMIT = 5;

export const formatResp = async (r: Response): Promise<any> => new Promise((resolve, reject) => {
  if (r.ok) {
    if (r.status === 204) return resolve(true);
    if (r.headers.get('content-length') === '0') return resolve(true);
    r.json().then(resolve);
  } else {
    console.error(r);
    if (r.status === 404) {
      r.json().then(j => reject(new APIError(r.status, j.error.reason)));
    } else {
      r.text().then(t => reject(new APIError(r.status, t)));
    }
  }
});

const PLAYLIST_NAME_MAX = 100;
const PLAYLIST_DESCRIPTION_MAX = 300;
const myTag = 'Created using Leo Belyi\'s Deep Diver :)';
const guardRail = ' DON\'T TOUCH => |'
const getJustGoodDescriptionContentTag = (content?: JustGoodPlaylistDescriptionContent): string => (
  content ? `${guardRail}0,${content.deepDivePlaylist},${content.artistId},${content.inProgress ? '1' : '0'}` : ''
);
const getDeepDiveDescriptionContentTag = (content?: DeepDivePlaylistDescriptionContent): string => (
  content ? `${guardRail}1,${content.justGoodPlaylist},${content.sortType}` : ''
);
export const getJustGoodDescriptionContent = (description: string): JustGoodPlaylistDescriptionContent | undefined => {
  const contentString = arrayGetWrap(description.split('|'), -1);
  if (contentString === undefined) return undefined;
  const contentList = contentString.split(',');
  const [type, deepDivePlaylist, artistId, inProgress] = contentList;
  if (!type || !deepDivePlaylist || !artistId || !inProgress) return undefined;
  if (type !== '0') return undefined;
  return {
    type: 0,
    deepDivePlaylist,
    artistId,
    inProgress: inProgress !== '0',
  }
};
export const getDeepDiveDescriptionContent = (description: string): DeepDivePlaylistDescriptionContent | undefined => {
  const contentString = arrayGetWrap(description.split('|'), -1);
  if (contentString === undefined) return undefined;
  const [type, justGoodPlaylist, sortType] = contentString.split(',');
  if (!type || !justGoodPlaylist || !sortType) return undefined;
  if (type !== '1') return undefined;
  return {
    type: 1,
    justGoodPlaylist,
    sortType: parseInt(sortType),
  }
};
const ellipsizeString = (s: string, len: number) => s.length > len ? s.substring(0, len - 3) + '...' : s;
export const getDeepDivePlaylistName = (artistName: string) => (
  `${DEEP_DIVE_INDICATOR} ${ellipsizeString(artistName, PLAYLIST_NAME_MAX - (DEEP_DIVE_INDICATOR.length + 1))}`
);
export const getDeepDivePlaylistDescription = (artistName: string, content?: DeepDivePlaylistDescriptionContent) => {
  const contentStr = getDeepDiveDescriptionContentTag(content);
  const restChars = 64;
  const left = PLAYLIST_DESCRIPTION_MAX - contentStr.length - myTag.length - restChars;
  return `The playlist of the artist's discography to make the "${ellipsizeString(getJustGoodPlaylistName(artistName), left)}" playlist! ${myTag}${contentStr}`
};
export const getJustGoodPlaylistName = (artistName: string) => (
  `${JUST_GOOD_INDICATOR} ${ellipsizeString(artistName, PLAYLIST_NAME_MAX - (JUST_GOOD_INDICATOR.length + 1))}`
);
export const getJustGoodPlaylistDescription = (artistName: string, content?: JustGoodPlaylistDescriptionContent) => {
  const contentStr = getJustGoodDescriptionContentTag(content);
  const restChars = 40;
  const left = PLAYLIST_DESCRIPTION_MAX - contentStr.length - myTag.length - restChars;
  return `Only the good songs from the "${ellipsizeString(getDeepDivePlaylistName(artistName), left)}" playlist. ${myTag}${getJustGoodDescriptionContentTag(content)}`
};
export const getInProgressJustGoodPlaylistName = (artistName: string) => (
  `${IN_PROGRESS_INDICATOR} ${ellipsizeString(artistName, PLAYLIST_NAME_MAX - (IN_PROGRESS_INDICATOR.length + 1))}`
);
export const getInProgressJustGoodPlaylistDescription = (artistName: string, content?: JustGoodPlaylistDescriptionContent) => {
  const contentStr = getJustGoodDescriptionContentTag(content);
  const restChars = 69;
  const left = PLAYLIST_DESCRIPTION_MAX - contentStr.length - myTag.length - restChars;
  return `!!! NOT FINISHED !!! Will be just the good songs from the "${ellipsizeString(getDeepDivePlaylistName(artistName), left)}" playlist. ${myTag}${getJustGoodDescriptionContentTag(content)}`
};

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

export const artistString = (artists?: Artist[]) => (
  artists ? artists.map((artist) => artist.name).join(', ') : ''
);

// remove all artists that aren't artists of the album
export const featuredArtists = (track: Track): Artist[] => (
  track.artists.filter((a) => !track.albumArtists.find((aa) => aa.id === a.id))
)

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
  justGoodPlaylists: CachedPlaylistWithJustGoodContent[],
  inProgressJustGoodPlaylists: CachedPlaylistWithJustGoodContent[],
  deepDivePlaylists: CachedDeepDivePlaylist[],
  userPlaylists: CachedPlaylist[],
} => {
  const justGoodPlaylists: CachedPlaylistWithJustGoodContent[] = [];
  const inProgressJustGoodPlaylists: CachedPlaylistWithJustGoodContent[] = [];
  const deepDivePlaylists: CachedDeepDivePlaylist[] = [];
  const userPlaylists: CachedPlaylist[] = [];

  playlists.forEach((playlist) => {
    const { justGoodContent, deepDiveContent } = playlist;
    if (justGoodContent || deepDiveContent) {
      if (justGoodContent) {
        if (justGoodContent.inProgress) {
          inProgressJustGoodPlaylists.push(playlist as CachedPlaylistWithJustGoodContent);
        } else {
          justGoodPlaylists.push(playlist as CachedPlaylistWithJustGoodContent);
        }
      } else if (deepDiveContent) {
        deepDivePlaylists.push(playlist as CachedDeepDivePlaylist)
      }
    } else {
      // TODO: Remove this once fully migrated
      // if (name.startsWith(JUST_GOOD_INDICATOR)) {
      //   justGoodPlaylists.push(playlist);
      // } else if (name.startsWith(IN_PROGRESS_INDICATOR)) {
      //   inProgressJustGoodPlaylists.push(playlist);
      // } else if (name.startsWith(DEEP_DIVE_INDICATOR)) {
      //   deepDivePlaylists.push(playlist)
      // } else {
      //   userPlaylists.push(playlist);
      // }
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
    } else if (playlist.justGoodContent.inProgress) {
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

export const getTrackUri = (id: string) => getUri('track', id);

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
export const arrayGetWrap = <T>(array: T[], index: number): T | undefined => array[wrapIndex(index, array.length)];

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
  justGoodContent: justGoodPlaylist.justGoodContent,
  deepDivePlaylist: justGoodPlaylist.deepDivePlaylist,
  progress: justGoodPlaylist.progress,
  artistId: justGoodPlaylist.artistId,
  numTracks: justGoodPlaylist.numTracks,
  notGoodIds: justGoodPlaylist.notGoodIds,
});

export const newTab = { target: "_blank", rel: "noreferrer noopener" };

export const nestProgress = (value: number, min: number, max: number) => (min + (value * (max - min)));

export const albumGroupString = (type: AlbumGroup): string => type.split('_').map(capitalize).join(' '); // overkill but sick

export const percent = (n: number): string => `${Math.round(n * 100)}%`;

export const backoffTimeoutMs = (n: number): number => {
  if (n === 1) {
    return 500;
  } else if (n === 2) {
    return 2500;
  } else if (n === 3) {
    return 5000;
  } else if (n === 4) {
    return 15000;
  } else {
    return 30000;
  }
};

export const setIntersection = <T>(s1: Set<T>, s2: Set<T>): Set<T> => {
  const sf = new Set<T>();

  s1.forEach(e => {
    if (s2.has(e)) {
      sf.add(e);
    }
  });

  return sf;
};

export const setSubtraction = <T>(s1: Set<T>, s2: Set<T>): Set<T> => {
  const sf = new Set<T>();

  s1.forEach(e => {
    if (!s2.has(e)) {
      sf.add(e);
    }
  });

  return sf;
};

export const min = (...args: number[]): number => args.reduce((a, b) => a > b ? b : a);
export const max = (...args: number[]): number => args.reduce((a, b) => a < b ? b : a);
