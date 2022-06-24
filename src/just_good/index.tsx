import React from 'react';
import DeepDiver from './DeepDiver';
import BackgroundPlayer from './BackgroundPlayer';

/*



 */

const TEST_PLAYLIST_ID = '';

type Props = {
  token: string;
};

const Dashboard = ({ token }: Props) => {
  // let's use mobx state here

  return (
    <div className="dashboard">
      <DeepDiver playlistID={TEST_PLAYLIST_ID} />
      <BackgroundPlayer />
    </div>
  );
};

export default Dashboard;
