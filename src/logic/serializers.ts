import {
  Album,
  AlbumResponse,
  Artist,
  ArtistResponse, CachedPlaylist, FetchedAlbum,
  Playlist,
  PlaylistResponse,
  Track,
  TrackResponse
} from '../types';
import { getArtistIds, getGenre, getImages } from './common';

export const deserializeArtists = (artists: ArtistResponse[]): Artist[] => artists.map(deserializeArtist);
export const deserializeArtist = ({ id, external_urls: { spotify }, images, uri, name, popularity, genres, }: ArtistResponse): Artist => ({
  id,
  name,
  type: 'artist',
  url: spotify,
  uri,
  img: getImages(images),
  genre: getGenre(genres),
  popularity,
});

export const deserializeTracks = (tracks: TrackResponse[], passedAlbum?: AlbumResponse): Track[] => tracks.map((t) => deserializeTrack(t, passedAlbum));
export const deserializeTrack = ({ id, name, album, popularity, uri, external_urls: { spotify }, artists, disc_number, track_number, duration_ms, explicit }: TrackResponse, passedAlbum?: AlbumResponse): Track => ({
  id,
  name,
  type: 'track',
  img: getImages(passedAlbum?.images || album?.images),
  popularity,
  url: spotify,
  uri,
  artistIds: getArtistIds(artists),
  albumId: passedAlbum?.id || album?.id,
  discNumber: disc_number,
  trackNumber: track_number,
  duration: duration_ms,
  explicit,
});

export const deserializeAlbums = (albums: AlbumResponse[]): Album[] => albums.map(deserializeAlbum);
export const deserializeAlbum = ({ id, name, external_urls: { spotify }, uri, images, album_group, album_type, release_date, total_tracks, artists }: AlbumResponse): Album => ({
  id,
  name,
  type: 'album',
  url: spotify,
  uri,
  img: getImages(images),
  albumType: album_type,
  albumGroup: album_group || album_type,
  releaseDate: new Date(release_date),
  artistIds: getArtistIds(artists),
  trackCount: total_tracks,
});

export const deserializeFetchedAlbums = (albums: AlbumResponse[]): FetchedAlbum[] => albums.map(deserializeFetchedAlbum);
export const deserializeFetchedAlbum = (album: AlbumResponse): FetchedAlbum => ({
  ...deserializeAlbum(album),
  tracks: album.tracks ? deserializeTracks(album.tracks?.items, album) : [],
});


export const deserializeCachedPlaylists = (playlists: PlaylistResponse[]): CachedPlaylist[] => playlists.map(deserializeCachedPlaylist);
export const deserializeCachedPlaylist = ({ id, name }: PlaylistResponse): CachedPlaylist => ({ id, name });

// export const deserializePlaylists = (playlists: PlaylistResponse[]): Playlist[] => playlists.map(deserializePlaylist);
// export const deserializePlaylist = ({ id }: PlaylistResponse): Playlist => ({
//
// });
//
// export const deserializePlaylist = (playlistResponse: PlaylistResponse): Playlist => {
//
// };
