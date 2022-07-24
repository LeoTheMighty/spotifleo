import React from 'react';
import { observer } from 'mobx-react';
import { useStore } from '../state/SpotifyStoreProvider';
import { LIKED_INDICATOR } from '../api/Spotify';

// show all of the playlists as toggle buttons.

const ConfigureDeepDivePlaylists = observer(() => {
  const store = useStore();

  return (
    <div className="configure-deep-dive-playlists">
      {store.userPlaylists?.map((playlist, i) => (playlist.id === LIKED_INDICATOR ? undefined :
        <button
          className={`primary-btn playlist-button ${store.deepDiverPlaylistIndexes?.has(playlist.id) ? 'on' : 'off'}`}
          onClick={() => store.togglePlaylistInDeepDiverPlaylists(playlist, i)}
        >
          { playlist.name }
        </button>
      ))}
    </div>
  );
});

export default ConfigureDeepDivePlaylists;
