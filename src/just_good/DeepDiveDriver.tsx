import React, { useEffect, useState } from 'react';
import { Track } from '../types';
import { observer } from 'mobx-react';
import { useStore } from '../state/SpotifyStoreProvider';
import { Modal, ModalBody, ModalHeader, ModalTitle, ProgressBar } from 'react-bootstrap';
import {
  arrayGetWrap,
  editDeepDiver,
  getPlaylistUrl, newTab,
  viewDeepDiver,
  wrapIndex
} from '../logic/common';
import Image from '../components/Image';
import ConfigureDeepDivePlaylists from './ConfigureDeepDivePlaylists';
import { useNavigate } from 'react-router-dom';
import LoadingIndicator from '../common/LoadingIndicator';
import { toJS } from 'mobx';
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
// TODO: ADD MORE ACTIONS LIKE GO TO 1/3 in and/or 2/3 in if you in a rush

const DeepDiveDriver = observer(() => {
  const store = useStore();
  const navigate = useNavigate();
  const [configurePlaylistsOpen, setConfigurePlaylistsOpen] = useState(false);
  const [moreInfoOpen, setMoreInfoOpen] = useState(false);

  const [skipNext, setSkipNext] = useState(false);
  const [skipPrev, setSkipPrev] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);

  useSwipe({
    onLeft: () => store.skipPrevious(),
    onRight: () => store.skipNext(),
  })

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
        } else if (progress === nextWrapIndex) {
          setSkipNext(true);
          setTimeout(() => setSkipNext(false), 1000);
        }
      }
    }
  }, [store.currentJustGoodPlaylist?.progress]);

  if (store.currentJustGoodPlaylist === undefined || store.currentJustGoodPlaylist.progress === undefined || store.currentJustGoodPlaylist.deepDiveTracks === undefined || store.currentJustGoodPlaylist.trackIds === undefined) {
    return <LoadingIndicator />;
  }
  const deepDiveTrack = store.currentJustGoodPlaylist.deepDiveTracks[trackIndex];
  if (!deepDiveTrack) {
    return <LoadingIndicator />;
  }

  // console.log(toJS(store.currentJustGoodPlaylist.trackIds));

  const prevPrevTrackImg = arrayGetWrap(store.currentJustGoodPlaylist.deepDiveTracks, trackIndex - 2).img;
  const prevTrackImg = arrayGetWrap(store.currentJustGoodPlaylist.deepDiveTracks, trackIndex - 1).img;
  const nextTrackImg = arrayGetWrap(store.currentJustGoodPlaylist.deepDiveTracks, trackIndex + 1).img;
  const nextNextTrackImg = arrayGetWrap(store.currentJustGoodPlaylist.deepDiveTracks, trackIndex + 2).img;
  const isGood = deepDiveTrack?.id && store.currentJustGoodPlaylist.trackIds.has(deepDiveTrack.id)

  return (
    <div className="deep-dive-driver">
      <div className="d-flex flex-column w-100">
        <div className="d-flex justify-content-between mx-2 mt-2">
          {/*<a href={`https://open.spotify.com/playlist/${store.currentJustGoodPlaylist.id}`} className="secondary-btn m-2"> {'<'} View Playlist in Spotify </a>*/}
          <button className="primary-btn" onClick={() => store.currentJustGoodPlaylist?.id && navigate(viewDeepDiver(store.currentJustGoodPlaylist.id))}>
            View Playlist
          </button>
          <button className="primary-btn" onClick={() => store.currentJustGoodPlaylist?.id && navigate(editDeepDiver(store.currentJustGoodPlaylist.id))}>
            Edit Dive
          </button>
        </div>
        {(store.currentJustGoodPlaylist.inProgress) ? (
          <button className="primary-btn mx-2 my-3" onClick={async () => {
            await store.markJustGoodPlaylistComplete();
            if (store.currentJustGoodPlaylist?.id) navigate(viewDeepDiver(store.currentJustGoodPlaylist.id));
          }}> Mark Complete </button>
        ) : (
          <button className="primary-btn mx-2 my-3" onClick={async () => {
            await store.markJustGoodPlaylistComplete();
            if (store.currentJustGoodPlaylist?.id) navigate(viewDeepDiver(store.currentJustGoodPlaylist.id));
          }}> Mark in Progress </button>
        )}
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
            onClick={() => store.skipPrevious()}
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
            onClick={() => store.skipNext()}
          />
          <Image
            className="deep-dive-driver-img"
            src={nextNextTrackImg}
            alt="alt"
            large
          />
        </div>
        { (store.currentTrack?.playing && store.currentTrack.id === deepDiveTrack.id) ? (
          <i className="deep-dive-driver-track-play-icon bi-pause" />
        ) : (
          <i className="deep-dive-driver-track-play-icon bi-play" />
        )}
        <i className="deep-dive-driver-track-prev-icon bi-caret-left-fill" />
        <i className="deep-dive-driver-track-next-icon bi-caret-right-fill" />
      </div>
      <div className="deep-dive-driver-track-info">
        <button className="p-0 m-0" onClick={() => store.likedPlaylist && store.toggleTrackInDeepDiverPlaylist(deepDiveTrack, store.likedPlaylist) }>
          { deepDiveTrack.id && store.likedTrackSet?.has(deepDiveTrack.id) ? (
            <i className="bi bi-heart-fill" />
          ) : (
            <i className="bi bi-heart" />
          )}
        </button>
        <div className="d-flex justify-content-between flex-column text-start mx-3">
          <h4> { deepDiveTrack.name } </h4>
          <i className="bi-small"> { deepDiveTrack.albumName } </i>
        </div>
        <button className="p-0 m-0" onClick={() => store.toggleCurrentTrackInJustGood()}>
          {(deepDiveTrack && store.currentJustGoodPlaylist?.trackIds?.has(deepDiveTrack.id)) ? (
            <i className="bi bi-hand-thumbs-up-fill" />
          ) : (
            <i className="bi bi-hand-thumbs-up position-relative">
              <i className="bi bi-plus floated-corner-icon" />
            </i>
          )}
        </button>
      </div>
      <button className="secondary-btn m-0 p-0" onClick={() => setMoreInfoOpen(o => !o)}>
        {moreInfoOpen ? 'Less info' : 'More info'}
      </button>
      <div className="deep-dive-driver-actions">
        {/*<button*/}
        {/*  className={`w-100 primary-btn playlist-button ${store.currentJustGoodPlaylist.trackIds.has(deepDiveTrack.id) ? 'on' : 'off'}`}*/}
        {/*  onClick={() => store.toggleCurrentTrackInJustGood()}*/}
        {/*>*/}
        {/*  <h1 className="m-2 p-0 d-flex flex-row justify-content-center w-100">Good {isGood ? <i className="m-1 bi bi-hand-thumbs-up" /> : <i className="m-1 bi bi-hand-thumbs-down" />}</h1>*/}
        {/*</button>*/}
        <div className="deep-dive-driver-playlists">
          {store.deepDiverPlaylistIndexes && Array.from(store.deepDiverPlaylistIndexes).map(([id, i]) => {
            const playlist = store.userPlaylists?.[store.deepDiverPlaylistIndexes?.get(id) || 0];
            const trackSet: Set<string> | undefined = playlist && store.deepDiverPlaylistTrackSets?.get(playlist.id);
            return playlist && i !== 0 ? (
              <button
                className={`primary-btn playlist-button m-1 ${store.currentTrack?.id && trackSet?.has(store.currentTrack.id) ? 'on' : 'off'}`}
                onClick={() => store.toggleCurrentTrackInPlaylist(playlist) }
              >
                { playlist?.name }
              </button>
            ) : undefined;
          })}
        </div>
        <button className="secondary-btn" onClick={() => setConfigurePlaylistsOpen(true)}>
          Add/Remove Additional Playlists
        </button>
        <Modal show={configurePlaylistsOpen} onHide={() => setConfigurePlaylistsOpen(false)}>
          <ModalHeader closeButton><ModalTitle><h1>Add/Remove Playlist</h1></ModalTitle></ModalHeader>
          <ModalBody><ConfigureDeepDivePlaylists hide={() => setConfigurePlaylistsOpen(false)}/></ModalBody>
        </Modal>
      </div>
      {/*<div className="song-scroller">*/}
      {/*  { getSongs()?.map((song, i) => (*/}
      {/*    <IconView item={song} i={i} />*/}
      {/*  )) || 'not initialized correctly'}*/}
      {/*</div>*/}
      {/*<div>*/}
      {/*  <button className="primary-btn" onClick={store.updatePlayer}>*/}
      {/*    Update Player*/}
      {/*  </button>*/}
      {/*</div>*/}
    </div>
  );
});

export default DeepDiveDriver;
