import React, { useState } from 'react';
import ArtistSearch from './ArtistSearch';
import { useNavigate, useParams } from 'react-router-dom';
import { Modal, ModalHeader } from 'react-bootstrap';
import Settings from './Settings';
import { useStore } from '../state/SpotifyStoreProvider';
import LoadingBar from '../components/LoadingBar';
import Image from '../components/Image';
import LoadingIndicator from '../common/LoadingIndicator';
import { observer } from 'mobx-react';

const TopBar = observer(() => {
  const store = useStore();
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="top-bar">
      {store.token && (
        <div className="top-bar-container">
          { store.progress ? (
            <button className="top-bar-button">
              <LoadingIndicator className="top-bar-icon" />
            </button>
          ) : (
            <button className="top-bar-button" onClick={() => navigate('/spotifleo')}>
              <i className="bi bi-house top-bar-icon" />
            </button>
          )}
          <ArtistSearch />
          <button className="top-bar-button" onClick={() => setShowSettings(true)}>
            { store.userImg ? (
              <Image className="top-bar-icon" src={store.userImg} large />
            ) : (
              <i className="bi bi-gear top-bar-icon" />
            )}
          </button>
          <Modal show={showSettings} onHide={() => setShowSettings(false)}>
            <Settings hide={() => setShowSettings(false)} />
          </Modal>
        </div>
      )}
      <div className="loading-container">
        <LoadingBar />
      </div>
    </div>
  );
});

export default TopBar;
