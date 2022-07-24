import React, { useEffect } from 'react';
import Slider from './SpotifySlider';
import { observer } from 'mobx-react';
import ToggleButton from '../components/ToggleButton';
import defaultAvatar from '../images/default_avatar.jpeg';
import { useStore } from '../state/SpotifyStoreProvider';
import { useNavigate } from 'react-router-dom';
import { deepDiver, driveDeepDiver } from '../logic/common';

const SHOULD_PRETEND = true;

const BackgroundPlayer = observer(() => {
  const navigate = useNavigate();
  const store = useStore();

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

      if (store.currentTrackProgress && store.currentTrackDuration && (store.currentTrackProgress >= store.currentTrackDuration)) {
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
        <div className="background-player-action-panel-left">
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
        </div>
        <div className="d-flex background-player-remote"> {/* This needs to stay in the middle */}
          <button className="prev-button p-0" onClick={store.skipPrevious}>
            <i className="bi bi-skip-start-fill" />
          </button>
          <button className="play-button p-1" onClick={store.togglePlaying}>
            { store.playing ? (
              <i className="bi bi-pause-circle-fill" />
            ) : (
              <i className="bi bi-play-circle-fill" />
            )}
          </button>
          <button className="next-button p-0" onClick={store.skipNext}>
            <i className="bi bi-skip-end-fill" />
          </button>
        </div>
        {/*<div className="background-player-spacer" />*/}
        <div className="background-player-action-panel-right">
          <button onClick={() => store.likedPlaylist && store.toggleCurrentTrackInPlaylist(store.likedPlaylist) }>
            { store.currentTrackID && store.likedTrackSet?.has(store.currentTrackID) ? (
              <i className="bi bi-heart-fill" />
            ) : (
              <i className="bi bi-heart" />
            )}
          </button>
          {(store.currentPlayingJustGoodPlaylist && store.currentJustGoodPlaylist && store.currentJustGoodPlaylist.trackIds !== undefined && (store.currentPlayingJustGoodPlaylist?.id === store.currentJustGoodPlaylist?.id)) ? (
            <button onClick={() => store.toggleCurrentTrackInJustGood()}>
              {(store.currentTrackID && store.currentJustGoodPlaylist?.trackIds?.has(store.currentTrackID)) ? (
                <i className="bi bi-hand-thumbs-up-fill" />
              ) : (
                <i className="bi bi-hand-thumbs-up" />
              )}
            </button>
          ) : (
            (store.currentPlayingJustGoodPlaylist === undefined) ? ( // jesus. nested ternaries ;/
              <button onClick={() => alert('TODO: pull up modal to choose which artist to add if multiple')}>
                <i className="bi bi-person-plus position-relative" >
                  <i className="bi bi-hand-thumbs-up floated-corner-icon"/>
                </i>
              </button>
            ) : (
              <button onClick={() => navigate(deepDiver(store.currentPlayingJustGoodPlaylist!.id))}>
                <i className="bi bi-eye position-relative">
                  <i className="bi bi-hand-thumbs-up floated-corner-icon"/>
                </i>
              </button>
            )
          )}
          {/*<div className="background-player-good-button-container">*/}
          {/*  <button className="primary-btn"> Good </button>*/}
            {/*<ToggleButton*/}
            {/*  className="background-player-good-button"*/}
            {/*  on="Good"*/}
            {/*  off="Eh."*/}
            {/*/>*/}
          {/*</div>*/}
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
