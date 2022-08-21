export type SpotifyItemType = 'album' | 'artist' | 'playlist' | 'track' | 'show' | 'episode' | 'user';

export type Images = {
  small?: string;
  large?: string;
}

export interface SpotifyItem {
  id: string;
  type: SpotifyItemType;
  name: string;
  img?: Images;
  url: string;
  uri: string;
}

export type AlbumType = 'album' | 'single' | 'compilation';
export type AlbumGroup = AlbumType | 'appears_on'; // you can choose to also get albums that the artist appears on

// export interface ArtistPreview
// export interface AlbumPreview
// export interface TrackPreview

export interface Album extends SpotifyItem {
  artistIds?: string[];
  albumType: AlbumType;
  albumGroup: AlbumGroup;
  releaseDate: Date;
  trackCount: number;
  // restrictions
  // available markets?
}

export interface FetchedAlbum extends Album {
  tracks: Track[];
}

export interface Track extends SpotifyItem {
  artistIds?: string[];
  artistName?: string;
  artists: Artist[];
  albumId?: string;
  albumName?: string;
  albumArtists: Artist[];
  discNumber: number;
  trackNumber: number;
  popularity: number;
  duration: number; // milliseconds
  explicit: boolean;
}

export interface PlaylistTrack extends Track {
  addedAt: Date;
  playlistIndex: number;
  isLocal: boolean;
}

export interface PlayingTrack extends Track {
  playing?: boolean;
  progress: number; // milliseconds
  context?: { // where it's playing from
    type: 'album' | 'show' | 'artist' | 'playlist';
    id: string;
    uri: string;
  }
}

export interface PlayingPlaylistTrack extends PlaylistTrack, PlayingTrack {}

export interface Artist extends SpotifyItem {
  genre: string;
  popularity: number;
  followers?: number;
}

export interface FetchedArtist extends Artist {
  albums: Album[];
}

export interface Playlist extends SpotifyItem {
  description: string;
}

export interface FetchedPlaylist extends Playlist {
  tracks: Track[];
}

export interface Playback {
  playing?: SpotifyItem;
}

export interface CachedPlaylist {
  name: string;
  id: string;
  numTracks: number;
}

export interface FetchedCachedPlaylist extends CachedPlaylist {
  trackIds?: Set<string>;
}

export interface CachedJustGoodPlaylist extends CachedPlaylist {
  artistId?: string;
  artistImg?: Images;
  artistName: string;
  inProgress: boolean;
  progress: number; // which playlist track you last were on. Could also be helpful for creating list.
  deepDivePlaylist?: CachedPlaylist;
  trackIds?: Set<string>;
}

export interface JustGoodPlaylist extends CachedJustGoodPlaylist {
  trackIds: Set<string>;
  deepDiveTracks?: Track[];
}

// Auth
export interface PCKECodes {
  code: string;
  codeVerifier: string;
}

export interface Token {
  accessToken: string;
  refreshToken: string;
  expires: Date; // when the token has expired
}

// ============================
// API Request/Response Objects
// ============================

export interface SpotifyAccessTokenResponse {
  access_token: string;
  token_type: 'Bearer',
  scope: string; // space separated list of scopes that have been granted
  expires_in: number; // number of seconds when the access token is valid
  refresh_token: string;
}

export interface SpotifyRefreshTokenResponse {
  access_token: string;
  token_type: 'Bearer',
  scope: string; // space separated list of scopes that have been granted
  expires_in: number; // number of seconds when the access token is valid
}

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
  followers?: { href: string, total: number };
  genres: string[],
  images: ImageResponse[];
  name: string;
  popularity: number;
}

export interface AlbumResponse extends SpotifyItemResponse {
  type: 'album';
  album_type: AlbumType;
  album_group?: AlbumGroup; // The field is present when getting an artist's albums. Compare to album_type this field represents relationship between the artist and the album.
  total_tracks: number,
  available_markets: string[],
  images: { url: string, height: number, width: number }[],
  name: string,
  release_date: string;
  release_date_precision: 'year' | 'month' | 'day';
  restrictions?: { reason: 'market' | 'product' | 'explicit' };
  artists?: ArtistResponse[];
  tracks?: FetchResponse<TrackResponse>;
}

