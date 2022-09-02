import {
  Album, AlbumGroup, AlbumResponse,
  ArtistResponse,
  CachedPlaylist, FetchedAlbum,
  FetchResponse,
  PlaybackResponse,
  PlaylistResponse, PlaylistTrack, PlaylistTrackResponse, ProgressCallback, SpotifyItemResponse, Track, TrackResponse,
  UserProfileResponse,
} from '../types';
import { chunkList, formatQueryList, formatResp, percent } from '../logic/common';
import {
  deserializeAlbum, deserializeCachedPlaylist,
  deserializeFetchedAlbum,
  deserializeFetchedAlbums, deserializePlaylistTrack, deserializeTrack,
  deserializeTracks
} from '../logic/serializers';
import { range } from 'lodash';

// Doesn't exactly matter what this is named, just has to be different than Spotify's IDs
export const LIKED_INDICATOR = '*** LIKED ***';

const SPOTIFY_API_BASE_URI = 'https://api.spotify.com/v1';
const MAX_FETCH_ITEMS = 50;
const MAX_FETCH_ALBUMS = 20;
const MAX_ADD_TRACKS = 100;

const GET = 'GET';
const POST = 'POST'
const PUT = 'PUT';
const DELETE = 'DELETE';

type Query = { [param: string]: string | number | string[] | boolean };

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

/*

Returned in chronological order but then split into different album groups

 */

export const getArtistAlbums = async (artistID: string, limit: number, offset: number, token: string): Promise<FetchResponse<AlbumResponse>> => (
  callSpotifyAPI(token, `/artists/${artistID}/albums`, GET, {
    include_groups: 'album,single,appears_on',
    limit,
    offset,
  })
);

export const getLatestArtistAlbum = async (artistID: string, token: string): Promise<Album> => (
  deserializeAlbum((await getArtistAlbums(artistID, 1, 0, token)).items[0])
);

export const getAllArtistAlbums = async (artistID: string, token: string, pcb?: ProgressCallback): Promise<Album[]> => (
  fetchAll(
    (offset) => getArtistAlbums(artistID, MAX_FETCH_ITEMS, offset, token),
    deserializeAlbum,
    (response) => response.album_type !== 'compilation',
    (response) => `${response.name}_${response.album_type}`,
      pcb,
    )
);

export const getAllArtistAlbumsWithTracks = async (artistId: string, token: string, pcb?: ProgressCallback): Promise<FetchedAlbum[]> => {
  const albums: Album[] = await getAllArtistAlbums(artistId, token);

  const albumIds = [];
  const albumGroups: Map<string, AlbumGroup> = new Map();
  for (let i = 0; i < albums.length; i++) {
    albumIds.push(albums[i].id);
    albumGroups.set(albums[i].id, albums[i].albumGroup);
  }

  return deserializeFetchedAlbums(await getAllMultipleAlbums(albumIds, token, pcb)).map((album) => ({
    ...album,
    albumGroup: albumGroups.get(album.id) || album.albumGroup,
    // If it is the artist's own album/single, don't filter any of the songs
    tracks: (albumGroups.get(album.id) === 'appears_on') ?
      album.tracks.filter((t) => (
        t.artistIds?.includes(artistId))
      ) :
      album.tracks,
}));
}

export const getAlbumTracks = async (albumID: string, token: string): Promise<FetchResponse<TrackResponse>> =>
  callSpotifyAPI(token, `/albums/${albumID}/tracks`, GET, {});

export const getAllMultipleAlbums = async (albumIds: string[], token: string, pcb?: ProgressCallback): Promise<AlbumResponse[]> => {
  const albums: AlbumResponse[] = [];
  const chunks = chunkList(albumIds, MAX_FETCH_ALBUMS);
  for (let i = 0; i < chunks.length; i++) {
    const albumResponses = await getMultipleAlbums(chunks[i], token);
    albums.push(...albumResponses.albums);
    pcb?.(i / chunks.length);
  }
  console.log(albumIds.length);
  console.log(albums.length);

  return albums;
};

/**
 * MAX IS 20 IDs
 * @param albumIds
 * @param token
 */
export const getMultipleAlbums = async (albumIds: string[], token: string): Promise<{albums: AlbumResponse[]}> => (
  // TODO: CHECK IF NOT ALL TRACKS WERE RETURNED
  callSpotifyAPI(token, '/albums', GET, { ids: formatQueryList(albumIds) })
);

