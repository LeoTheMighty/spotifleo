import { CachedPlaylist, Images, JustGoodPlaylist, PCKECodes, Token } from '../types';

const CODES_KEY = 'codes';
const TOKEN_KEY = 'token';
const USER_KEY = 'user_cache';

type StoredToken = {
  accessToken: string;
  refreshToken: string;
  expires: string;
};

export type StoredUser = {
  userId: string;
  userName: string;
  userImg: Images;
  userPlaylists: CachedPlaylist[];
  justGoodPlaylists: JustGoodPlaylist[];
};

const parse = <T>(value?: string | null): T | undefined => {
  if (value) return JSON.parse(value);
  return undefined;
};

export const storePKCECodes = (codes: PCKECodes): PCKECodes => {
  sessionStorage.setItem(CODES_KEY, JSON.stringify(codes));
  return codes;
}
export const getPKCECodes = (): PCKECodes | undefined => parse(sessionStorage.getItem(CODES_KEY));
export const storeToken = (token: Token): Token => {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(token));
  return token;
}
export const getToken = (): Token | undefined => {
  const token: StoredToken | undefined = parse(localStorage.getItem(TOKEN_KEY));
  if (!token) return undefined;
  return {
    accessToken: token.accessToken,
    refreshToken: token.refreshToken,
    expires: new Date(token.expires),
  };
}

export const storeUser = (user: StoredUser) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getUser = (): StoredUser | undefined => (
  parse(localStorage.getItem(USER_KEY))
);

