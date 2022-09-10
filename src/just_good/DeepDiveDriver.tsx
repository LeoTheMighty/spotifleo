import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import { useStore } from '../state/SpotifyStoreProvider';
import { Modal, ModalBody, ModalHeader, ModalTitle } from 'react-bootstrap';
import {
  arrayGetWrap, artistString,
  editDeepDiver, featuredArtists,
  getPlaylistUrl, newTab,
  viewDeepDiver,
  wrapIndex
} from '../logic/common';
import Image from '../components/Image';
import ConfigureDeepDivePlaylists from './ConfigureDeepDivePlaylists';
import { useNavigate } from 'react-router-dom';
import LoadingIndicator from '../common/LoadingIndicator';
import useSwipe from '../components/SwipeHook';

/*

Back button "<"                                 "View Playlist in Spotify"


-------|          |-----------------------|           |---------
       |          \                       |           |
       |          \                       |           |
       |          \                       |           |
  <    |          \                       |           |    >
       |          \                       |           |
       |          \                       |           |
-------|          |-----------------------|           |----------

                         Good? (adds to Just Good)

 */

// Prepare 5 components.
// TODO: ADD MORE INFO FOR THE ALBUM (MAYBE HAVE A BUTTON TO OPEN EXTRA INFO)

const DeepDiveDriver = observer(() => {
  const store = useStore();
  const navigate = useNavigate();
  const [configurePlaylistsOpen, setConfigurePlaylistsOpen] = useState(false);
  const [moreInfoOpen, setMoreInfoOpen] = useState(false);
  const [experimentalOpen, setExperimentalOpen] = useState(false);

  const [skipNext, setSkipNext] = useState(false);
  const [skipPrev, setSkipPrev] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);

  const [showPauseButton, setShowPauseButton] = useState(true);
  const [likeButtonAnimate, setLikeButtonAnimate] = useState(false);

  useSwipe({
    onLeft: () => store.skipPrevious(),
    onRight: () => store.skipNext(),
  })

  useEffect(() => {
    if (store.welcomeStep === 3 && store.progress === undefined) {
      store.setHelpView('welcome-driver');
      store.welcomeStep = 4;
    }
  }, [store, store.welcomeStep, store.progress]);

  useEffect(() => {
    if (store.currentJustGoodPlaylist) {
      const { deepDiveTracks, progress } = store.currentJustGoodPlaylist;
      if (progress !== undefined && deepDiveTracks) {
        setTrackIndex(progress);
        const prevWrapIndex = wrapIndex(trackIndex - 1, deepDiveTracks.length);
        const nextWrapIndex = wrapIndex(trackIndex + 1, deepDiveTracks.length);
        if (progress === prevWrapIndex) {
          setSkipPrev(true);
          setTimeout(() => setSkipPrev(false), 1000);
          setShowPauseButton(true);
        } else if (progress === nextWrapIndex) {
          setSkipNext(true);
          setTimeout(() => setSkipNext(false), 1000);
        }
      }
    }
  }, [store.currentJustGoodPlaylist?.progress]);

  useEffect(() => {
    const deepDiveTrack = store.currentJustGoodPlaylist?.deepDiveTracks?.[trackIndex];
    if (store.currentTrack?.playing && deepDiveTrack && store.currentTrack.id === deepDiveTrack.id) {
      setShowPauseButton(true);
      setTimeout(() => setShowPauseButton(false), 3000);
    }
  }, [store.currentJustGoodPlaylist?.deepDiveTracks, store.currentTrack?.playing]);

  if (store.currentJustGoodPlaylist === undefined || store.currentJustGoodPlaylist.progress === undefined || store.currentJustGoodPlaylist.deepDiveTracks === undefined || store.currentJustGoodPlaylist.trackIds === undefined) {
    return <LoadingIndicator />;
  }
  const deepDiveTrack = store.currentJustGoodPlaylist.deepDiveTracks[trackIndex];
  const isLiked = store.currentJustGoodPlaylist?.trackIds?.has(deepDiveTrack.id);
  useEffect(() => {
    if (isLiked) {
      setLikeButtonAnimate(true);
      setTimeout(() => setLikeButtonAnimate(false), 700);
    }
  }, [isLiked]);
  if (!deepDiveTrack) {
    return <LoadingIndicator />;
  }

  const prevPrevTrackImg = arrayGetWrap(store.currentJustGoodPlaylist.deepDiveTracks, trackIndex - 2)?.img;
  const prevTrackImg = arrayGetWrap(store.currentJustGoodPlaylist.deepDiveTracks, trackIndex - 1)?.img;
  const nextTrackImg = arrayGetWrap(store.currentJustGoodPlaylist.deepDiveTracks, trackIndex + 1)?.img;
  const nextNextTrackImg = arrayGetWrap(store.currentJustGoodPlaylist.deepDiveTracks, trackIndex + 2)?.img;

  return (
    <div className="deep-dive-driver">
      <div className="d-flex flex-column w-100">
        <div className="d-flex justify-content-between mx-2 mt-2">
          <button className="primary-btn" onClick={() => store.currentJustGoodPlaylist?.id && navigate(viewDeepDiver(store.currentJustGoodPlaylist.id))}>
            View Playlist
          </button>
          <button className="primary-btn" onClick={() => store.currentJustGoodPlaylist?.id && navigate(editDeepDiver(store.currentJustGoodPlaylist.id))}>
            Edit Dive
          </button>
        </div>
        <button className={`primary-btn toggle mx-2 my-3 ${store.currentJustGoodPlaylist.justGoodContent.inProgress ? 'off' : 'on'}`} onClick={async () => {
          await store.toggleJustGoodPlaylistComplete();
          if (store.currentJustGoodPlaylist?.id) navigate(viewDeepDiver(store.currentJustGoodPlaylist.id));
        }}>
          { store.currentJustGoodPlaylist.justGoodContent.inProgress ? (
            <> <i className="d-inline bi bi-lock"/> Mark Complete </>
          ) : (
            <> <i className="d-inline bi bi-unlock-fill" /> Mark in Progress </>
          )}
        </button>
      </div>
      <h1 className="text-center"><a className="text-decoration-none" href={(store.currentJustGoodPlaylist?.id) ?
        getPlaylistUrl(store.currentJustGoodPlaylist.id) :
        'https://open.spotify.com'
      } {...newTab}>
        { store.currentJustGoodPlaylist?.artistName } Deep Dive
      </a></h1>
      <div className="deep-dive-driver-track-scroller">
        <div className={`deep-dive-driver-image-container ${skipNext ? 'skip-next' : (skipPrev ? 'skip-prev' : '')}`}>
          <Image
            className="deep-dive-driver-img"
            src={prevPrevTrackImg}
            alt="alt"
            large
          />
          <Image
            className="deep-dive-driver-img"
            src={prevTrackImg}
            alt="alt"
            large
            onClick={() => store.prevDeepDiveTrack()}
          />
          <Image
            className="deep-dive-driver-img"
            src={deepDiveTrack.img}
            alt="alt"
            large
            onClick={() => store.playCurrentDeepDivePlaylistTrack()}
          />
          <Image
            className="deep-dive-driver-img"
            src={nextTrackImg}
            alt="alt"
            large
            onClick={() => store.nextDeepDiveTrack()}
          />
          <Image
            className="deep-dive-driver-img"
            src={nextNextTrackImg}
            alt="alt"
            large
          />
        </div>
        { (store.currentTrack?.playing && store.currentTrack.id === deepDiveTrack.id) ? (
          <i className={`deep-dive-driver-track-play-icon bi-pause ${showPauseButton ? '' : 'transparent'}`} />
        ) : (
          <i className="deep-dive-driver-track-play-icon bi-play" />
        )}
        <i className="deep-dive-driver-track-prev-icon bi-caret-left-fill" />
        <i className="deep-dive-driver-track-next-icon bi-caret-right-fill" />
      </div>
      {(store.currentTrack?.id === deepDiveTrack.id) && (
        <div className="d-flex flex-row w-100 justify-content-between my-1">
          <button className="primary-btn text-smaller px-2 py-0 m-2" onClick={() => store.seekToPosition(0)}>
            0 / 3
          </button>
          <button className="primary-btn text-smaller px-2 py-0 m-2" onClick={() => store.seekToPosition((store.currentTrack?.duration || 0) / 3)}>
            1 / 3
          </button>
          <button className="primary-btn text-smaller px-2 py-0 m-2" onClick={() => store.seekToPosition(2 * (store.currentTrack?.duration || 0) / 3)}>
            2 / 3
          </button>
        </div>
      )}
      <div className="deep-dive-driver-track-info">
        <div className="d-flex justify-content-between flex-column text-start mx-3 rest-space">
          <div className="d-flex flex-row justify-content-between">
            <h1> { deepDiveTrack.name } </h1>
          </div>
          <i className="text-bigger"> { deepDiveTrack.albumName } </i>
        </div>
        <button className={`m-0 p-0 bi-big bubbly-button ${likeButtonAnimate ? 'animate' : ''}`} onClick={() => store.toggleCurrentTrackInJustGood()}>
          <i className={`bi bi-hand-thumbs-up${isLiked ? '-fill' : ''} position-relative`} />
        </button>
        {/*<button className="p-0 m-0 bi-big" onClick={() => store.toggleCurrentTrackInJustGood()}>*/}
        {/*  {(deepDiveTrack && store.currentJustGoodPlaylist?.trackIds?.has(deepDiveTrack.id)) ? (*/}
        {/*    <i className="bi bi-hand-thumbs-up-fill" />*/}
        {/*  ) : (*/}
        {/*    <i className="bi bi-hand-thumbs-up position-relative">*/}
        {/*      <i className="bi bi-plus floated-corner-icon" />*/}
        {/*    </i>*/}
        {/*  )}*/}
        {/*</button>*/}
      </div>
      <button className="m-0 p-0" onClick={() => setMoreInfoOpen(o => !o)}>
        <i className="secondary-btn text-lighter">
          {moreInfoOpen ? 'Less info' : 'More info'}
        </i>
      </button>
      {moreInfoOpen && (
        <table>
          {
            [
              ['Song Name', deepDiveTrack.name],
              ['Album Name', deepDiveTrack.albumName],
              [`Album Artist${deepDiveTrack.albumArtists.length === 1 ? '' : 's'}`, artistString(deepDiveTrack.albumArtists)],
              ['Features', artistString(featuredArtists(deepDiveTrack))],
              ['Popularity', deepDiveTrack.popularity],
              ['Explicit', deepDiveTrack.explicit ? 'Yes' : undefined],
            ].map(([info, value]) => value ? (
              <tr><td><i>{info}</i></td><td className="d-flex justify-content-center text-center">{value}</td></tr>
            ) : undefined)
          }
        </table>
      )}
      <div className="deep-dive-driver-actions">
        <div className="d-flex flex-row justify-content-between">
          <i className="text-regular"> Toggle track in playlists: </i>
        </div>
        <div className="deep-dive-driver-playlists">
          {store.deepDiverPlaylistIndexes && Array.from(store.deepDiverPlaylistIndexes).map(([id, i]) => {
            const playlist = store.userPlaylists?.[store.deepDiverPlaylistIndexes?.get(id) || 0];
            const trackSet: Set<string> | undefined = playlist && store.deepDiverPlaylistTrackSets?.get(playlist.id);
            return playlist && (i !== 0 ? (
              <button
                className={`primary-btn playlist-button m-1 ${trackSet?.has(deepDiveTrack.id) ? 'on' : 'off'}`}
                onClick={() => store.toggleTrackInDeepDiverPlaylist(deepDiveTrack, playlist) }
              >
                { playlist?.name }
              </button>
            ) : (
              <button
                className={`d-flex align-items-center text-center primary-btn playlist-button px-2 m-1 ${trackSet?.has(deepDiveTrack.id) ? 'on' : 'off'}`}
                onClick={() => store.toggleTrackInDeepDiverPlaylist(deepDiveTrack, playlist) }
              >
                Liked <i className={`mx-1 p-0 bi bi-heart${trackSet?.has(deepDiveTrack.id) ? '-fill' : ''}`} />
              </button>
            ));
          })}
        </div>
        <button className="my-4 p-0" onClick={() => setConfigurePlaylistsOpen(true)}>
          <i className="secondary-btn text-regular"> Add/Remove Additional Playlists </i>
        </button>
        <button className="m-0 p-0" onClick={() => setExperimentalOpen(o => !o)}>
          <i className="secondary-btn text-lighter">
            {experimentalOpen ? 'Hide Experimental Features' : 'See Experimental Features'}
          </i>
        </button>
        {experimentalOpen && (
          <div className="d-flex flex-row justify-content-around w-100 my-2">
            <button className="m-2 p-0" onClick={() => store.toggleShuffle()}>
              <i className={`bi bi-shuffle bi-big ${store.currentTrack?.shuffle ? 'text-1' : 'disabled'}`}/>
            </button>
            <button className="m-2 p-0" onClick={() => store.toggleRepeat()}>
              <i className={`bi bi-repeat${store.currentTrack?.repeat === 'track' ? '-1' : ''} bi-big ${store.currentTrack?.repeat !== 'off' ? 'text-1' : 'disabled'}`}/>
            </button>
            <button className="m-2 p-0" onClick={() => store.toggleTrackNotGood(deepDiveTrack.id)}>
              <i className={`bi bi-dash-circle bi-big ${store.currentJustGoodPlaylist?.notGoodIds?.has(deepDiveTrack.id) ? 'text-1' : 'disabled'}`} />
            </button>
          </div>
          )}
        <Modal show={configurePlaylistsOpen} onHide={() => setConfigurePlaylistsOpen(false)}>
          <ModalHeader closeButton><ModalTitle><h1>Add/Remove Playlist</h1></ModalTitle></ModalHeader>
          <ModalBody><ConfigureDeepDivePlaylists hide={() => setConfigurePlaylistsOpen(false)}/></ModalBody>
        </Modal>
      </div>
    </div>
  );
});

export default DeepDiveDriver;
