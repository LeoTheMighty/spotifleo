import React from 'react';
import ArtistSearch from './ArtistSearch';
import { useNavigate } from 'react-router-dom';

const TopBar = () => {
  const navigate = useNavigate();

  return (
    <div className="top-bar">
      <button onClick={() => navigate(-1)}>
        <i className="bi bi-caret-left top-bar-icon" />
      </button>
      <ArtistSearch />
      <button onClick={() => alert('todo: settings')}>
        <i className="bi bi-gear top-bar-icon" />
      </button>
    </div>
  );
};

export default TopBar;
