import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import { useStore } from '../state/SpotifyStoreProvider';
import { getParams } from '../logic/common';

/*

Load in all of the details and then switch on the playlist details.

From the params you get the playlist ID. Then you have three options.

1. It is a playlist that has not been started yet (if there is no disco playlist).

 */

const DeepDiver = observer(() => {
  const store = useStore();
  const params = getParams();

  useEffect(() => {
    if (params.playlist_id) {
      console.log('Lmao');
      console.log(params.playlist_id);
    } else {
      console.error('No playlist provided');
    }
  }, [params.playlist_id]);

  return (
    <div className="deep-diver">

    </div>
  );
});

export default DeepDiver;
