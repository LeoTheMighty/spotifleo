import React from 'react';
import { Album, Playlist, SpotifyItem, Track } from '../types';

type Props = {
  item: SpotifyItem;
  i: number;
};

/*


  |---------------------------|
  |                           |
  |                           |
  |         album art         |
  |                           |
  |                           |
  |                           |
  |                           |
  |                           |
  |---------------------------|
            Name
           By yeah

 */

const IconView = ({ item, i } : Props) => {
  // let artist = null;
  // switch (item.type) {
  //   case 'album':
  //     artist = (item as Album).artist;
  //     break;
  //   case 'playlist':
  //     artist = (item as Track).artist;
  //     break;
  //   default:
  //     break;
  // }

  return (
    <div className={`icon-view-${i}`}>
      <a>
        <img
          className="spotify-icon-img"
          src={item.img?.small}
          alt={`${item.name}`}
        />
      </a>
    </div>
  );
};

export default IconView;
