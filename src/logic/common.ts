import { ArtistResponse, ImageResponse, Images } from '../types';

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
