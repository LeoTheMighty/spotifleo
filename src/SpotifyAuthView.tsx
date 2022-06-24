import React from 'react';
import { SpotifyAuth } from 'react-spotify-auth';

const SPOTIFY_APP_CLIENT_ID = 'd10c6c2ff3604a669ee4016dc8b3d976';
const scopes = [
  'playlist-modify-public',
  'user-library-modify',
  'streaming',
  'user-read-playback-state',
]

type Props = {
  setToken: (token: string) => void;
}

const SpotifyAuthView = ({ setToken }: Props) => {
  // do some marketting of your thing as well
  return (
    <div>
      <SpotifyAuth
        redirectUri={window.location.href}
        clientID={SPOTIFY_APP_CLIENT_ID}
        scopes={scopes}
        onAccessToken={setToken}
      />
    </div>
  );
};

export default SpotifyAuthView;
