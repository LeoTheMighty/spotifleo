import React from 'react';
import { getRedirectURL } from './authHelper';
import { getScope } from '../logic/common';

type Props = {
  code: string;
  state?: string;
};

const SpotifyAuthButton = ({ code, state }: Props) => {
  return(
    <a className="spotify-auth-button" href={getRedirectURL(code, state)}>
      Click to authorize Spotify
    </a>
  );
};

export default SpotifyAuthButton;
