import React, { useEffect, useState } from 'react';
import { useStore } from '../state/SpotifyStoreProvider';
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
import TracksViewer from './TracksViewer';

const DeepDiveViewer = observer(() => {
  const store = useStore();
  const navigate = useNavigate();

  const [viewDiscography, setViewDiscography] = useState(true);
  const [viewType, setViewType] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (store.currentJustGoodPlaylist?.deepDivePlaylist?.deepDiveContent) {
      setViewType(store.currentJustGoodPlaylist.deepDivePlaylist.deepDiveContent.sortType);
    }
  }, [store, store.currentJustGoodPlaylist?.deepDivePlaylist?.deepDiveContent.sortType]);

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
            Dive {store.currentJustGoodPlaylist?.justGoodContent.inProgress ? '' : 'Back '} in
          </button>
        </div>
        <button className={`primary-btn toggle mx-2 my-3 ${store.currentJustGoodPlaylist?.justGoodContent.inProgress ? 'off' : 'on'}`} onClick={async () => {
          await store.toggleJustGoodPlaylistComplete();
          if (store.currentJustGoodPlaylist?.id) navigate(viewDeepDiver(store.currentJustGoodPlaylist.id));
        }}>
          { store.currentJustGoodPlaylist?.justGoodContent.inProgress ? (
            <> <i className="d-inline bi bi-lock"/> Mark Complete </>
          ) : (
            <> <i className="d-inline bi bi-unlock-fill" /> Mark in Progress </>
          )}
        </button>
      </div>
      <div className="d-flex flex-row justify-content-evenly w-100">
        <h1 className="text-center"><a className="text-decoration-none" href={(store.currentJustGoodPlaylist?.id) ?
          getPlaylistUrl(store.currentJustGoodPlaylist.id) :
          'https://open.spotify.com'
        } {...newTab}>
          Just Good { store.currentJustGoodPlaylist?.artistName }
        </a></h1>
      </div>
      {/*<button*/}
      {/*  className={`m-4 primary-btn toggle ${viewDiscography ? 'on' : 'off'}`}*/}
      {/*  onClick={() => setViewDiscography(v => !v) }*/}
      {/*>*/}
      {/*  Show{viewDiscography ? 'ing' : ''} Whole Deep Dive*/}
      {/*</button>*/}
      <div className="d-flex flex-row justify-content-between w-100">
        <div className="d-flex justify-content-start align-items-center my-2">
          <button className="m-0 p-0 mx-2" onClick={() => {
            if (navigator.canShare?.(store.currentDeepDiveExternalShareData)) {
              navigator.share?.(store.currentDeepDiveExternalShareData);
            } else {
              navigator.clipboard.writeText(store.currentDeepDiveExternalURL || '');
              setCopied(false);
              setTimeout(() => setCopied(true), 100);
              setTimeout(() => setCopied(false), 5000);
            }
          }}>
            <i className="bi bi-box-arrow-up bi-small text-1" />
          </button>
          <i className={`m-0 p-0 text-lighter text-small text-green fade opacity-${copied ? '100' : '0'}`}>
            URL copied to your clipboard!
          </i>
        </div>
        <div className="d-flex justify-content-end my-2">
          {store.currentJustGoodPlaylist?.deepDivePlaylist?.deepDiveContent.sortType === 0 && (
            <button className="p-0 mx-1" onClick={() => setViewType(t => t === 0 ? 1 : 0)}>
              <i className={`bi bi-small bi-${viewType === 1 ? 'music-note-list' : 'disc-fill'}`} />
            </button>
          )}
          <button className="p-0 mx-1" onClick={() => setViewDiscography(v => !v)}>
            <i className={`bi bi-small bi-funnel${viewDiscography ? '' : '-fill'}`} />
          </button>
        </div>
      </div>
      {viewType === 1 ? (
        store.currentDeepDiveArtistDiscographyTracksOrdered && (
          <TracksViewer
            showAlbum={true}
            store={store}
            tracks={store.currentDeepDiveArtistDiscographyTracksOrdered}
            viewNotGood={viewDiscography}
            action="toggleJustGood"
          />
        )
      ) : (
        store.currentDeepDiveArtistDiscographyOrdered?.map((album) => {
          return (
            <AlbumViewer
              album={album}
              navigateToDrive={() => (store.currentJustGoodPlaylist?.id && navigate(driveDeepDiver(store.currentJustGoodPlaylist.id)))}
              viewNotGood={viewDiscography}
              store={store}
              action="toggleJustGood"
            />
          );
        })
      )}
    </div>
  );
});

export default DeepDiveViewer;
