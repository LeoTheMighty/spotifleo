import React from 'react';
import { useStore } from '../state/SpotifyStoreProvider';

const UserProfile = () => {
  const store = useStore();

  return (
    <div>
      { store.userImg && <img className="background-player-album" src={store.userImg.small} alt="test" /> }
      <p> { store.userName } </p>
    </div>
  );
};

export default UserProfile;
