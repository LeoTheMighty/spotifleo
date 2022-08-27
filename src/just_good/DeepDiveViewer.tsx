import React, { useEffect, useState } from 'react';
import ListViewer from './ListViewer';
import { useStore } from '../state/SpotifyStoreProvider';
import Image from '../components/Image';
import { useNavigate } from 'react-router-dom';
import {
  albumGroupString, artistString,
  driveDeepDiver,
  editDeepDiver,
  formatMs,
  getPlaylistUrl,
  newTab,
  viewDeepDiver
} from '../logic/common';
import { observer } from 'mobx-react';
import { Album, FetchedAlbum, Track } from '../types';
import { SpotifyStore } from '../state/SpotifyStore';
import AlbumViewer from './AlbumViewer';

const DeepDiveViewer = observer(() => {
  const store = useStore();
  const navigate = useNavigate();

  const [viewDiscography, setViewDiscography] = useState(true);

  useEffect(() => {
    if (store.welcomeStep === 4 && store.progress === undefined) {
      store.setHelpView('welcome-viewer');
      store.welcomeStep = undefined;
    }
  }, [store, store.welcomeStep, store.progress]);

  return (
    <div className="deep-dive-viewer">
      <div className="d-flex flex-column w-100">
        <div className="d-flex flex-row justify-content-between mx-2 mt-2">
          <button className="primary-btn" onClick={() => store.currentJustGoodPlaylist?.id && navigate(editDeepDiver(store.currentJustGoodPlaylist.id))}>
            Edit Dive
          </button>
          <button className="primary-btn" onClick={() => store.currentJustGoodPlaylist?.id && navigate(driveDeepDiver(store.currentJustGoodPlaylist.id))}>
            Dive {store.currentJustGoodPlaylist?.inProgress ? '' : 'Back '} in
          </button>
        </div>
        <button className={`primary-btn toggle mx-2 my-3 ${store.currentJustGoodPlaylist?.inProgress ? 'off' : 'on'}`} onClick={async () => {
          await store.toggleJustGoodPlaylistComplete();
          if (store.currentJustGoodPlaylist?.id) navigate(viewDeepDiver(store.currentJustGoodPlaylist.id));
        }}>
          { store.currentJustGoodPlaylist?.inProgress ? (
            <> <i className="d-inline bi bi-lock"/> Mark Complete </>
          ) : (
            <> <i className="d-inline bi bi-unlock-fill" /> Mark in Progress </>
          )}
        </button>
      </div>
      <div className="d-flex flex-row justify-content-evenly w-100">
        <div/>
        <h1 className="text-center"><a className="text-decoration-none" href={(store.currentJustGoodPlaylist?.id) ?
          getPlaylistUrl(store.currentJustGoodPlaylist.id) :
          'https://open.spotify.com'
        } {...newTab}>
          Just Good { store.currentJustGoodPlaylist?.artistName }
        </a></h1>
        <button className="m-0 p-0 mb-2" onClick={() => navigator.clipboard.writeText(store.currentDeepDiveExternalURL || '')}>
          <i className="bi bi-box-arrow-up-right bi-small text-1" />
        </button>
      </div>
      <button
        className={`m-4 primary-btn toggle ${viewDiscography ? 'on' : 'off'}`}
        onClick={() => setViewDiscography(v => !v) }
      >
        Show{viewDiscography ? 'ing' : ''} Whole Deep Dive
      </button>
      {store.currentDeepDiveArtistDiscographyOrdered?.map((album) => {
        return (
          <AlbumViewer
            album={album}
            navigateToDrive={() => (store.currentJustGoodPlaylist?.id && navigate(driveDeepDiver(store.currentJustGoodPlaylist.id)))}
            viewNotGood={viewDiscography}
            store={store}
          />
        );
      })}
    </div>
  );
});

export default DeepDiveViewer;
