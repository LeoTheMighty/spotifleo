import React, { useEffect, useState } from 'react';
import { useStore } from '../state/SpotifyStoreProvider';
import { observer } from 'mobx-react';
import { ProgressBar } from 'react-bootstrap';

const LoadingBar = observer(() => {
  const store = useStore();
  const [lastValue, setLastValue] = useState(0);

  useEffect(() => {
    if (store.progress?.progress) {
      setLastValue(store.progress.progress);
    } else {
      setTimeout(() => setLastValue(0), 1000);
    }
  }, [store.progress?.progress]);

  return (
    <ProgressBar
      min={0.0}
      max={1.0}
      now={store.progress?.progress || lastValue}
      defaultValue={0}
      className={`loading-bar ${store.progress ? '' : 'opacity-0'}`}
      animated
      striped
    />
  );
});

export default LoadingBar;