export const createPlaylist = async (name: string, description: string, publicAccess: boolean, token: string): Promise<PlaylistResponse> => (
  callSpotifyAPI(token, '/me/playlists', POST, undefined, {
    name,
    description,
    public: publicAccess,
  })
);

export const getPlaylistDetails = async (playlistID: string, token: string): Promise<PlaylistResponse> => (
  callSpotifyAPI(token, `/playlists/${playlistID}`, GET)
);

// Look into Fields to make this as efficient as possible. Not supported by everything don't worry about it
export const getPlaylistTracks = async (playlistID: string, limit: number, offset: number, token: string): Promise<FetchResponse<PlaylistTrackResponse>> => (
  callSpotifyAPI(token, `/playlists/${playlistID}/tracks`, GET, {
    // additional_types: '',
    // fields: '',
    limit,
    offset,
  })
);

// TODO: DOES THIS GET THE MOST RECENT TRACK OR LAST THE FIRST ONE?
export const getFirstPlaylistTrack = async (playlistID: string, token: string): Promise<PlaylistTrack | undefined> => {
  const { total, items } = await getPlaylistTracks(playlistID, 1, 0, token);
  return total === 0 ? undefined : deserializePlaylistTrack(items[0], 0);
};

// TODO: IF IT DOESN'T THEN USE THIS FUNCTION
export const getLastPlaylistTrack = async (playlistID: string, token: string): Promise<PlaylistTrack | undefined> => {
  const { total } = await getPlaylistTracks(playlistID, 1, 0, token);
  if (total === 0) return undefined;
  const { items } = await getPlaylistTracks(playlistID, 1, total - 1, token);
  return deserializePlaylistTrack(items[0], 0);
};

export const getAllPlaylistTracks = async (playlistId: string, token: string, pcb?: ProgressCallback): Promise<PlaylistTrack[]> => {
  return fetchAll((o) => getPlaylistTracks(playlistId, MAX_FETCH_ITEMS, o, token), deserializePlaylistTrack, undefined, undefined, pcb);
}

export const addTrackToPlaylist = async (playlistID: string, trackURI: string, token: string) => (
  addTracksToPlaylist(playlistID, [trackURI], token)
);
export const addTracksToPlaylist = async (playlistID: string, trackURIs: string[], token: string): Promise<{ 'snapshot_id': string }> => (
  callSpotifyAPI(token, `/playlists/${playlistID}/tracks`, POST, undefined, {
    uris: trackURIs,
  })
);
export const addAllTracksToPlaylist = async (playlistID: string, trackURIs: string[], token: string, pcb?: ProgressCallback) => {
  const chunks = chunkList(trackURIs, MAX_ADD_TRACKS);
  for (let i = 0; i < chunks.length; i++) {
    // We want to await each individual one so that the order remains consistent
    await addTracksToPlaylist(playlistID, chunks[i], token);
    pcb?.(i / chunks.length);
  }
}

export const replacePlaylistItems = async (playlistID: string, trackURIs: string[], insertBefore: number, token: string) => (
  callSpotifyAPI(token, `/playlists/${playlistID}/tracks`, PUT, {
    uris: trackURIs,
  }, {
    insert_before: insertBefore,
  })
);

export const replaceAllPlaylistItems = async (playlistID: string, trackURIs: string[], token: string, pcb?: ProgressCallback) => {
  const chunks = chunkList(trackURIs, MAX_ADD_TRACKS);
  for (let i = 0; i < chunks.length; i++) {
    // We want to await each individual one so that the order remains consistent
    // When it's the first one, we replace all existing, then we add on top
    if (i === 0) {
      await replacePlaylistItems(playlistID, chunks[i], MAX_ADD_TRACKS * i, token);
    } else {
      await addTracksToPlaylist(playlistID, chunks[i], token);
    }
    pcb?.(i / chunks.length);
  }
};

// export const replaceTracksInPlaylist = async (playlistID: string, trackURIs: string[], token: string) => {
//
// };

export const removePositionsFromPlaylist = async (playlistID: string, snapshotID: string, positions: number[], token: string): Promise<{ snapshot_id: string }> => (
  callSpotifyAPI(token, `/playlists/${playlistID}/tracks`, DELETE, undefined, {
    positions: positions,
    snapshot_id: snapshotID,
  })
);

