import React from 'react';
import { useStore } from '../state/SpotifyStoreProvider';
import { ModalBody, ModalHeader, ModalTitle } from 'react-bootstrap';

type Props = {
  hide: () => void;
}

const Settings = ({ hide }: Props) => {
  const store = useStore();

  return (
    <>
      <ModalHeader closeButton> <ModalTitle> Settings </ModalTitle> </ModalHeader>
      <ModalBody>
        <div className="d-flex justify-content-center m-2">
          <button className="reset-user-button primary-btn" onClick={() => { store.resetUser(); hide(); }}>
            Re-setup user
          </button>
        </div>
        <div className="d-flex justify-content-center m-2">
          <button className="reset-user-button primary-btn" onClick={() => { store.deauthorize(); hide(); }}>
            Sign Out
          </button>
        </div>
        <div className="d-flex justify-content-center m-2">
          <button className="reset-user-button primary-btn" onClick={() => { store.welcomeStep = 0; store.helpView = 'welcome'; hide(); }}>
            Start Welcome Flow
          </button>
        </div>
        <div className="d-flex justify-content-center m-2">
          <button className="reset-user-button primary-btn" onClick={() => { store.backfill() }}>
            Backfill Playlists
          </button>
        </div>
      </ModalBody>
    </>
  );
};

export default Settings;
