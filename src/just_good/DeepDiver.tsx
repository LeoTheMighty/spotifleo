import React, { useEffect, useState } from 'react';
import IconView from './IconView';
import { Track } from '../types';
import { observer } from 'mobx-react';
import { useStore } from '../state/SpotifyStoreProvider';
import { ProgressBar } from 'react-bootstrap';
import BackgroundPlayer from './BackgroundPlayer';

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

type Props = {
  playlistID: string; //
};

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

const DeepDiver = observer((props: Props) => {
  const store = useStore();

  const [songList, setSongList] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {

  }, []);

  // get 5. 2 before, the current, 2 after
  const getSongs = () => songList.slice(index - 2, index + 3);

  return (
    <div>
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
