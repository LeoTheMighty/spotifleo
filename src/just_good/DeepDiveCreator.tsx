import React, { useEffect, useState } from 'react';
import { useStore } from '../state/SpotifyStoreProvider';
import ToggleAlbum from './ToggleAlbum';
import { observer } from 'mobx-react';
import { Album, AlbumGroup, FetchedAlbum } from '../types';
import ConfirmModal from '../components/ConfirmModal';
import { driveDeepDiver, viewDeepDiver } from '../logic/common';
import { useNavigate } from 'react-router-dom';

/*

Handles the on-boarding process. First you load all of the albums for the artist. Then allow the user
to both toggle them on and off as well as drag and drop them around each other.

Give sort options for chronological, split singles/eps and albums, and filter options for albums, singles, and eps.

TODO: IF YOU'RE CURRENTLY LISTENING TO THE PLAYLIST THIS COULD GET WEIRD
*/

const compareAlbumsAlpha = (a: Album, b: Album) => a.name.localeCompare(b.name);
const compareAlbumsAlphaReverse = (a: Album, b: Album) => b.name.localeCompare(a.name);
const compareAlbumsChrono = (a: Album, b: Album) => a.releaseDate.getTime() - b.releaseDate.getTime();
const compareAlbumsChronoReverse = (a: Album, b: Album) => b.releaseDate.getTime() - a.releaseDate.getTime();

