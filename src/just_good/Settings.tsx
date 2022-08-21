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
        <div className="d-flex justify-content-center">
          <button className="reset-user-button primary-btn" onClick={() => { store.resetUser(); hide(); }}>
            Re-setup user
          </button>
        </div>
        <div className="d-flex justify-content-center">
          <button className="reset-user-button primary-btn" onClick={() => { store.deauthorize(); hide(); }}>
            Sign Out
          </button>
        </div>
      </ModalBody>
    </>
  );
};

export default Settings;
