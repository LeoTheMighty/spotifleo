import React from 'react';
import { Artist } from '../types';
import Image from '../components/Image';
import { useStore } from '../state/SpotifyStoreProvider';

type Props = {
  artist: Artist;
  added: boolean;
  onClick?: () => void;
  onClickAction: () => void;
};

const ArtistSearchResult = ({ artist, added, onClick, onClickAction }: Props) => {
  return (
    <div className="search-bar-result">
      <div className="artist-result">
        <button type="button" className="d-flex justify-content-start h-100" onTouchStart={onClick} onMouseDown={onClick}>
          <Image className="artist-result-img" src={artist.img} alt={`${artist.name}`} />
          <p className="artist-result-name">{ artist.name }</p>
        </button>
        <button className="secondary-btn search-result-action" onTouchStart={onClickAction} onMouseDown={onClickAction}>
        { added ? (<i className="bi bi-eye-fill" />) : <i className="bi bi-plus" />}
        </button>
      </div>
    </div>
  );
};

export default ArtistSearchResult;
