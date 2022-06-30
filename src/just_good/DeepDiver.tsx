import React, { useEffect, useState } from 'react';
import IconView from './IconView';
import { Track } from '../types';
import { observer } from 'mobx-react';
import { useStore } from '../state/SpotifyStoreProvider';
import { ProgressBar } from 'react-bootstrap';
import BackgroundPlayer from './BackgroundPlayer';
import { getParams } from '../logic/common';

const TEST_PLAYLIST_ID = '';

/*

Back button "<"                                 "View Playlist in Spotify"


-------|          |-----------------------|           |---------
       |          \                       |           |
       |          \                       |           |
       |          \                       |           |
  <    |          \                       |           |    >
       |          \                       |           |
       |          \                       |           |
-------|          |-----------------------|           |----------

                         Good? (adds to Just Good)

 */

// Prepare 5 components.

const SongScroller = ({ songs }: { songs: Track[] }) => {
  return (
    <div className="song-scroller">
      { songs.map((song, i) => (
        <IconView item={song} i={i} />
      ))}
    </div>
  )
};

const addSongToJustGood = (trackID: string, playlistID: string) => {

}

const DeepDiver = observer(() => {
  const store = useStore();
  const params = getParams();

  const [songList, setSongList] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (params.playlist_id) {
      console.log('Lmao');
      console.log(params.playlist_id);
    } else {
      console.error('No playlist provided');
    }
  }, [params.playlist_id]);

  // get 5. 2 before, the current, 2 after
  const getSongs = () => songList.slice(index - 2, index + 3);

  return (
    <div className="deep-diver">
      <div className="justify-content-between">
        <button> {'<'} </button>
        <button> View Playlist in Spotify </button>
      </div>
      <SongScroller songs={getSongs()} />
      <div>
        <button onClick={store.updatePlayer}>
          Update Player
        </button>
      </div>
    </div>
  );
});

export default DeepDiver;
