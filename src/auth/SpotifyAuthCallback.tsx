import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingIndicator from '../common/LoadingIndicator';
import { fetchAccessToken, getParams } from './authHelper';
import { getPKCECodes, storeToken } from '../logic/storage';
import { useStore } from '../state/SpotifyStoreProvider';

const SpotifyAuthCallback = () => {
  const store = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Get params from the URL
    const params = getParams();

    // params.error // params.state
    if (params && params.code) {
      const verifier = getPKCECodes()?.codeVerifier;

      if (verifier) {
        fetchAccessToken(params.code, verifier).then((response) => {
          store.newToken(response.access_token, response.refresh_token, response.expires_in);

          navigate('/');
        }).catch((error) => {
          console.debug('Ignoring failure');
        });
      } else {
        console.error('Failed to get the verifier code...')
      }
    } else {
      console.error('Failed to fetch the access token');
      console.log(params);
      console.log(window.location.href);
    }
  }, []);

  return (<LoadingIndicator />);
};

export default SpotifyAuthCallback;
