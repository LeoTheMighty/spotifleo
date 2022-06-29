import React from 'react';
import { Artist } from '../types';

type Props = {
  artist: Artist;
  onClick: () => void;
};

const ArtistSearchResult = ({ artist, onClick }: Props) => {
  return (
    <button type="button" className="search-bar-result" onTouchStart={onClick} onMouseDown={onClick}>
      <div className="artist-result">
        { artist.name }
        <button>
          Add to Deep Dive Playlists
        </button>
      </div>
    </button>
  );
};

export default ArtistSearchResult;
