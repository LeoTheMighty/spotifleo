import React from 'react';
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from 'react-bootstrap';

type Props = {
  show: boolean;
  title?: string;
  message?: string;
  onConfirm: () => void;
  onDecline: () => void;
};

const ConfirmModal = ({ show, title = 'Are you sure?', message = 'This will have consequences.', onConfirm, onDecline }: Props) => {
  return (
    <Modal show={show} onHide={onDecline}>
      <ModalHeader> <ModalTitle> { title } </ModalTitle></ModalHeader>
      <ModalBody>
        <div className="d-flex justify-content-center">
          { message }
        </div>
      </ModalBody>
      <ModalFooter>
        <button className="primary-btn" onClick={onConfirm}>
          yes
        </button>
        <button className="primary-btn secondary-btn" onClick={onDecline}>
          no
        </button>
      </ModalFooter>
    </Modal>
  );
};

export default ConfirmModal;
