export type SpotifyItemType = 'album' | 'artist' | 'playlist' | 'track' | 'show' | 'episode' | 'user';

export interface SpotifyItem {
  type: SpotifyItemType;
  name: string;
  img: string;
  url: string;
  uri: string;
}

// export interface IconViewable extends SpotifyItem {
//   img: string; // src/url of img
//   title: string;
//   href: string; // url to item
// }

// export interface ListViewable extends SpotifyItem {
//
// }

export interface Album extends SpotifyItem {
  artist: string;
}

export interface Track extends SpotifyItem {
  artist: string;
}

export interface Artist extends SpotifyItem {}

export interface Playlist extends SpotifyItem {}

export interface Playback {
  playing?: SpotifyItem;

}

// ============================
// API Request/Response Objects
// ============================

export interface SpotifyItemResponse {
  id: string;
  type: SpotifyItemType;
  uri: string;
  href: string;
  external_urls: { spotify: string };
}

export type FetchResponse<T extends (SpotifyItemResponse | PlaylistTrackResponse)> = {
  href: string; //A link to the Web API endpoint returning the full result of the request
  items: T[]; // array of objects. The requested content
  limit: number; // The maximum number of items in the response (as set in the query or by default).
  next: string | null; // URL to the next page of items. ( null if none)
  offset: number; // The offset of the items returned (as set in the query or by default)
  previous: string | null; // URL to the previous page of items. ( null if none)
  total: number;
}

export interface ImageResponse {
  url: string;
  height: number;
  width: number;
}

export interface ArtistResponse extends SpotifyItemResponse {
  type: 'artist';
  external_urls: { spotify: string };
  followers: { href: string, total: 0 };
  genres: string[],
  images: ImageResponse[];
  name: string;
  popularity: number;
}

export interface AlbumResponse extends SpotifyItemResponse {
  type: 'album';
  album_type?: string;
  album_group?: string; // The field is present when getting an artist's albums. Compare to album_type this field represents relationship between the artist and the album.
  total_tracks?: number,
  available_markets?: string[],
  images?: { url: string, height: number, width: number }[],
  name?: string,
  release_date?: string;
  release_date_precision?: 'year' | 'month' | 'day';
  restrictions?: { reason: 'market' | 'product' | 'explicit' };
  artists?: ArtistResponse[];
  tracks?: FetchResponse<TrackResponse>;
}

export interface TrackResponse extends SpotifyItemResponse {
  album?: AlbumResponse;
  artists: ArtistResponse[];
  available_markets?: string[]; // A list of the countries in which the track can be played, identified by their ISO 3166-1 alpha-2 code.
  disc_number: number; // The disc number (usually 1 unless the album consists of more than one disc).
  duration_ms: number; // The track length in milliseconds.
  explicit: boolean; // Whether or not the track has explicit lyrics ( true = yes it does; false = no it does not OR unknown).
  external_ids: {
    isrc: string; // International Standard Recording Code
    ean: string; // International Article Number
    upc: string; // Universal Product Code
  }
  external_urls: {
    spotify: string; // The Spotify URL for the object.
  };
  is_playable?: boolean; // Part of the response when Track Relinking is applied. If true, the track is playable in the given market. Otherwise false.
  linked_from?: TrackResponse;
  restrictions: { // Included in the response when a content restriction is applied. See Restriction Object for more details.
    reason: 'market' | 'product' | 'explicit' | string; // The reason for the restriction. Supported values:
    // market - The content item is not available in the given market.
    // product - The content item is not available for the user's subscription type.
    // explicit - The content item is explicit and the user's account is set to not play explicit content.
    // Additional reasons may be added in the future. Note: If you use this field, make sure that your application safely handles unknown values.
  };
  name: string; // The name of the track.
  popularity: number; // The popularity of the track. The value will be between 0 and 100, with 100 being the most popular.
  // The popularity of a track is a value between 0 and 100, with 100 being the most popular. The popularity is calculated by algorithm and is based, in the most part, on the total number of plays the track has had and how recent those plays are.
  // Generally speaking, songs that are being played a lot now will have a higher popularity than songs that were played a lot in the past. Duplicate tracks (e.g. the same track from a single and an album) are rated independently. Artist and album popularity is derived mathematically from track popularity. Note: the popularity value may lag actual popularity by a few days: the value is not updated in real time.
  preview_url?: string; // A link to a 30 second preview (MP3 format) of the track. Can be null
  track_number: number; // The number of the track. If an album has several discs, the track number is the number on the specified disc.
  type: 'track';
  is_local: boolean; // Whether or not the track is from a local file.
}

export interface UserResponse extends SpotifyItemResponse {
  type: 'user';
  display_name: string; // The name displayed on the user's profile. null if not available.
  followers: { href: string, total: number };
}

export interface UserProfileResponse extends UserResponse {
  country: string; // The country of the user, as set in the user's account profile. An ISO 3166-1 alpha-2 country code. This field is only available when the current user has granted access to the user-read-private scope.
  email: string; // The user's email address, as entered by the user when creating their account. Important! This email address is unverified; there is no proof that it actually belongs to the user. This field is only available when the current user has granted access to the user-read-email scope.
  explicit_content: { // The user's explicit content settings. This field is only available when the current user has granted access to the user-read-private scope.
    filter_enabled: boolean; // When true, indicates that explicit content should not be played.
    filter_locked: boolean; // When true, indicates that the explicit content setting is locked and can't be changed by the user.
  };
  images: ImageResponse[]; // user's profile image
  product: 'premium' | 'free' | 'open'; // The user's Spotify subscription level: "premium", "free", etc. (The subscription level "open" can be considered the same as "free".) This field is only available when the current user has granted access to the user-read-private scope.
}

export interface PlaylistTrackResponse {
  added_at: string;
  added_by: UserResponse;
  is_local: boolean;
  primary_color: string;
  track: TrackResponse;
  video_thumbnail: { url: string };
}

export interface PlaylistResponse extends SpotifyItemResponse {
  type: 'playlist';
  collaborative: boolean;
  description: string;
  external_urls: {
    spotify: string; // The Spotify URL for the object.
  };
  images: ImageResponse[];
  name: string;
  owner: UserResponse;
  primary_color: string; // LMAO this is not advertised by them
  public: boolean;
  snapshot_id: string;
  tracks: FetchResponse<PlaylistTrackResponse>;
}

export interface PlaybackResponse {
  device: {
    id: string;
    is_active: boolean;
    is_private_session: boolean;
    is_restricted: boolean;
    name: string;
    type: string;
    volume_percent: number; // 0 - 100
  };
  repeat_state: 'off' | 'track' | 'context';
  shuffle_state: string; // not boolean?? "if shuffle is on or off"
  context?: {
    type: 'artist' | 'playlist' | 'album' | 'show';
    href: string;
    external_uris: {
      spotify: string;
    };
    uri: string;
  };
  timestamp: number; // Unix milliseocnd timestamp when data was fetched
  progress_ms?: number; // progress into the currently playing track or episode
  is_playing: boolean;
  item: TrackResponse;
  currently_playing_type: 'track' | 'episode' | 'ad' | 'unknown';
  actions: { // allows to update the user interface on which playback actions are available within the current context
    interrupting_playback?: boolean;
    pausing?: boolean;
    resuming?: boolean;
    seeking?: boolean;
    skipping_next?: boolean;
    skipping_prev?: boolean;
    toggling_repeat_context?: boolean;
    toggling_shuffle?: boolean;
    toggling_repeat_track?: boolean;
    transferring_playback?: boolean; // transferring playback between devices
  };
}


