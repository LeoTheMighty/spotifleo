import React, { useState } from 'react';
import ArtistSearch from './ArtistSearch';
import { useNavigate, useParams } from 'react-router-dom';
import { Modal, ModalHeader } from 'react-bootstrap';
import Settings from './Settings';
import { useStore } from '../state/SpotifyStoreProvider';
import LoadingBar from '../components/LoadingBar';

const TopBar = () => {
  const store = useStore();
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="top-bar">
      {store.token && (
        <div className="d-flex justify-content-between align-items-center h-100">
          <button onClick={() => navigate('/spotifleo')}>
            <i className="bi bi-caret-left top-bar-icon" />
          </button>
          <ArtistSearch />
          <button onClick={() => setShowSettings(true)}>
            <i className="bi bi-gear top-bar-icon" />
          </button>
          <Modal show={showSettings} onHide={() => setShowSettings(false)}>
            <Settings />
          </Modal>
        </div>
      )}
      <div className="loading-container">
        <LoadingBar />
      </div>
    </div>
  );
};

export default TopBar;
