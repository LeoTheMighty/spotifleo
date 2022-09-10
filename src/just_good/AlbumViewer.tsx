import { FetchedAlbum } from '../types';
import React  from 'react';
import { albumGroupString } from '../logic/common';
import { observer } from 'mobx-react';
import { SpotifyStore } from '../state/SpotifyStore';
import Image from '../components/Image';
import TracksViewer from './TracksViewer';

type AlbumViewerProps = {
  album: FetchedAlbum;
  navigateToDrive?: () => void;
  viewNotGood: boolean;
  store: SpotifyStore;
};

const AlbumViewer = observer(({ album, navigateToDrive, viewNotGood, store }: AlbumViewerProps) => {
  if (!store.currentArtistDeepDiveAlbumIds?.has(album.id)) {
    return null;
  }
  if (!viewNotGood && album.tracks.findIndex(t => store.currentJustGoodPlaylist?.trackIds?.has(t.id)) === -1) {
    return null;
  }

  return (
    <div className="deep-dive-album-view">
      <div className="d-flex flex-row my-1">
        <Image className="deep-dive-album-view-img" src={album.img} alt={album.name} large/>
        <div className="d-flex flex-column overflow-hidden">
          <h1><b> {album.name} </b></h1>
          <i> {albumGroupString(album.albumGroup)} · {album.releaseDate.getFullYear()} · {album.tracks.length} song{album.tracks.length !== 1 ? 's' : ''}</i>
        </div>
      </div>
      <TracksViewer showAlbum={false} store={store} tracks={album.tracks} viewNotGood={viewNotGood} />
    </div>
  );
});

export default AlbumViewer;
