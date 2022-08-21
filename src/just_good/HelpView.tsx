import React from 'react';
import { ModalBody, ModalHeader } from 'react-bootstrap';
import { HelpViewType } from '../types';
import { newTab } from '../logic/common';

type Props = {
  view: HelpViewType;
};

const HelpView = ({ view }: Props) => {
  switch (view) {
    case 'usage':
      return (
        <>
          <ModalHeader closeButton> <h1> How to Use </h1> </ModalHeader>
          <ModalBody>
            <div className="d-flex flex-column justify-content-center m-2">
              <h2 className="text-center my-2"> First play on any external device </h2>
              <p className="text-center my-2">
                To play using the deep diver, first play a song on the device you want to listen from,
                then go back to this page and refresh the player with
                the <i className="d-inline bi bi-arrow-clockwise" /> icon if it hasn't already refreshed.
              </p>
              <i className="text-center my-2">
                This app does not actually play by itself, it uses the Spotify API in order to control the
                playback on your external devices
              </i>
            </div>
          </ModalBody>
        </>
      );
    case 'not-in-progress':
      return (
        <>
          <ModalHeader closeButton> <h1> Locked Playlist </h1> </ModalHeader>
          <ModalBody>
            <div className="d-flex flex-column justify-content-center m-2">
              <p className="text-center my-2">
                Mark the playlist as "In Progress" before you can update it.
              </p>
            </div>
          </ModalBody>
          { /* TODO: Make some ModalActions that do it in the modal itself? :oooo */ }
        </>
      );
    case 'not-in-beta':
      return (
        <>
          <ModalHeader closeButton> <h1> Not in the Beta Trial </h1> </ModalHeader>
          <ModalBody>
            <div className="d-flex flex-column justify-content-center m-2">
              <i className="text-center">
                The Spotify App rules dictate that I need to specify everyone who wants to
                use my app specifically so just text me (Leo) or email me
                at <a href="mailto:leonid@ac93.org" {...newTab}>leonid@ac93.org</a> to request access.
              </i>
            </div>
          </ModalBody>
          { /* TODO: Make some ModalActions that do it in the modal itself? :oooo */ }
        </>
      );
    case 'welcome':
      return (
        <>
          <ModalHeader closeButton> <h1> Welcome to the Spotify-driven Deep Diver </h1> </ModalHeader>
          <ModalBody>
            <div className="d-flex flex-column justify-content-center m-2">
              <i className="text-center">
                The Spotify App rules dictate that I need to specify everyone who wants to
                use my app specifically so just text me (Leo) or email me
                at <a href="mailto:leonid@ac93.org" {...newTab}>leonid@ac93.org</a> to request access.
              </i>
            </div>
          </ModalBody>
          { /* TODO: Make some ModalActions that do it in the modal itself? :oooo */ }
        </>
      );
    default:
      return <> Oopsy leo forgot to do write this help screen ({ view }) </>;
  }
};

export default HelpView;
