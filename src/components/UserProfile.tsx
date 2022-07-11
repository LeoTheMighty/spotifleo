import React from 'react';
import { useStore } from '../state/SpotifyStoreProvider';
import Image from './Image';

const UserProfile = () => {
  const store = useStore();

  return (
    <div>
      { store.userImg && <Image className="background-player-album" src={store.userImg} alt="test" /> }
      <p> { store.userName } </p>
    </div>
  );
};

export default UserProfile;
