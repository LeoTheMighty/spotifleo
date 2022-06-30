import { ArtistResponse, CachedPlaylist, ImageResponse, Images, JustGoodPlaylist } from '../types';

export const JUST_GOOD_INDICATOR = 'Just Good';
export const PROGRESS_INDICATOR = 'In Progress';

export const formatResp = async (r: Response): Promise<any> => new Promise((resolve, reject) => {
  if (r.status === 204) return resolve(true);
  r.json().then((resp) => {
    if (resp.error) {
      reject(resp.error);
    } else {
      resolve(resp);
    }
  });
});

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

export const artistString = (artists?: ArtistResponse[]) => (
  artists ? artists.map((artist) => artist.name).join(',') : ''
);

export const getImages = (images?: ImageResponse[]): Images => {
  let minURL = '';
  let minHeight = Infinity;
  let maxURL = '';
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

export const formatMs = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${(seconds % 60) < 10 ? '0' : ''}${seconds % 60}`
};

export const splitPlaylists = (playlists: CachedPlaylist[]): {
  justGoodPlaylists: CachedPlaylist[],
  progressPlaylists: CachedPlaylist[],
  userPlaylists: CachedPlaylist[],
} => {
  const justGoodPlaylists: CachedPlaylist[] = [];
  const progressPlaylists: CachedPlaylist[] = [];
  const userPlaylists: CachedPlaylist[] = [];

  playlists.forEach((playlist) => {
    if (playlist.name.startsWith(JUST_GOOD_INDICATOR)) {
      justGoodPlaylists.push(playlist);
    } else if (playlist.name.startsWith(PROGRESS_INDICATOR)) {
      progressPlaylists.push(playlist);
    } else {
      userPlaylists.push(playlist);
    }
  });

  return { justGoodPlaylists, progressPlaylists, userPlaylists };
};

export const splitJustGoodPlaylists = (playlists: JustGoodPlaylist[]): {
  inProgressJustGoodPlaylists: JustGoodPlaylist[],
  finishedJustGoodPlaylists: JustGoodPlaylist[],
} => {
  const inProgressJustGoodPlaylists: JustGoodPlaylist[] = [];
  const finishedJustGoodPlaylists: JustGoodPlaylist[] = [];

  for (let i = 0; i < playlists.length; i++) {
    const playlist = playlists[i];
    (playlist.progressPlaylist ? inProgressJustGoodPlaylists : finishedJustGoodPlaylists).push(playlist);
  }

  return {
    finishedJustGoodPlaylists,
    inProgressJustGoodPlaylists,
  };
}

