import React, { useState } from 'react';
import { useStore } from '../state/SpotifyStoreProvider';
import { observer } from 'mobx-react';
import AlbumViewer from './AlbumViewer';
import { driveDeepDiver, getPlaylistUrl, newTab } from '../logic/common';
import { useNavigate } from 'react-router-dom';

const ExternalDeepDiveViewer = observer(() => {
  const store = useStore();
  const navigate = useNavigate();

  const [viewDiscography, setViewDiscography] = useState(true);

  return (
    <div className="deep-dive-viewer external">
      <h1 className="text-center"><a className="text-decoration-none" href={(store.currentJustGoodPlaylist?.id) ?
        getPlaylistUrl(store.currentJustGoodPlaylist.id) :
        'https://open.spotify.com'
      } {...newTab}>
        { store.currentExternalPlaylistOwnerName }'s Just Good { store.currentJustGoodPlaylist?.artistName } Playlist
      </a></h1>
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

export default ExternalDeepDiveViewer;
