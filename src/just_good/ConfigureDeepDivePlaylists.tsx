import React from 'react';
import { observer } from 'mobx-react';
import { useStore } from '../state/SpotifyStoreProvider';

// show all of the playlists as toggle buttons.

const ConfigureDeepDivePlaylists = observer(() => {
  const store = useStore();

  return (
    <div className="configure-deep-dive-playlists">
      {store.userPlaylists?.map((playlist, i) => (
        <button
          className={`primary-btn playlist-button ${store.deepDiverPlaylistIndexes?.[playlist.id] !== undefined ? 'on' : 'off'}`}
          onClick={() => store.togglePlaylistInDeepDiverPlaylists(playlist, i)}
        >
          { playlist.name }
        </button>
      ))}
    </div>
  );
});

export default ConfigureDeepDivePlaylists;
