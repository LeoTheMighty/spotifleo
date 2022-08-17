import React, { useEffect } from 'react';
import Slider from './SpotifySlider';
import { observer } from 'mobx-react';
import { useStore } from '../state/SpotifyStoreProvider';
import { useNavigate } from 'react-router-dom';
import { artistString, deepDiver, driveDeepDiver } from '../logic/common';
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
    // console.log('update player');
    store.updatePlayer();
    if (store.currentTrack?.playing && SHOULD_PRETEND) {
      setTimeout(pretendSeekCallback, 1000);
    }
  }, [store, store.currentTrack?.playing]);

  const pretendSeekCallback = async () => { // TODO a lot of times we get into a double loop of this. fix
    if (store.currentTrack?.playing && SHOULD_PRETEND) {
      await store.pretendToProceedPosition();

      if (store.currentTrack?.progress !== undefined && store.currentTrack.duration !== undefined && (store.currentTrack.progress >= store.currentTrack.duration)) {
        await store.updatePlayer();
      }

      setTimeout(pretendSeekCallback, 1000);
    }
  }

  const clickAlbum = () => {
    if (!store.currentTrack) {
      store.updatePlayer();
    } else if (store.currentPlayingJustGoodPlaylist) {
      if (store.currentPlayingJustGoodPlaylist.id !== store.currentJustGoodPlaylist?.id) {
        navigate(deepDiver(store.currentPlayingJustGoodPlaylist.id));
      } else {
        navigate(driveDeepDiver(store.currentPlayingJustGoodPlaylist.id));
      }
    } else {
    //   navigate(deepDiver(store.currentPlayingJustGoodPlaylist.id));
      // alert('TODO: Pop up screen to look up or add artist to just good? :)')
    }
  };

  return (
    <div className="background-player">
      <div>
        { /* TODO: Component to drag upwards? */ }
      </div>
      <div className="background-player-action-panel">
        <div className="background-player-action-panel-left">
          <button className="background-player-album-button" onClick={clickAlbum}>
            {(store.currentTrack?.img) ? (
              <>
                <Image className="background-player-album" src={store.currentTrack.img} alt={store.currentTrack.name} />
                {/*{(store.currentPlayingJustGoodPlaylist && (store.currentPlayingJustGoodPlaylist.id !== store.currentJustGoodPlaylist?.id)) ? (*/}
                {/*  <i className="bi bi-box-arrow-up-right background-player-album-just-good-link">*/}
                {/*    <i className="bi bi-hand-thumbs-up background-player-album-just-good-thumb" />*/}
                {/*  </i>*/}
                {/*) : (*/}
                {/*  <i className="bi bi-plus-circle background-player-album-just-good-link">*/}
                {/*    <i className="bi bi-hand-thumbs-up background-player-album-just-good-thumb" />*/}
                {/*  </i>*/}
                {/*)}*/}
              </>
            ) : (
              <i className="bi bi-arrow-clockwise bi-small" />
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
                { store.currentTrack && artistString(store.currentTrack.artists) }
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
              <button className="px-1 m-0" onClick={() => store.likedPlaylist && store.toggleCurrentTrackInPlaylist(store.likedPlaylist) }>
                { store.currentTrack?.id && store.likedTrackSet?.has(store.currentTrack?.id) ? (
                  <i className="bi bi-heart-fill" />
                ) : (
                  <i className="bi bi-heart" />
                )}
              </button>
            )
          )}
        </div>
      </div>
      <Slider store={store} />
    </div>
  );
});

export default BackgroundPlayer;
