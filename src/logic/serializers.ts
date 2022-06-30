import { Artist, ArtistResponse, Playlist, PlaylistResponse } from '../types';
import { getGenre, getImages } from './common';

export const serializeArtists = (artists: ArtistResponse[]): Artist[] => artists.map(serializeArtist);
export const serializeArtist = ({ id, href, images, uri, name, popularity, genres, }: ArtistResponse): Artist => ({
  id,
  name,
  type: 'artist',
  url: href,
  uri,
  img: getImages(images),
  genre: getGenre(genres),
  popularity,
});

// export const serializePlaylist = (playlistResponse: PlaylistResponse): Playlist => {
//
// };
