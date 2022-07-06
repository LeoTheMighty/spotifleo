import React from 'react';
import { useStore } from '../state/SpotifyStoreProvider';
import { ModalBody, ModalHeader, ModalTitle } from 'react-bootstrap';

const Settings = () => {
  const store = useStore();

  return (
    <>
      <ModalHeader closeButton> <ModalTitle> Settings </ModalTitle> </ModalHeader>
      <ModalBody>
        <div className="d-flex justify-content-center">
          <button className="reset-user-button" onClick={() => store.resetUser()}>
            Re-setup user
          </button>
        </div>
      </ModalBody>
    </>
  );
};

export default Settings;
