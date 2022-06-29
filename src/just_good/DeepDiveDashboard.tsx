import React from 'react';
import DeepDiver from './DeepDiver';
import BackgroundPlayer from './BackgroundPlayer';
import ArtistSearch from './ArtistSearch';

const TEST_PLAYLIST_ID = '';

const Dashboard = () => {
  // let's use mobx state here

  return (
    <div className="dashboard">
      <div className="top-bar d-flex justify-content-center align-items-center sticky-top">
        <ArtistSearch />
      </div>
      <DeepDiver playlistID={TEST_PLAYLIST_ID} />
      <BackgroundPlayer />
    </div>
  );
};

export default Dashboard;
