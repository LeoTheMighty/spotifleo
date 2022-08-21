import React, { useState } from 'react';
import { ModalBody, ModalFooter, ModalHeader } from 'react-bootstrap';
import { HelpViewType } from '../types';
import { newTab } from '../logic/common';
import { useStore } from '../state/SpotifyStoreProvider';

type Props = {
  view: HelpViewType;
};

const HelpView = ({ view }: Props) => {
  const store = useStore();
  const [step, setStep] = useState(0);

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
      if (step === 0) {
        return (
          <>
            <ModalHeader closeButton> <h1 className="d-flex justify-content-center text-center"> Welcome to the Spotify-driven Deep Diver </h1> </ModalHeader>
            <ModalBody>
              <div className="d-flex flex-column justify-content-center m-2">
                <p className="text-bigger text-center my-2">
                  Welcome to my app that's designed to make discovering new music from your favorite artists
                  fun and easy.
                </p>
                <p className="text-bigger text-center my-2">
                  If you've ever thought to yourself
                </p>
                <i className="m-4">
                  "hey this artist is pretty good, I kinda want to do a
                  deep dive on them to see what other songs they've got that
                  I'd like"
                </i>
                <p className="text-bigger text-center my-2">
                  then this is the app for you.
                </p>
                <i className="text-bigger text-center my-2">
                  Additionally, if you want to want to have a playlist that only has the songs by the artist
                  that you like, this also can do that.
                </i>
                <b className="text-bigger text-center my-2">
                  Let's start off with a welcome flow to show you how to do this!
                </b>
              </div>
            </ModalBody>
            <ModalFooter>
              <button className="secondary-btn" onClick={() => store.skipWelcome()}> Skip </button>
              <button className="primary-btn" onClick={() => setStep(1)}> Let's go! </button>
            </ModalFooter>
            { /* TODO: Make some ModalActions that do it in the modal itself? :oooo */ }
          </>
        );
      } else {
        return (
          <>
            <ModalHeader closeButton> <h1 className="d-flex justify-content-center text-center"> Welcome </h1> </ModalHeader>
            <ModalBody>
              <div className="d-flex flex-column justify-content-center m-2">
                First wait for the app to finish loading in your information.
              </div>
              <div className="d-flex flex-column justify-content-center m-2">
                Then use the Search bar above to create a planned Just Good Playlist
                for you to choose on an artist to deep dive!
              </div>
            </ModalBody>
          </>
        );
      }

    case 'welcome-creator':
      return (
        <>
          <ModalHeader closeButton> <h1 className="d-flex justify-content-center text-center"> Welcome </h1> </ModalHeader>
          <ModalBody>
            <div className="d-flex flex-column justify-content-center m-2 text-center">
              This is the Deep Dive Creator Section, it allows you to sort your deep
              dive in whatever way you want. Then, you can create the playlist so
              that it is added to your Spotify library and you can start diving into
              the artist!
            </div>
            <div className="d-flex flex-column justify-content-center m-2 text-center">
              Once you've sorted and filtered the playlist as you see fit, click on the
              "Start the Deep Dive" button.
            </div>
          </ModalBody>
        </>
      );
    case 'welcome-driver':
      return (
        <>
          <ModalHeader closeButton> <h1 className="d-flex justify-content-center text-center"> Welcome </h1> </ModalHeader>
          <ModalBody>
            <div className="d-flex flex-column justify-content-center m-2">
              This is the main view for deep diving your chosen artist.
            </div>
            <div className="d-flex flex-column justify-content-center m-2">
              You can use the Thumbs Up button in order to indicate that
              it's one of the songs that you like from the artist.
            </div>
            <div className="d-flex flex-column justify-content-center m-2">
              You can also configure your personal playlists to let yourself toggle the
              deep dive song inside of that playlist. I always load your liked songs library
              as one of these playlists, but you can add any of yours that you want!
            </div>
            <div className="d-flex flex-column justify-content-center m-2">
              Once you are content with your deep dive, you will click on the "Mark
              Playlist Complete" button. For now, just click it to see what the next
              page will look like (we will mark it in progress again later).
            </div>
          </ModalBody>
        </>
      );
    case 'welcome-viewer':
      return (
        <>
          <ModalHeader closeButton> <h1 className="d-flex justify-content-center text-center"> Welcome </h1> </ModalHeader>
          <ModalBody>
            <div className="d-flex flex-column justify-content-center m-2">
              This is where you can view your finished or in progress just good playlist.
              It shows the full view of your just good playlist and if the playlist is in Progress,
              you can continue updating the playlist in this view as well.
            </div>
            <div className="d-flex flex-column justify-content-center m-2">
              When you are ready to start the deep dive again, click Mark in Progress and you
              can go back to diving into this artist.
            </div>
            <div className="d-flex flex-column justify-content-center m-2">
              When you're ready to deep dive another artist simply click on the back
              button to return to the deep dive dashboard.
            </div>
            <div className="d-flex flex-column justify-content-center m-2">
              I hope you enjoy my app and godspeed!
            </div>
          </ModalBody>
        </>
      );
    default:
      return <> Oopsy leo forgot to do write this help screen ({ view }) </>;
  }
};

export default HelpView;
