import React from 'react';
import { useStore } from '../state/SpotifyStoreProvider';
import ToggleAlbum from './ToggleAlbum';
import DefaultAvatar from '../images/default_avatar.jpeg';
import { observer } from 'mobx-react';
import { Album, AlbumGroup } from '../types';
import { ToggleButton } from 'react-bootstrap';

/*

Handles the on-boarding process. First you load all of the albums for the artist. Then allow the user
to both toggle them on and off as well as drag and drop them around each other.

Give sort options for chronological, split singles/eps and albums, and filter options for albums, singles, and eps.
*/

const DeepDiveCreator = observer(() => {
  const store = useStore();

  const toggleAlbum = (album: Album) => {
    store.toggleAlbumForDeepDive(album.id);
  };

  const getGroupOfToggleAlbums = (type: AlbumGroup) => (
    <div className="d-flex justify-content-center flex-wrap w-100">
      {store.currentDeepDiveArtistDiscography?.filter(a => a.albumGroup === type).map((album) => (
        <ToggleAlbum
          value={!!store.currentArtistDeepDiveAlbumIds?.has(album.id)}
          album={album}
          onClick={() => { toggleAlbum(album); }}
        />
      ))}
    </div>
  );

  return (
    <div className="text-center d-flex flex-column">
      <button className="btn btn-outline-primary"> Start the Deep Dive </button>
      <button><h1>Albums:</h1></button>
      { getGroupOfToggleAlbums('album')}
      <button><h1>EPs/Singles:</h1></button>
      { getGroupOfToggleAlbums('single')}
      <button><h1>Appears On:</h1></button>
      { getGroupOfToggleAlbums('appears_on')}
      {/*<div className="d-flex justify-content-center flex-wrap w-100">*/}
      {/*  {store.currentDeepDiveArtistDiscography?.filter(a => a.albumGroup === 'album').map((album) => (*/}
      {/*    <ToggleAlbum*/}
      {/*      value={!!store.currentArtistDeepDiveAlbumIds?.has(album.id)}*/}
      {/*      album={album}*/}
      {/*      onClick={() => { toggleAlbum(album); }}*/}
      {/*    />*/}
      {/*  ))}*/}
      {/*</div>*/}
    </div>
  );
});

export default DeepDiveCreator;