const DeepDiveCreator = observer(() => {
  const store = useStore();
  const navigate = useNavigate();
  const [grouped, setGrouped] = useState(true);
  const [sortAlpha, setSortAlpha] = useState(false);
  const [sortChrono, setSortChrono] = useState(true);
  const [sortAlphaForward, setSortAlphaForward] = useState(true);
  const [sortChronoForward, setSortChronoForward] = useState(true);
  const [customOrder, setCustomOrder] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (store.currentJustGoodPlaylist?.deepDivePlaylist) {
      setCanUndo(false);
      setCustomOrder(true);
      setGrouped(false);
      setSortAlpha(false);
      setSortChrono(false);

      // TODO: Try to guess/Figure out what order it's in?
      // const order = store.currentDeepDiveArtistDiscographyOrdered;
    }
  }, [store.currentJustGoodPlaylist, store.currentDeepDiveArtistDiscographyOrdered]);

  useEffect(() => {
    if (store.welcomeStep === 2 && store.progress === undefined) {
      store.setHelpView('welcome-creator');
      store.welcomeStep = 3;
    }
  }, [store, store.welcomeStep, store.progress]);

  const clickGroup = () => {
    setGrouped(g => {
      customOrder && setCanUndo(sortAlpha || sortChrono || !g);
      return !g;
    });
  };

  const clickAlpha = () => {
    if (sortAlpha) {
      setSortAlphaForward(s => !s);
    } else {
      setSortAlpha(true);
      setSortChrono(false);
      customOrder && setCanUndo(true);
    }
  };

  const clickChrono = () => {
    if (sortChrono) {
      setSortChronoForward(s => !s);
    } else {
      setSortAlpha(false);
      setSortChrono(true);
      customOrder && setCanUndo(true);
    }
  };

  const clickUndo = () => {
    if (canUndo) {
      setGrouped(false);
      setSortChrono(false);
      setSortAlpha(false);
      setCanUndo(false);
    }
  };

  const getSortDescription = () => {
    if (customOrder && !canUndo) return 'Custom Order';

    // lmao ;////
    return `${grouped ? 'Grouped' : ''}${(grouped && (sortAlpha || sortChrono)) ? ', ' : ''}
    ${((sortChrono && !sortChronoForward) || (sortAlpha && !sortAlphaForward)
    ) ? 'Reverse-' : ''}${sortChrono ? 'Chronological' : ''}${sortAlpha ? 'Alphabetical' : ''}`;
  };

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

  const sortAlbums = (albums?: FetchedAlbum[]) => {
    if (sortAlpha) {
      albums?.sort(sortAlphaForward ? compareAlbumsAlpha : compareAlbumsAlphaReverse);
    } else if (sortChrono) {
      albums?.sort(sortChronoForward ? compareAlbumsChrono : compareAlbumsChronoReverse);
    }
  };

  const getGroupedAlbums = (): [FetchedAlbum[], FetchedAlbum[], FetchedAlbum[]] => {
    // TODO: Support custom order of the groups????

    const discography = store.currentDeepDiveArtistDiscographyGrouped;
    if (discography) {
      const s = discography.findIndex((a) => a.albumGroup === 'single');
      const a = discography.findIndex((a) => a.albumGroup === 'appears_on');
      const albums = discography.slice(0, s);
      const singles = discography.slice(s, a);
      const appears = discography.slice(a);

      sortAlbums(albums);
      sortAlbums(singles);
      sortAlbums(appears);

      return [albums, singles, appears];
    }

    throw new Error('Fucked up getting albums fuck you');
  };

  const getUngroupedAlbums = (): FetchedAlbum[] => {
    const albums = customOrder ?
      store.currentDeepDiveArtistDiscographyOrdered?.slice(0) :
      store.currentDeepDiveArtistDiscographyGrouped?.slice(0);

    sortAlbums(albums);

    if (albums) {
      return albums;
    }

    throw new Error('Fucked up getting albums fuck you');
  };

  const getAlbums = (): FetchedAlbum[] => {
    if (grouped) {
      return getGroupedAlbums().flat(1);
    } else {
      return getUngroupedAlbums();
    }
  };

  const getAlbumsComponent = () => {
    if (grouped) {
      const [albums, singles, appears] = getGroupedAlbums();

      return (
        <>
          <div className="d-flex justify-content-start w-100 px-2"> <h2> Albums: </h2> </div>
          {getGroupOfToggleAlbums(albums)}
          <div className="d-flex justify-content-start w-100 px-2"> <h2> Singles/EPs: </h2> </div>
          {getGroupOfToggleAlbums(singles)}
          <div className="d-flex justify-content-start w-100 px-2"> <h2> Appears On: </h2> </div>
          {getGroupOfToggleAlbums(appears)}
        </>
      );
    } else {
      return getGroupOfToggleAlbums(getUngroupedAlbums());
    }
  };

  const hasAlbumGroup = (albumGroup: AlbumGroup) => {
    return !!store.currentDeepDiveArtistDiscographyGrouped?.find(a => a.albumGroup === albumGroup && store.currentArtistDeepDiveAlbumIds?.has(a.id));
  };

  return (
    <div className="d-flex flex-column align-items-center">
      <div className="d-flex flex-column w-100">
        {(store.currentJustGoodPlaylist?.deepDivePlaylist) && (
          <div className="d-flex justify-content-between mx-2 mt-2">
            <button className="primary-btn" onClick={() => store.currentJustGoodPlaylist?.id && navigate(driveDeepDiver(store.currentJustGoodPlaylist?.id))}>
              Dive in
            </button>
            <button className="primary-btn" onClick={() => store.currentJustGoodPlaylist?.id && navigate(viewDeepDiver(store.currentJustGoodPlaylist?.id))}>
              View Playlist
            </button>
          </div>
        )}
        <button className="primary-btn mx-2 my-3" onClick={() => setShowConfirm(true)}>
          {store.currentJustGoodPlaylist?.deepDivePlaylist ? (
            'Save Deep Dive Playlist'
          ) : (
            'Start the Deep Dive'
          )}
        </button>
      </div>
      <h1 className="text-center m-1"> Select releases to exclude from the deep dive </h1>
      <div className="d-flex justify-content-around my-1 w-100">
        <button className="primary-btn secondary-btn m-1 px-2 py-1" onClick={() => store.toggleAlbumGroupForDeepDive('album')}>
          <p className="m-0 p-0" style={{ textDecoration: hasAlbumGroup('album') ? '' : 'line-through' }}>
            Albums
          </p>
        </button>
        <button className="primary-btn secondary-btn m-1 px-2 py-1" onClick={() => store.toggleAlbumGroupForDeepDive('single')}>
          <p className="m-0 p-0" style={{ textDecoration: hasAlbumGroup('single') ? '' : 'line-through' }}>
            Singles
          </p>
        </button>
        <button className="primary-btn secondary-btn m-1 px-2 py-1" onClick={() => store.toggleAlbumGroupForDeepDive('appears_on')}>
          <p className="m-0 p-0" style={{ textDecoration: hasAlbumGroup('appears_on') ? '' : 'line-through' }}>
            Features
          </p>
        </button>
      </div>
      <div className="d-flex justify-content-between w-100 my-1">
        <div className="d-flex justify-content-start align-items-center mx-2">
          <i className="text-small m-0 p-0"> { getSortDescription() } </i>
        </div>
        <div className="d-flex justify-content-end my-2">
          <button className="deep-dive-creator-sort-button" onClick={clickGroup}>
            <i className={`bi bi-collection bi-small mx-1 p-0 ${grouped ? '' : 'disabled'}`} />
          </button>
          <button className="deep-dive-creator-sort-button" onClick={clickAlpha}>
            <i className={`bi bi-sort-alpha-${sortAlphaForward ? 'down' : 'up'} bi-small mx-1 p-0 ${sortAlpha ? '' : 'disabled'}`} />
          </button>
          <button className="deep-dive-creator-sort-button" onClick={clickChrono}>
            <i className={`bi bi-sort-numeric-${sortChronoForward ? 'down' : 'up'} bi-small mx-1 p-0 ${sortChrono ? '' : 'disabled'}`} />
          </button>
          {customOrder && (
            <button className="deep-dive-creator-sort-button" onClick={clickUndo}>
              <i className={`bi bi-arrow-counterclockwise bi-small mx-1 p-0 ${canUndo ? '' : 'disabled'}`} />
            </button>
          )}
        </div>
      </div>
      { getAlbumsComponent() }
      <ConfirmModal
        show={showConfirm}
        title="Ready to Start the Deep Dive?"
        message="This will create a new playlist in your spotify with all of this artists songs you chose."
        onConfirm={async () => {
          setShowConfirm(false);
          await store.createOrUpdateDeepDivePlaylist(getAlbums());
          store.currentJustGoodPlaylist?.id && navigate(driveDeepDiver(store.currentJustGoodPlaylist.id));
        }}
        onDecline={() => setShowConfirm(false)}
      />
    </div>
  );
});

export default DeepDiveCreator;
