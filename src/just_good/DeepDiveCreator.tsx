import React, { useEffect, useState } from 'react';
import { useStore } from '../state/SpotifyStoreProvider';
import ToggleAlbum from './ToggleAlbum';
import { observer } from 'mobx-react';
import { Album, AlbumGroup, FetchedAlbum, Track } from '../types';
import ConfirmModal from '../components/ConfirmModal';
import { driveDeepDiver, min, viewDeepDiver } from '../logic/common';
import { useNavigate } from 'react-router-dom';
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from 'react-bootstrap';
import TracksViewer from './TracksViewer';
import AlbumViewer from './AlbumViewer';

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
const compareAlbumsPopular = (a: Album, b: Album) => b.popularity - a.popularity;
const compareAlbumsPopularReverse = (a: Album, b: Album) => a.popularity - b.popularity;
const compareTracksPopular = (a: Track, b: Track) => b.popularity - a.popularity;
const compareTracksPopularReverse = (a: Track, b: Track) => a.popularity - b.popularity;

const DeepDiveCreator = observer(() => {
  const store = useStore();
  const navigate = useNavigate();
  const [viewList, setViewList] = useState(false);
  const [grouped, setGrouped] = useState(true);
  const [albumGrouped, setAlbumGrouped] = useState(false);
  const [sortAlpha, setSortAlpha] = useState(false);
  const [sortChrono, setSortChrono] = useState(true);
  const [sortPopular, setSortPopular] = useState(false);
  const [sortAlphaForward, setSortAlphaForward] = useState(true);
  const [sortChronoForward, setSortChronoForward] = useState(true);
  const [sortPopularForward, setSortPopularForward] = useState(true);
  const [customOrder, setCustomOrder] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [importExisting, setImportExisting] = useState(false);

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

  // really wish this click logic could be cleaner rip
  const clickGroup = () => {
    if (albumGrouped) {
      setGrouped(true);
      setAlbumGrouped(false);
    } else if (grouped && !sortChrono) {
      setGrouped(false);
      setAlbumGrouped(false);
    } else {
      setGrouped(false);
      setAlbumGrouped(true);
      customOrder && setCanUndo(sortAlpha || sortChrono || sortPopular);
    }
  };

  const clickAlpha = () => {
    if (sortAlpha) {
      setSortAlphaForward(s => !s);
    } else {
      setSortAlpha(true);
      setSortChrono(false);
      setSortPopular(false);
      customOrder && setCanUndo(true);
    }
  };

  const clickChrono = () => {
    if (sortChrono) {
      setSortChronoForward(s => !s);
    } else {
      setSortAlpha(false);
      setSortChrono(true);
      setSortPopular(false);
      customOrder && setCanUndo(true);
      if (!grouped && !albumGrouped) {
        setGrouped(false);
        setAlbumGrouped(true);
      }
    }
  };

  const clickPopular = () => {
    if (sortPopular) {
      setSortPopularForward(s => !s);
    } else {
      setSortAlpha(false);
      setSortChrono(false);
      setSortPopular(true);
      customOrder && setCanUndo(true);
    }
  }

  const clickUndo = () => {
    if (canUndo) {
      setGrouped(false);
      setAlbumGrouped(false);
      setSortChrono(false);
      setSortAlpha(false);
      setSortPopular(false);
      setCanUndo(false);
    }
  };

  const getGroupedDescription = () => (
    (grouped || albumGrouped) ? `Grouped by ${grouped ? 'Type' : 'Album'}` : 'Individual Tracks'
  );

  const getSortDescription = () => {
    // return 'Sorted Popularly';
    // return 'Sorted Un-popularly';
    // return 'Chronological';
    // return 'Sorted by Popular';
    // return 'Grouped by Type, Reverse-Chronological';

    if (customOrder && !canUndo) return 'Custom Order';
    // lmao ;////
    return `Sorted ${((sortChrono && !sortChronoForward) || (sortAlpha && !sortAlphaForward)
    ) ? 'Reverse-' : ''}${sortChrono ? 'Chronological' : ''}${sortAlpha ? 'Alphabetical' : ''}
    ${sortPopular ? (sortPopularForward ? 'Popularly' : 'Un-popularly') : ''}`;
  };

  const toggleAlbum = (album: FetchedAlbum) => {
    store.toggleAlbumForDeepDive(album);
  };

  const getGroupOfToggleAlbums = (albums: FetchedAlbum[] | undefined) => (
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
    } else if (sortPopular) {
      albums?.sort(sortPopularForward ? compareAlbumsPopular : compareAlbumsPopularReverse);
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

  const getTracks = (): Track[] => {
    const tracks = getAlbums().flatMap(a => a.tracks);
    if (!grouped && !albumGrouped && sortPopular) {
      sortPopularForward ? tracks.sort(compareTracksPopular) : tracks.sort(compareTracksPopularReverse);
    }
    return tracks;
  }

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

  const getTrackListComponent = () => {
    if (grouped) {
      const [albums, singles, appears] = getGroupedAlbums();

      return (
        <>
          <div className="d-flex justify-content-start w-100 px-2"> <h2> Albums: </h2> </div>
          {albums.map((album) => (
            <AlbumViewer album={album} viewNotGood={true} store={store} action="toggleDeepDive" />
          ))}
          <div className="d-flex justify-content-start w-100 px-2"> <h2> Singles/EPs: </h2> </div>
          {singles.map((album) => (
            <AlbumViewer album={album} viewNotGood={true} store={store} action="toggleDeepDive" />
          ))}
          <div className="d-flex justify-content-start w-100 px-2"> <h2> Appears On: </h2> </div>
          {appears.map((album) => (
            <AlbumViewer album={album} viewNotGood={true} store={store} action="toggleDeepDive" />
          ))}
        </>
      );
    } else if (albumGrouped) {
      return getUngroupedAlbums().map((album) => (
        <AlbumViewer album={album} viewNotGood={true} store={store} action="toggleDeepDive" />
      ));
    } else {
      return (
        <TracksViewer
          showAlbum={true}
          store={store}
          tracks={getTracks()}
          viewNotGood={true}
          action="toggleDeepDive"
        />
      );
    }
  };

  const hasAlbumGroup = (albumGroup: AlbumGroup) => {
    return !!store.currentDeepDiveArtistDiscographyGrouped?.find(a => a.albumGroup === albumGroup && store.currentArtistDeepDiveAlbumIds?.has(a.id));
  };

  return (
    <div className="d-flex flex-column align-items-center w-100">
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
        {/*<button className={`primary-btn toggle mx-2 my-3 ${importExisting ? 'on' : 'off'}`} onClick={() => setImportExisting(i => !i)}>*/}
        {/*  {importExisting ? (*/}
        {/*    'Importing Liked to Just Good'*/}
        {/*  ) : (*/}
        {/*    'Import Liked Songs to Just Good?'*/}
        {/*  )}*/}
        {/*</button>*/}
      </div>
      {store.currentJustGoodPlaylist?.artistName && (
        <h1 className="text-center text-lightest m-1 w-100" style={{ fontSize: `${29.5 - min(store.currentJustGoodPlaylist.artistName.length, 10)}vw` }}>
          {store.currentJustGoodPlaylist.artistName}
        </h1>
      )}
      <h1 className="text-center text-lightest m-1"> Sort and filter your Deep Dive </h1>
      <div className="d-flex flex-row justify-content-between my-1 w-100">
        <div className="d-flex justify-content-start">
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
        <div className="d-flex justify-content-end">
          <button className="deep-dive-creator-sort-button" onClick={() => setViewList(v => !v)}>
            <i className={`bi bi-${viewList ? 'music-note-list' : 'grid-fill'} bi-small mx-1`} />
          </button>
        </div>
      </div>
      <div className="d-flex justify-content-between align-items-center w-100 my-1">
        <div className="d-flex justify-content-start flex-column mx-2 text-start">
          <i className="text-small m-0 p-0"> { getGroupedDescription() } </i>
          <i className="text-small m-0 p-0"> { getSortDescription() } </i>
        </div>
        <div className="d-flex justify-content-end my-2">
          <button className="deep-dive-creator-sort-button" onClick={clickGroup}>
            <i className={`bi bi-collection bi-small position-relative mx-1 p-0 ${(grouped || albumGrouped) ? '' : 'disabled'}`}>
              {albumGrouped && (<i className="bi bi-file-music" style={{ position: 'absolute', bottom: '0.11rem', left: '0.32rem', fontSize: '0.9rem' }} />)}
            </i>
          </button>
          <button className="deep-dive-creator-sort-button" onClick={clickAlpha}>
            <i className={`bi bi-sort-alpha-${sortAlphaForward ? 'down' : 'up'} bi-small mx-1 p-0 ${sortAlpha ? '' : 'disabled'}`} />
          </button>
          <button className="deep-dive-creator-sort-button" onClick={clickChrono}>
            <i className={`bi bi-sort-numeric-${sortChronoForward ? 'down' : 'up'} bi-small mx-1 p-0 ${sortChrono ? '' : 'disabled'}`} />
          </button>
          <button className="deep-dive-creator-sort-button mx-1" onClick={clickPopular}>
            <i className={`bi bi-sort-${sortPopularForward ? 'down' : 'up'} bi-small position-relative mx-1 p-0 ${sortPopular ? '' : 'disabled'}`}>
              <i className="bi bi-person-hearts floated-bottom-right-corner" />
            </i>
          </button>
          {customOrder && (
            <button className="deep-dive-creator-sort-button" onClick={clickUndo}>
              <i className={`bi bi-arrow-counterclockwise bi-small mx-1 p-0 ${canUndo ? '' : 'disabled'}`} />
            </button>
          )}
        </div>
      </div>
      { viewList ? (
        <div className="d-flex flex-column w-100">
          { getTrackListComponent() }
        </div>
      ): getAlbumsComponent() }
      <Modal show={showConfirm} onHide={() => setShowConfirm(false)}>
        <ModalHeader> <ModalTitle> Ready to Start the deep dive? </ModalTitle></ModalHeader>
        <ModalBody>
          <div className="d-flex justify-content-center">
            This will create a new playlist in your spotify with all of this artists songs you chose.
          </div>
          <div className="d-flex justify-content-center">
            <button className={`primary-btn toggle mx-2 my-3 ${importExisting ? 'on' : 'off'}`} onClick={() => setImportExisting(i => !i)}>
              {importExisting ? (
                'Importing Liked to Just Good'
              ) : (
                'Import Liked Songs to Just Good?'
              )}
            </button>
          </div>
        </ModalBody>
        <ModalFooter>
          <button className="primary-btn" onClick={async () => {
            setShowConfirm(false);
            const tracks = getAlbums().flatMap(a => a.tracks);
            if (!grouped && !albumGrouped && sortPopular) {
              sortPopularForward ? tracks.sort(compareTracksPopular) : tracks.sort(compareTracksPopularReverse);
            }
            await store.createOrUpdateDeepDivePlaylist(tracks, (!grouped && !albumGrouped) ? 1 : 0, importExisting);
            store.currentJustGoodPlaylist?.id && navigate(driveDeepDiver(store.currentJustGoodPlaylist.id));
          }}>
            yes
          </button>
          <button className="primary-btn secondary-btn" onClick={() => setShowConfirm(false)}>
            no
          </button>
        </ModalFooter>
      </Modal>
      {/*<ConfirmModal*/}
      {/*  show={showConfirm}*/}
      {/*  title="Ready to Start the Deep Dive?"*/}
      {/*  message="This will create a new playlist in your spotify with all of this artists songs you chose."*/}
      {/*  onConfirm={async () => {*/}
      {/*    setShowConfirm(false);*/}
      {/*    await store.createOrUpdateDeepDivePlaylist(getAlbums());*/}
      {/*    store.currentJustGoodPlaylist?.id && navigate(driveDeepDiver(store.currentJustGoodPlaylist.id));*/}
      {/*  }}*/}
      {/*  onDecline={() => setShowConfirm(false)}*/}
      {/*/>*/}
    </div>
  );
});

export default DeepDiveCreator;
