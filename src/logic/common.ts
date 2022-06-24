import { ArtistResponse, ImageResponse } from '../types';

export const artistString = (artists?: ArtistResponse[]) => (
  artists ? artists.map((artist) => artist.name).join(',') : ''
);

export const getImages = (images?: ImageResponse[]): { small: string, large: string } => {
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

export const formatMs = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${(seconds % 60) < 10 ? '0' : ''}${seconds % 60}`
};
