import React, { useEffect } from 'react';
import Slider from './SpotifySlider';
import { observer } from 'mobx-react';
import { useStore } from '../state/SpotifyStoreProvider';
import { useNavigate } from 'react-router-dom';
import { deepDiver, driveDeepDiver } from '../logic/common';
import Image from '../components/Image';

const SHOULD_PRETEND = true;

/**
 *
 * [Right-hand Action]
 *  - if in a just good
 * [Click on Album]
 *  - if not
 */
const BackgroundPlayer = observer(() => {
  const navigate = useNavigate();
  const store = useStore();

  useEffect(() => {
    console.log('update player');
    store.updatePlayer();
    if (store.currentTrack?.playing && SHOULD_PRETEND) {
      setTimeout(pretendSeekCallback, 1000);
    }
  }, [store, store.currentTrack?.playing]);

  const pretendSeekCallback = async () => { // TODO a lot of times we get into a double loop of this. fix
    if (store.currentTrack?.playing && SHOULD_PRETEND) {
      await store.pretendToProceedPosition();

      if (store.currentTrack?.progress && store.currentTrack.duration && (store.currentTrack.progress >= store.currentTrack.duration)) {
        await store.updatePlayer();
      }

      setTimeout(pretendSeekCallback, 1000);
    }
  }

  const clickAlbum = () => {
    if (!store.currentTrack) {
      store.updatePlayer();
    } else if (store.currentPlayingJustGoodPlaylist && (store.currentPlayingJustGoodPlaylist.id !== store.currentJustGoodPlaylist?.id)) {
      navigate(deepDiver(store.currentPlayingJustGoodPlaylist.id));
    } else {
      alert('TODO: Pop up screen to look up or add artist to just good? :)')
    }
  };

  return ( // if you drag, then it goes back?
    <div className="background-player">
      { /* Component to drag upwards */ }
      <div>

      </div>
      <div className="background-player-action-panel">
        <div className="background-player-action-panel-left">
          <button className="background-player-album-button" onClick={clickAlbum}>
            {(store.currentTrack?.img) ? (
              <Image className="background-player-album" src={store.currentTrack.img} alt={store.currentTrack.name} />
            ) : (
              <i className="bi bi-arrow-clockwise bi-small" />
            )}
            { store.currentPlayingJustGoodPlaylist && (store.currentPlayingJustGoodPlaylist.id !== store.currentJustGoodPlaylist?.id) && (
              <i className="bi bi-box-arrow-up-right background-player-album-just-good-link">
                <i className="bi bi-hand-thumbs-up background-player-album-just-good-thumb" />
              </i>
            )}
          </button>
          <div className="background-player-description">
            <div className="h-100 m-1 d-flex align-items-start wrap overflow-hidden">
              <b>
                { store.currentTrack?.name }
              </b>
            </div>
            <div className="h-100 m-1 d-flex align-items-start wrap overflow-hidden">
              <p>
                { store.currentTrack?.artistName }
              </p>
            </div>
          </div>
        </div>
        <div className="d-flex background-player-remote"> {/* This needs to stay in the middle */}
          <button className="prev-button p-0" onClick={store.skipPrevious}>
            <i className="bi bi-skip-start-fill" />
          </button>
          <button className="play-button p-1" onClick={store.togglePlaying}>
            { store.currentTrack?.playing ? (
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
          { store.currentTrack && (
            store.currentPlayingJustGoodPlaylist && store.currentPlayingJustGoodPlaylist.trackIds ? (
              <button className="px-1" onClick={() => store.toggleCurrentTrackInPlayingJustGood()}>
                {(store.currentTrack?.id && store.currentPlayingJustGoodPlaylist?.trackIds?.has(store.currentTrack.id)) ? (
                  <i className="bi bi-hand-thumbs-up-fill" />
                ) : (
                  <i className="bi bi-hand-thumbs-up" />
                )}
              </button>
            ) : (
              <button className="p-0 m-0" onClick={() => store.likedPlaylist && store.toggleCurrentTrackInPlaylist(store.likedPlaylist) }>
                { store.currentTrack?.id && store.likedTrackSet?.has(store.currentTrack?.id) ? (
                  <i className="bi bi-heart-fill" />
                ) : (
                  <i className="bi bi-heart" />
                )}
              </button>
            )
          )}
          {/*<button className="p-0 m-0" onClick={() => store.likedPlaylist && store.toggleCurrentTrackInPlaylist(store.likedPlaylist) }>*/}
          {/*  { store.currentTrack?.id && store.likedTrackSet?.has(store.currentTrack?.id) ? (*/}
          {/*    <i className="bi bi-heart-fill" />*/}
          {/*  ) : (*/}
          {/*    <i className="bi bi-heart" />*/}
          {/*  )}*/}
          {/*</button>*/}
          {/*{(store.currentPlayingJustGoodPlaylist && store.currentJustGoodPlaylist && store.currentJustGoodPlaylist.trackIds !== undefined && (store.currentPlayingJustGoodPlaylist?.id === store.currentJustGoodPlaylist?.id)) ? (*/}
          {/*  <button className="px-1" onClick={() => store.toggleCurrentTrackInJustGood()}>*/}
          {/*    {(store.currentTrack?.id && store.currentJustGoodPlaylist?.trackIds?.has(store.currentTrack.id)) ? (*/}
          {/*      <i className="bi bi-hand-thumbs-up-fill" />*/}
          {/*    ) : (*/}
          {/*      <i className="bi bi-hand-thumbs-up" />*/}
          {/*    )}*/}
          {/*  </button>*/}
          {/*) : (*/}
          {/*  (store.currentPlayingJustGoodPlaylist === undefined) ? ( // jesus. nested ternaries ;/*/}
          {/*    <button className="px-1" onClick={() => alert('TODO: pull up modal to choose which artist to add if multiple')}>*/}
          {/*      <i className="bi bi-person-plus position-relative" >*/}
          {/*        <i className="bi bi-hand-thumbs-up floated-corner-icon"/>*/}
          {/*      </i>*/}
          {/*    </button>*/}
          {/*  ) : (*/}
          {/*    <button className="px-1" onClick={() => navigate(deepDiver(store.currentPlayingJustGoodPlaylist!.id))}>*/}
          {/*      <i className="bi bi-eye position-relative">*/}
          {/*        <i className="bi bi-hand-thumbs-up floated-corner-icon"/>*/}
          {/*      </i>*/}
          {/*    </button>*/}
          {/*  )*/}
          {/*)}*/}
        </div>
      </div>
      <Slider store={store} />
    </div>
  );
});

export default BackgroundPlayer;
