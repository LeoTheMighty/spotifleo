import React, { useEffect } from 'react';
import Slider from 'react-slider';
import { formatMs } from '../logic/common';
import { observer } from 'mobx-react';
import { SpotifyStore } from '../state/SpotifyStore';

type Props = {
  store: SpotifyStore;
}

const SpotifySlider = observer(({ store }: Props) => {

  return (
    <div className="spotify-slider">
      { formatMs(store.currentTrack?.progress) }
      <Slider
        onAfterChange={store.seekToPosition}
        min={0}
        max={store.currentTrack?.duration}
        value={store.currentTrack?.progress}
      />
      { formatMs(store.currentTrack?.duration) }
    </div>
  );
});

export default SpotifySlider;
