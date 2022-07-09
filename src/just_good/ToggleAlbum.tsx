import React from 'react';
import { Album } from '../types';

type Props = {
  album: Album;
  value: boolean;
  onClick: () => void;
}

const ToggleAlbum = ({ value, album: { img, name, albumGroup, trackCount, releaseDate }, onClick }: Props) => {
  const isAppearsOn = albumGroup === 'appears_on';
  return (
    <div className="toggle-album">
      <div className="toggle-album-container">
        <button className={`toggle-overlay ${!value ? 'toggle-overlay-active' : ''}`} onClick={onClick}/>
        { value || (<i className="toggle-album-x bi bi-x" />)}
        <img className="toggle-album-img" src={img?.large} alt={name} />
      </div>
      <b style={{ textDecoration: value ? '' : 'line-through' }} className="no-wrap overflow-hidden">{ name }</b>
      <i>({releaseDate.getFullYear()}) {isAppearsOn ? '' : '(' + trackCount + ' track' + (trackCount === 1 ? '' : 's') + ')'}</i>
    </div>
  );
};

export default ToggleAlbum;
