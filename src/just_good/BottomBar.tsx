import React from 'react';
import BackgroundPlayer from './BackgroundPlayer';
import { useStore } from '../state/SpotifyStoreProvider';

const BottomBar = () => {
  const store = useStore();

  return (
    <div className={`bottom-bar ${store.token ? 'show' : ''}`}>
      { store.token && <BackgroundPlayer /> }
    </div>
  );
};

export default BottomBar;
