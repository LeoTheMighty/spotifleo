import React, { useEffect } from 'react';
import useSpotifyStore from '../state/SpotifyStore';
import Slider from './SpotifySlider';
import { observer } from 'mobx-react';

const BackgroundPlayer = observer(() => {
  const store = useSpotifyStore();

  useEffect(() => {
    console.log('update player');
    store.updatePlayer();

    if (store.playing) {
      setTimeout(pretendSeekCallback, 1000);
    }
  }, [store, store.playing]);

  const pretendSeekCallback = async () => {
    if (store?.playing) {
      await store.pretendToProceedPosition();

      if (store.currentTrackProgress >= store.currentTrackDuration) {
        store.updatePlayer();
      }

      setTimeout(pretendSeekCallback, 1000);
    }
  }

  useEffect(() => {
  }, [store, store.playing])

  return ( // if you drag, then it goes back?
    <div className="background-player">
      { /* Component to drag upwards */ }
      <div>

      </div>
      <div className="background-player-action-panel">
        <img className="background-player-album" src={store.currentTrackSmallImageURL} alt="test" />
        <div className="background-player-description">
          <b className="no-wrap">
            { store.currentTrackName }
          </b>
          <p className="m-0 no-wrap">
            { store.currentTrackArtist }
          </p>
        </div>
        <button className="prev-button" onClick={store.skipPrevious}>
          <i className="bi bi-skip-start-fill" />
        </button>
        <button className="play-button" onClick={store.togglePlaying}>
          { store.playing ? (
            <i className="bi bi-pause-circle-fill" />
          ) : (
            <i className="bi bi-play-circle-fill" />
          )}
        </button>
        <button className="next-button" onClick={store.skipNext}>
          <i className="bi bi-skip-end-fill" />
        </button>
        <button className="background-player-good-button">
          Good
        </button>
      </div>
      <Slider store={store} />
    </div>
  );
});

export default BackgroundPlayer;
