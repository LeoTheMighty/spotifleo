import React from 'react';
import { observer } from 'mobx-react';
import { useStore } from '../state/SpotifyStoreProvider';
import { LIKED_INDICATOR } from '../api/Spotify';
import LoadingIndicator from '../common/LoadingIndicator';

// show all of the playlists as toggle buttons.

const ConfigureDeepDivePlaylists = observer(({ hide }: { hide: () => void }) => {
  const store = useStore();

  return (
    <div className="configure-deep-dive-playlists">
      <table>
        <tr>
          <th>Playlist</th>
          <th>Tracks</th>
        </tr>
        {store.userPlaylists?.map((playlist, i) => (playlist.id === LIKED_INDICATOR ? undefined :
          <tr>
            <td>
              <button
                className={`primary-btn playlist-button ${store.deepDiverPlaylistIndexes?.has(playlist.id) ? 'on' : 'off'}`}
                onClick={() => store.togglePlaylistInDeepDiverPlaylists(playlist, i)}
              >
                { store.loadingDeepDiverPlaylists.has(playlist.id) ? <LoadingIndicator /> : playlist.name }
              </button>
            </td>
            <td className="d-flex justify-content-end"> { playlist.numTracks } </td>
          </tr>
        ))}
      </table>
    </div>
  );
});

export default ConfigureDeepDivePlaylists;
