import React from 'react';

const HelpView = () => {
  return (
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
  );
};

export default HelpView;
