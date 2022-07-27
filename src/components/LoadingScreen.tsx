import React from 'react';
import { useStore } from '../state/SpotifyStoreProvider';
import { ProgressBar } from 'react-bootstrap';
import LoadingIndicator from '../common/LoadingIndicator';

const LoadingScreen = () => {
  const store = useStore();

  return (
    <div className="loading-page">
      { store.progress ? (
        <div>
          <h1> Loading... </h1>
          <div>
            <ProgressBar now={store.progress?.progress || 0} min={0} max={1}/>
          </div>
          <LoadingIndicator />
          Currently on: { store.progress?.current }
        </div>
      ) : (
        <div> Not currently loading. </div>
      )}
    </div>
  );
};

export default LoadingScreen;
