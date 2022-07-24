import React, { useState } from 'react';
import ArtistSearch from './ArtistSearch';
import { useNavigate } from 'react-router-dom';
import { Modal, ModalHeader } from 'react-bootstrap';
import Settings from './Settings';
import { useStore } from '../state/SpotifyStoreProvider';

const TopBar = () => {
  const store = useStore();
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="top-bar">
      {store.token && (
        <>
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
        </>
      )}
    </div>
  );
};

export default TopBar;
