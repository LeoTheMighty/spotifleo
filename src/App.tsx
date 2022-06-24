import React, { useEffect } from 'react';
import Dashboard from './just_good';

import { observer } from 'mobx-react';
import SpotifyAuthView from './SpotifyAuthView';
import useSpotifyStore from './state/SpotifyStore';
import { StoreProvider } from './state/SpotifyStoreProvider';

import 'react-spotify-auth/dist/index.css'


const App = observer(() => {
  const store = useSpotifyStore();

  return (
    <div className="App">
      <header className="App-header">
        <StoreProvider store={store}>
          { store.token ? (
            <Dashboard token={store.token} />
          ) : (
            <SpotifyAuthView setToken={store.setToken} />
          )}
        </StoreProvider>
      </header>
    </div>
  );
});

export default App;
