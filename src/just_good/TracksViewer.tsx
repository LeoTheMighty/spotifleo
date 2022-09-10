import React from 'react';
import TrackViewer from './TrackViewer';
import { Track } from '../types';
import { SpotifyStore } from '../state/SpotifyStore';
import { observer } from 'mobx-react';

type Props = {
  showAlbum: boolean;
  store: SpotifyStore;
  tracks: Track[];
  viewNotGood: boolean;
};

const TracksViewer = observer(({ showAlbum, store, tracks, viewNotGood }: Props): JSX.Element => (
  <>
    {tracks.map((track, index) => {
      const isGood = store.currentJustGoodPlaylist?.trackIds?.has(track.id) || false;
      const isNotGood = store.currentJustGoodPlaylist?.notGoodIds === undefined ? !isGood : store.currentJustGoodPlaylist.notGoodIds.has(track.id);

      return (
        <TrackViewer
          track={track}
          index={index}
          isPlaying={store.playing && (store.currentTrack?.id === track.id)}
          isGood={isGood}
          isLiked={store.likedTrackSet?.has(track.id) || false}
          isNotGood={isNotGood}
          viewNotGood={viewNotGood}
          showAlbum={showAlbum}
          onClick={async () => {
            await store.playTrackInDeepDivePlaylist(track);
          }}
          onToggleAdd={() => store.toggleTrackInJustGood(track)}
          onToggleLike={() => store.likedPlaylist && store.toggleCurrentTrackInPlaylist(store.likedPlaylist)}
        />
      );
    })}
  </>
));

export default TracksViewer;
