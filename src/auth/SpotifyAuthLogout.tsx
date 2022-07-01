import React, { useEffect } from 'react';
import LoadingIndicator from '../common/LoadingIndicator';
import { useStore } from '../state/SpotifyStoreProvider';
import { useNavigate } from 'react-router-dom';

const SpotifyAuthLogout = () => {
  const store = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    store.deauthorize();

    console.log('deauthorized user successfully.');

    navigate('/spotifleo');
  }, [store, navigate]);

  return <LoadingIndicator />;
};

export default SpotifyAuthLogout;
