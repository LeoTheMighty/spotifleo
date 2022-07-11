import React, { useState } from 'react';
import { useStore } from '../state/SpotifyStoreProvider';
import ToggleAlbum from './ToggleAlbum';
import DefaultAvatar from '../images/default_avatar.jpeg';
import { observer } from 'mobx-react';
import { Album, AlbumGroup } from '../types';
import { ToggleButton } from 'react-bootstrap';
import ConfirmModal from '../components/ConfirmModal';

/*

Handles the on-boarding process. First you load all of the albums for the artist. Then allow the user
to both toggle them on and off as well as drag and drop them around each other.

Give sort options for chronological, split singles/eps and albums, and filter options for albums, singles, and eps.
*/

const DeepDiveCreator = observer(() => {
  const store = useStore();
  const [showConfirm, setShowConfirm] = useState(false);

  const toggleAlbum = (album: Album) => {
    store.toggleAlbumForDeepDive(album.id);
  };

  const getGroupOfToggleAlbums = (albums: Album[] | undefined) => (
    <div className="d-flex justify-content-center flex-wrap w-100">
      {albums?.map((album) => (
        <ToggleAlbum
          value={!!store.currentArtistDeepDiveAlbumIds?.has(album.id)}
          album={album}
          onClick={() => { toggleAlbum(album); }}
        />
      )) || 'haha no bitches'}
    </div>
  );

  // album will always be first
  const s = store.currentDeepDiveArtistDiscography?.findIndex((a) => a.albumGroup === 'single');
  const a = store.currentDeepDiveArtistDiscography?.findIndex((a) => a.albumGroup === 'appears_on');
  const albums = store.currentDeepDiveArtistDiscography?.slice(0, s);
  const singles = store.currentDeepDiveArtistDiscography?.slice(s, a);
  const appears = store.currentDeepDiveArtistDiscography?.slice(a);

  const hasAlbumGroup = (albumGroup: AlbumGroup) => {
    let group: Album[] | undefined = undefined;
    if (albumGroup === 'album') {
      group = albums;
    } else if (albumGroup === 'single') {
      group = singles;
    } else if (albumGroup === 'appears_on') {
      group = appears;
    }

    if (group) {
      for (let i = 0; i < (group ? group.length : 0); i++) {
        if (store.currentArtistDeepDiveAlbumIds?.has(group[i].id)) {
          return true;
        }
      }
    }
    return false;
  };

  return (
    <div className="d-flex flex-column align-items-center">
      <button className="primary-btn" onClick={() => setShowConfirm(true)}> Start the Deep Dive </button>
      <button className="primary-btn secondary-btn m-2" onClick={() => store.toggleAlbumGroupForDeepDive('album')}>
        <h1 style={{ textDecoration: hasAlbumGroup('album') ? '' : 'line-through'}}>
          Albums:
        </h1>
      </button>
      { getGroupOfToggleAlbums(albums)}
      <button className="primary-btn secondary-btn m-2" onClick={() => store.toggleAlbumGroupForDeepDive('single')}>
        <h1 style={{ textDecoration: hasAlbumGroup('single') ? '' : 'line-through'}}>
          EPs/Singles:
        </h1>
      </button>
      { getGroupOfToggleAlbums(singles)}
      <button className="primary-btn secondary-btn m-2" onClick={() => store.toggleAlbumGroupForDeepDive('appears_on')}>
        <h1 style={{ textDecoration: hasAlbumGroup('appears_on') ? '' : 'line-through'}}>
          Appears On:
        </h1>
      </button>
      { getGroupOfToggleAlbums(appears)}
      {/*<div className="d-flex justify-content-center flex-wrap w-100">*/}
      {/*  {store.currentDeepDiveArtistDiscography?.filter(a => a.albumGroup === 'album').map((album) => (*/}
      {/*    <ToggleAlbum*/}
      {/*      value={!!store.currentArtistDeepDiveAlbumIds?.has(album.id)}*/}
      {/*      album={album}*/}
      {/*      onClick={() => { toggleAlbum(album); }}*/}
      {/*    />*/}
      {/*  ))}*/}
      {/*</div>*/}
      <ConfirmModal
        show={showConfirm}
        title="Ready to Start the Deep Dive?"
        message="This will create a new playlist in your spotify with all of this artists songs you chose."
        onConfirm={() => { store.createDeepDivePlaylist(); setShowConfirm(false) }}
        onDecline={() => setShowConfirm(false)}
      />
    </div>
  );
});

export default DeepDiveCreator;
