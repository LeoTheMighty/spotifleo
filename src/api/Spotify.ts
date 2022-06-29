// What to port over

import { ArtistResponse, FetchResponse, PlaybackResponse } from '../types';
import { formatResp } from '../logic/common';

const SPOTIFY_API_BASE_URI = 'https://api.spotify.com/v1';
const MAX_FETCH_ITEMS = 50;

const GET = 'GET';
const POST = 'POST'
const PUT = 'PUT';
const DELETE = 'DELETE';

type Query = { [param: string]: string | number };

// What API calls do we need?

// 0. Search for an artist
// 1. Get all artist's tracks? (fir)
//    a. Get all artist's albums
//    b. Get all tracks from albums
// 2. Create Playlist (Just Good)
// 3. Get Playlist tracks
// 4. Get all user's playlists to find Just Good playlist
//    a. Do we want a special designation for this? How to mark it and use spotify for storage
// 5. Add track to playlist at the end
// 6. Remove all occurrences of a track in a playlist
// 7. Search all of your playlists
//    a. How bad of an idea is it to fetch all playlists and then fuse.js the shit outta it

export const searchForArtist = async (
  name: string,
  limit: number,
  token: string,
): Promise<{ artists: FetchResponse<ArtistResponse> }> => (
  callSpotifyAPI(token, '/search', GET, {
    q: name,
    type: 'artist',
    limit: limit,
    offset: 0,
  })
);

export const getArtistAlbums = async (artistID: string, token: string) => (
  callSpotifyAPI(token, `/artists/${artistID}/albums`, GET, {
    limit: MAX_FETCH_ITEMS,
  })
)

export const getAlbumTracks = async (albumID: string, token: string) =>
  callSpotifyAPI(token, `/albums/${albumID}/tracks`, GET, {

  });

// TODO i wonder if this works
export const createPlaylist = async (name: string, description: string, token: string) => (
  callSpotifyAPI(token, '/me/playlists', POST, undefined, {
    name,
    description,
  })
);

// Look into Fields to make this as efficient as possible. Not supported by everything don't worry about it
export const getPlaylistTracks = async (playlistID: string, limit: number, offset: number, token: string) => (
  callSpotifyAPI(token, `/playlists/${playlistID}/tracks`, GET, {
    // additional_types: '',
    // fields: '',
    limit,
    offset,
  })
);

// TODO IF we're ever adding a lot of songs, use the body instead for the values
export const addTrackToPlaylist = async (playlistID: string, trackURI: string, token: string) => (
  callSpotifyAPI(token, `/playlists/${playlistID}/tracks`, POST, {
    position: 1,
    uris: trackURI,
  })
);

export const removeTrackFromPlaylist = async (trackURI: string, playlistID: string, token: string) => (
  callSpotifyAPI(token, `/playlists/${playlistID}/tracks`, DELETE, undefined, {
    tracks: [{
      uri: trackURI,
    }]
  })
);
export const getCurrentUserPlaylists = async (limit: number, offset: number, token: string) => (
  callSpotifyAPI(token, '/me/playlists', GET, {
    limit,
    offset,
  })
);


/**
 * Returns a string formatted to append to the end of a URL in order to define query parameters.
 *
 * @param queryValues The object demonstrating the values of the query parameters for the request.
 */
const query = (queryValues?: Query): string | undefined => (
  queryValues && '?' + Object.keys(queryValues).map(k => k + '=' + queryValues[k]).join('&')
);

/**
 * For endpoints that provide a `next` value from an API response (all will be GET requests),
 * we can simply call its `next` value to continue the full desired API call.
 *
 * @param token The oauth access token from when the user authorized the application.
 * @param nextUrl The URL received from the previous API call.
 */
export const callNext = async (token: string, nextUrl: string): Promise<any> => callSpotifyAPI(token, nextUrl, GET);

export const getPlayback = async (token: string): Promise<PlaybackResponse> => callSpotifyAPI(token, '/me/player', GET);
export const playPlayback = async (token: string) => callSpotifyAPI(token, '/me/player/play', PUT);
export const pausePlayback = async (token: string) => callSpotifyAPI(token, '/me/player/pause', PUT);
export const nextPlayback = async (token: string) => callSpotifyAPI(token, '/me/player/next', POST);
export const prevPlayback = async (token: string) => callSpotifyAPI(token, '/me/player/previous', POST);
export const seekPlayback = async (position: number, token: string) => callSpotifyAPI(token, '/me/player/seek', PUT, {
  position_ms: position,
});


/**
 * Calls the Spotify API with the given parameters.
 *
 * @param token The oauth access token from when the user authorized the application.
 * @param endpoint The endpoint in the Spotify API to hit.
 * @param method The HTTP method to hit the Spotify API with.
 * @param queryValues The query values object to send in with the request. Will be embedded into the URI.
 * @param body The body to send into the request.
 */
const callSpotifyAPI = async (
  token: string,
  endpoint: string,
  method: string,
  queryValues?: Query,
  body?: Object,
) => new Promise<any>((resolve, reject) => {
  fetch(SPOTIFY_API_BASE_URI + endpoint + (query(queryValues) || ''), {
    method,
    headers: { authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  }).then(formatResp).then(resolve).catch(reject);
});