export interface TrackResponse extends SpotifyItemResponse {
  album?: AlbumResponse; // not present in fetch album tracks
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

/**
 * /audio-features/{id} or /audio-features
 */
export interface TrackFeatureResponse {
  acousticness: number; // <float> A confidence measure from 0.0 to 1.0 of whether the track is acoustic. 1.0 represents high confidence the track is acoustic. >= 0 <= 1
  analysis_url: string; // A URL to access the full audio analysis of this track. An access token is required to access this data.
  danceability: number; // <float> Danceability describes how suitable a track is for dancing based on a combination of musical elements including tempo, rhythm stability, beat strength, and overall regularity. A value of 0.0 is least danceable and 1.0 is most danceable.
  duration_ms: number;  // The duration of the track in milliseconds.
  energy: number; // <float> Energy is a measure from 0.0 to 1.0 and represents a perceptual measure of intensity and activity. Typically, energetic tracks feel fast, loud, and noisy. For example, death metal has high energy, while a Bach prelude scores low on the scale. Perceptual features contributing to this attribute include dynamic range, perceived loudness, timbre, onset rate, and general entropy.
  id: string; // The Spotify ID for the track.
  instrumentalness: number; // <float> Predicts whether a track contains no vocals. "Ooh" and "aah" sounds are treated as instrumental in this context. Rap or spoken word tracks are clearly "vocal". The closer the instrumentalness value is to 1.0, the greater likelihood the track contains no vocal content. Values above 0.5 are intended to represent instrumental tracks, but confidence is higher as the value approaches 1.0.
  key: number; // integer The key the track is in. Integers map to pitches using standard Pitch Class notation. E.g. 0 = C, 1 = C♯/D♭, 2 = D, and so on. If no key was detected, the value is -1. >= -1 <= 11
  liveness: number; // <float> Detects the presence of an audience in the recording. Higher liveness values represent an increased probability that the track was performed live. A value above 0.8 provides strong likelihood that the track is live.
  loudness: number; // <float> The overall loudness of a track in decibels (dB). Loudness values are averaged across the entire track and are useful for comparing relative loudness of tracks. Loudness is the quality of a sound that is the primary psychological correlate of physical strength (amplitude). Values typically range between -60 and 0 db.
  mode: number; // Mode indicates the modality (major or minor) of a track, the type of scale from which its melodic content is derived. Major is represented by 1 and minor is 0.
  speechiness: number; // <float> Speechiness detects the presence of spoken words in a track. The more exclusively speech-like the recording (e.g. talk show, audio book, poetry), the closer to 1.0 the attribute value. Values above 0.66 describe tracks that are probably made entirely of spoken words. Values between 0.33 and 0.66 describe tracks that may contain both music and speech, either in sections or layered, including such cases as rap music. Values below 0.33 most likely represent music and other non-speech-like tracks.
  tempo: number; // <float> The overall estimated tempo of a track in beats per minute (BPM). In musical terminology, tempo is the speed or pace of a given piece and derives directly from the average beat duration.
  time_signature: number; // integer An estimated time signature. The time signature (meter) is a notational convention to specify how many beats are in each bar (or measure). The time signature ranges from 3 to 7 indicating time signatures of "3/4", to "7/4". >= 3 <= 7
  track_href: string; // A link to the Web API endpoint providing full details of the track.
  type: 'audio_features';
  uri: string; // The Spotify URI for the track.
  valence: number; // <float> A measure from 0.0 to 1.0 describing the musical positiveness conveyed by a track. Tracks with high valence sound more positive (e.g. happy, cheerful, euphoric), while tracks with low valence sound more negative (e.g. sad, depressed, angry). >= 0 <= 1
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

export interface ContextResponse { // Where it's playing from
  type: 'artist' | 'playlist' | 'album' | 'show';
  href: string;
  external_uris: {
    spotify: string;
  };
  uri: string;
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
  context?: ContextResponse;
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

// View
export type DeepDiverViewType = 'edit-deep-dive' | 'deep-dive' | 'view-deep-dive';

export interface Progress {
  progress: number; // <float> 0.0 - 1.0;
  task: string;    // description of the high level task being completed
  current: string; // description of what is currently happening
}

export type ProgressCallback = (progress: number, current?: string) => void;

export type HelpViewType = 'usage' | 'not-in-progress' | 'not-in-beta' | undefined;

export class APIError extends Error {
  status: number;
  reason: string;

  constructor(status: number, reason: string) {
    super(`${reason} (${status})`);
    this.status = status;
    this.reason = reason;
  }
}

// export interface IconViewable extends SpotifyItem {
//   img: string; // src/url of img
//   title: string;
//   href: string; // url to item
// }

// export interface ListViewable extends SpotifyItem {
//
// }