export const removeTrackFromPlaylist = async (trackURI: string, playlistID: string, token: string) => (
  callSpotifyAPI(token, `/playlists/${playlistID}/tracks`, DELETE, undefined, {
    tracks: [{
      uri: trackURI,
    }]
  })
);

export const addTrackToLiked = async (trackID: string, token: string) => (
  callSpotifyAPI(token, '/me/tracks', PUT, { ids: [ trackID ]})
);

export const removeTrackFromLiked = async (trackID: string, token: string) => (
  callSpotifyAPI(token, '/me/tracks', DELETE, { ids: [ trackID ]})
);

export const changePlaylistDetails = async (playlistID: string, name: string | undefined, description: string | undefined, publicAccess: boolean | undefined, token: string) => (
  callSpotifyAPI(token, `/playlists/${playlistID}`, PUT, {}, {
    name,
    description,
    public: publicAccess,
  })
);

export const getCurrentUserProfile = async (token: string): Promise<UserProfileResponse> => (
  callSpotifyAPI(token, '/me', GET)
);

export const getAllCurrentUserPlaylists = async (token: string, pcb?: ProgressCallback): Promise<CachedPlaylist[]> => {
  const currentUserId = (await getCurrentUserProfile(token)).id;
  return fetchAll<PlaylistResponse, CachedPlaylist>(
    (offset) => getCurrentUserPlaylists(MAX_FETCH_ITEMS, offset, token),
    deserializeCachedPlaylist,
    (response) => (response.owner.id === currentUserId || response.collaborative),
    undefined,
    pcb,
  );
};

export const getCurrentUserPlaylists = async (limit: number, offset: number, token: string): Promise<FetchResponse<PlaylistResponse>> => (
  callSpotifyAPI(token, '/me/playlists', GET, {
    limit,
    offset,
  })
);

export const getAllCurrentUserLikedSongs = async (token: string, pcb?: ProgressCallback): Promise<Track[]> => (
  fetchAll(
    (offset) => getCurrentUserLikedSongs(MAX_FETCH_ITEMS, offset, token),
    deserializePlaylistTrack,
    undefined,
    undefined,
    pcb && ((n) => pcb(n, `Fetching all Current User Liked Songs (${percent(n)})`)),
  )
)
export const getCurrentUserLikedSongs = async (limit: number, offset: number, token: string): Promise<FetchResponse<PlaylistTrackResponse>> => (
  callSpotifyAPI(token, '/me/tracks', GET, {
    limit,
    offset,
  })
)

/**
 * TODO: TEST
 *
 * @param fetch
 * @param deserialize
 * @param filter
 * @param uniqueKey
 * @param progressCallback
 */
const fetchAll = async <T extends (SpotifyItemResponse | PlaylistTrackResponse), U>(
  fetch: (offset: number) => Promise<FetchResponse<T>>,
  deserialize: (response: T, index: number) => U,
  filter: (response: T) => boolean = () => true,
  uniqueKey?: (response: T) => string,
  progressCallback?: ProgressCallback,
): Promise<U[]> => {
  const items: U[] = [];
  let total = 1;
  let offset = 0;
  let uniqueSet: Set<string> | undefined = undefined;
  if (uniqueKey) { uniqueSet = new Set(); }
  while (offset < total) {
    const response = await fetch(offset);

    response.items.filter(filter).forEach((t, i) => {
      if (uniqueKey && uniqueSet) {
        const key = uniqueKey(t);
        if (uniqueSet.has(key)) return;
        uniqueSet.add(key);
      }
      items.push(deserialize(t, i))
    });

    offset += response.items.length;
    total = response.total

    progressCallback?.(offset / total);
  }
  return items;
};

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
export const playPlaylistPlayback = async (playlistUri: string, index: number, token: string) => callSpotifyAPI(token, '/me/player/play', PUT, undefined, {
  context_uri: playlistUri,  // the uri of the playlist/album to play
  offset: {
    position: index, // the index of the context to play
    // uri: '',     // the uri of the track to play
  }
});
export const toggleShuffle = async (shuffle: boolean, token: string) => callSpotifyAPI(token, '/me/player/shuffle', PUT, {
  state: shuffle,
});
export const setRepeatMode = async (state: 'track' | 'context' | 'off', token: string) => callSpotifyAPI(token, '/me/player/repeat', PUT, {
  state,
});
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
