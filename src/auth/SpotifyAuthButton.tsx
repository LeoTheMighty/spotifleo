import React from 'react';
import { getRedirectURL } from './authHelper';
import { getScope } from '../logic/common';

type Props = {
  code?: string;
  state?: string;
  show: boolean;
};

const SpotifyAuthButton = ({ code, state, show }: Props) => {
  return(
    <a className={`spotify-auth-button ${show ? 'show' : ''}`} href={code && getRedirectURL(code, state)}>
      <i className="bi bi-spotify mx-1" />
      Continue with Spotify
    </a>
  );
};

export default SpotifyAuthButton;
