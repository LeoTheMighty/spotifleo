import React, { useEffect, useState } from 'react';
import { SpotifyAuth } from 'react-spotify-auth';
import SpotifyAuthButton from './SpotifyAuthButton';
import { generateAndStoreCodes } from './authHelper';
import { Fade } from 'react-bootstrap';


const SpotifyAuthView = () => {
  const [code, setCode] = useState<string | undefined>(undefined);
  const [showHardlyKnowHer, setShowHardlyKnowHer] = useState(false);

  useEffect(() => {
    setTimeout(() => setShowHardlyKnowHer(true), 1000);
    generateAndStoreCodes().then(codes => {
      console.log(codes);
      setTimeout(() => setCode(codes.code), 2000);
    }).catch((error) => {
      alert(error);
    });
  }, []);

  // do some marketting of your thing as well
  return (
    <div className="spotify-auth-view">
      <h1 className="d-flex flex-row align-items-center">
        <i className="bi bi-person-hearts mx-2 position-relative">
          <i className="bi bi-spotify floated-other-corner-icon" />
        </i>
        Deep Diver
        <span className="mx-1 emoji" role="img" aria-label="interrobang">⁉️</span>
      </h1>
      <i className={`mb-3 ${showHardlyKnowHer ? 'hardly-know-her show' : 'hardly-know-her'}`}> I hardly know her </i>
      <SpotifyAuthButton code={code} show={!!code}/>
    </div>
  );
};

export default SpotifyAuthView;
