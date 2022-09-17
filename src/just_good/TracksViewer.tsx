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
  action?: 'toggleJustGood' | 'toggleLike' | 'toggleDeepDive';
};

const TracksViewer = observer(({ showAlbum, store, tracks, viewNotGood, action }: Props) => (
  <>
    {tracks.map((track, index) => {
      const isGood = store.currentJustGoodPlaylist?.trackIds?.has(track.id) || false;
      const isNotGood = store.currentJustGoodPlaylist?.notGoodIds === undefined ? !isGood : store.currentJustGoodPlaylist.notGoodIds.has(track.id);

      const disabled = (): boolean => {
        switch (action) {
          case 'toggleJustGood':
            return isNotGood;
          case 'toggleLike':
            return store.likedTrackSet?.has(track.id) || false;
          case 'toggleDeepDive':
            const trackExcluded = (store.currentArtistDeepDiveExcludedTrackIds?.has(track.id)) || false;
            const albumIncluded = (track.albumId && store.currentArtistDeepDiveAlbumIds?.has(track.albumId)) || false;
            return (trackExcluded || !albumIncluded) || false;
        }

        return false;
      };

      const getAction = (): React.ReactNode => {
        switch (action) {
          case 'toggleJustGood':
            return (
              <button className="deep-dive-track-view-add-button m-0 p-0" onClick={() => store.toggleTrackInJustGood(track)}>
                {isGood ? <i className="bi bi-hand-thumbs-up-fill"/> : <i className="bi bi-hand-thumbs-up"/>}
              </button>
            );
          case 'toggleLike':
            return (
              <button className="deep-dive-track-view-add-button m-0 p-1 mt-1" onClick={() => store.likedPlaylist && store.toggleCurrentTrackInPlaylist(store.likedPlaylist)}>
                {(store.likedTrackSet?.has(track.id) || false) ? <i className="bi bi-heart-fill"/> : <i className="bi bi-heart"/>}
              </button>
            );
          case 'toggleDeepDive':
            const trackExcluded = (store.currentArtistDeepDiveExcludedTrackIds?.has(track.id)) || false;
            const albumIncluded = (track.albumId && store.currentArtistDeepDiveAlbumIds?.has(track.albumId)) || false;
            return (
              <button className="deep-dive-track-view-add-button m-0 p-1 mt-1" onClick={() => store.toggleTrackForDeepDive(track)}>
                {(trackExcluded || !albumIncluded) ? <i className="bi bi-plus"/> : <i className="bi bi-dash-circle"/>}
              </button>
            );
        }

        return <></>;
      };

      return (
        <TrackViewer
          track={track}
          index={index}
          isPlaying={store.playing && (store.currentTrack?.id === track.id)}
          isGood={isGood}
          isNotGood={isNotGood}
          viewNotGood={viewNotGood}
          showAlbum={showAlbum}
          onClick={async () => {
            await store.playTrackInDeepDivePlaylist(track);
          }}
          disabled={disabled()}
          action={getAction()}
        />
      );
    })}
  </>
));

export default TracksViewer;
