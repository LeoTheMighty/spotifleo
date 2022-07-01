import { formatResp, getScope } from '../logic/common';
import { PCKECodes, SpotifyAccessTokenResponse, SpotifyRefreshTokenResponse, Token } from '../types';
import { storePKCECodes } from '../logic/storage';

const oauthURL = 'https://accounts.spotify.com';
const redirectUri = window.location.origin + '/spotifleo/callback'
const scopes = ['playlist-modify-public', 'user-library-modify', 'streaming', 'user-read-playback-state'];

// technically supposed to be secret don't print out these bad boys
const clientID = process.env.REACT_APP_CI!;
const clientSecret = process.env.REACT_APP_CS!;

console.log(clientID);


// Code generation
const generateCodeVerifier = (): string => {
  const array = new Uint32Array(56 / 2);
  window.crypto.getRandomValues(array);
  return Array.from(array, (d) => ('0' + d.toString(16)).substring(-2)).join('');
};

const sha256 = async (plain: string): Promise<ArrayBuffer> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
}

const base64urlencode = (a: ArrayBuffer): string => {
  let str = '';
  const bytes = new Uint8Array(a);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

}

const generateChallenge = async (verifier: string): Promise<string> => base64urlencode(await sha256(verifier));

export const generateAndStoreCodes = async (): Promise<PCKECodes> => {
  const codeVerifier = generateCodeVerifier();
  return storePKCECodes({
    codeVerifier,
    code: await generateChallenge(codeVerifier),
  });
}

// URLs
export const getRedirectURL = (code: string, state?: string) => (
  oauthURL + '/authorize?' +
  'response_type=code' +
  `&client_id=${clientID}` +
  `&scope=${scopes.join('%20')}` +
  `&redirect_uri=${redirectUri}` +
  `&code_challenge_method=S256` +
  `$code_challenge=${code}` +
  (state ? `&state=${state}` : '') +
  `&show_dialog=false`
);

const getRequestAccessTokenURL = (
  clientID: string,
  redirectUri: string,
  code: string,
  codeVerifier: string,
) => (oauthURL + '/api/token?' +
  'grant_type=authorization_code' +
  `&redirect_uri=${redirectUri}` +
  `&client_id=${clientID}` +
  `&code=${code}` +
  `&code_verifier=${codeVerifier}`
);

const getRequestRefreshTokenURL = (
  clientID: string,
  refreshToken: string,
) => (oauthURL + '/api/token?' +
  `grant_type=refresh_token` +
  `&refresh_token=${refreshToken}` +
  `&client_id=${clientID}`
);

const getAuthorizationHeader = (clientID: string, clientSecret: string) => (
  'Basic ' + btoa(clientID + ':' + clientSecret)
);

export const fetchAccessToken = async (code: string, codeVerifier: string): Promise<SpotifyAccessTokenResponse> => (
  new Promise((resolve, reject) => {
    fetch(getRequestAccessTokenURL(clientID, redirectUri, code, codeVerifier), {
      method: 'POST',
      headers: {
        Authorization: getAuthorizationHeader(clientID, clientSecret),
        'content-type': 'application/x-www-form-urlencoded',
      },
    }).then(formatResp).then(resolve).catch(reject);
  })
);

export const fetchRefreshToken = async (refreshToken: string): Promise<SpotifyRefreshTokenResponse> => (
  new Promise((resolve, reject) => {
    fetch(getRequestRefreshTokenURL(clientID, refreshToken), {
        method: 'POST',
        headers: {
          Authorization: getAuthorizationHeader(clientID, clientSecret),
          'content-type': 'application/x-www-form-urlencoded',
        },
    }).then(formatResp).then(resolve).catch(reject);
  })
);

export const shouldRefreshToken = (token: Token): boolean => token.expires <= new Date();
