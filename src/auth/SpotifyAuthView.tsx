import React, { useEffect, useState } from 'react';
import { SpotifyAuth } from 'react-spotify-auth';
import SpotifyAuthButton from './SpotifyAuthButton';
import { generateAndStoreCodes } from './authHelper';


const SpotifyAuthView = () => {
  const [code, setCode] = useState<string | undefined>(undefined);

  useEffect(() => {
    generateAndStoreCodes().then(codes => setCode(codes.code));
  }, []);

  // do some marketting of your thing as well
  return (
    <div>
      {/*<SpotifyAuth*/}
      {/*  redirectUri={window.location.href}*/}
      {/*  clientID={SPOTIFY_APP_CLIENT_ID}*/}
      {/*  scopes={scopes}*/}
      {/*  onAccessToken={setToken}*/}
      {/*/>*/}
      { code && <SpotifyAuthButton code={code} /> }
    </div>
  );
};

export default SpotifyAuthView;
