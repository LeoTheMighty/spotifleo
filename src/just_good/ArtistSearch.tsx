import React, { ChangeEvent, useState } from 'react';
import { observer } from 'mobx-react';
import { useStore } from '../state/SpotifyStoreProvider';
import { debounce } from 'lodash';
import LoadingIndicator from '../common/LoadingIndicator';
import ArtistSearchResult from './ArtistSearchResult';
import { Artist } from '../types';

const SEARCH_DEBOUNCE_TIME = 800;

const ArtistSearch = observer(() => {
  const store = useStore();
  const [inputSelected, setInputSelected] = useState(false);

  const onClick = (artist: Artist) => {
    if (!store.justGoodPlaylistArtistMap?.hasOwnProperty(artist.id)) {
      store.createJustGoodPlaylist(artist);
    }
  };

  const inputChange = (value: string) => {
    if (value === '') {
      store.clearSearchArtistResults();
    } else {
      store.searchArtists(value);
    }
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => inputChange(e.target.value);

  const showResults = inputSelected && store.artistResults?.length !== 0;
  return (
    <div
      className="search-container"
      role="search"
    >
      <div className="search-bar">
        <input
          className={`search-bar-input ${showResults ? 'results-showing' : ''}`}
          type="text"
          name="searchInput"
          placeholder="Find Artists"
          onChange={debounce(onChange, SEARCH_DEBOUNCE_TIME)}
          onSelect={() => setInputSelected(true)}
          onBlur={() => setInputSelected(false)}
        />
        {showResults && (
          <button className="search-clear-button" onTouchStart={() => inputChange('')}>
            <i className="bi bi-x" />
          </button>
        )}
        <i className="bi bi-search search-bar-icon" />
      </div>
      <div className={`search-bar-results ${showResults ? 'showing' : ''}`}>
        {store.artistResults.map((artist) => (
          <ArtistSearchResult
            artist={artist}
            added={store.justGoodPlaylistArtistMap?.hasOwnProperty(artist.id) || false}
            onClickAction={() => onClick(artist)}
          />
        ))}
        <button className="primary-btn border-none" > More... </button>
      </div>
    </div>
  );
});

export default ArtistSearch;
