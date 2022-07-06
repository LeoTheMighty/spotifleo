import React, { useEffect } from 'react';
import useSpotifyStore from '../state/SpotifyStore';
import Slider from './SpotifySlider';
import { observer } from 'mobx-react';
import ToggleButton from '../components/ToggleButton';
import defaultAvatar from '../images/default_avatar.jpeg';

const SHOULD_PRETEND = true;

const BackgroundPlayer = observer(() => {
  const store = useSpotifyStore();

  useEffect(() => {
    console.log('update player');
    store.updatePlayer();
    if (store.playing && SHOULD_PRETEND) {
      setTimeout(pretendSeekCallback, 1000);
    }
  }, [store, store.playing]);

  const pretendSeekCallback = async () => { // TODO a lot of times we get into a double loop of this. fix
    if (store?.playing && SHOULD_PRETEND) {
      await store.pretendToProceedPosition();

      if (store.currentTrackProgress >= store.currentTrackDuration) {
        await store.updatePlayer();
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
        <img className="background-player-album" src={store.currentTrackSmallImageURL || defaultAvatar} alt="test" />
        <div className="background-player-description">
          <div className="h-100 m-1 d-flex align-items-start wrap overflow-hidden">
            <b>
              { store.currentTrackName }
            </b>
          </div>
          <div className="h-100 m-1 d-flex align-items-start wrap overflow-hidden">
            <p>
              { store.currentTrackArtist }
            </p>
          </div>
        </div>
        <div className="d-flex background-player-remote"> {/* This needs to stay in the middle */}
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
        </div>
        {/*<div className="background-player-spacer" />*/}
        <div className="background-player-good-button-container">
          <ToggleButton
            className="background-player-good-button"
            on="Good"
            off="Eh."
          />
        </div>
        {/*<button className="background-player-good-button">*/}
        {/*  Good*/}
        {/*</button>*/}
      </div>
      <Slider store={store} />
    </div>
  );
});

export default BackgroundPlayer;
