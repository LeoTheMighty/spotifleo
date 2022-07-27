import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import { useStore } from '../state/SpotifyStoreProvider';
import { getParams } from '../logic/common';
import { DeepDiverViewType } from '../types';
import DeepDiveViewer from './DeepDiveViewer';
import DeepDiveCreator from './DeepDiveCreator';
import DeepDiveDriver from './DeepDiveDriver';
import LoadingIndicator from '../common/LoadingIndicator';
import { useLocation } from 'react-router-dom';

/*

Load in all of the details and then switch on the playlist details.

From the params you get the playlist ID. Then you have three options.

1. It is a playlist that has not been started yet (if there is no disco playlist).

 */

const DeepDiver = observer(() => {
  const store = useStore();
  const params = getParams();
  const location = useLocation();

  useEffect(() => {
    if (params.playlist_id && ['edit-deep-dive', 'deep-dive', 'view-deep-dive', undefined].includes(params.view)) {
      store.fetchCurrentDeepDiverPlaylist(params.playlist_id, params.view as DeepDiverViewType | undefined).then(() => {
        console.log('Fully fetched the details');
      }).catch((error) => {
        console.error(error);
      });
    } else {
      console.error('No playlist provided');
    }
  }, [location]);

  const getPage = (): React.ReactNode => {
    const { currentDeepDiveView } = store;
    if (currentDeepDiveView === 'edit-deep-dive') {
      return (<DeepDiveCreator />)
    } else if (currentDeepDiveView === 'deep-dive') {
      return (<DeepDiveDriver />)
    } else if (currentDeepDiveView === 'view-deep-dive') {
      return (<DeepDiveViewer />)
    } else {
      return <></>
    }
  };

  return (
    <>
      { getPage() }
    </>
  )
});

export default DeepDiver;
