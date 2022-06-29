import React, { useEffect } from 'react';
import Dashboard from './just_good/DeepDiveDashboard';

import { Route, BrowserRouter, Routes } from 'react-router-dom';
import { observer } from 'mobx-react';
import SpotifyAuthView from './auth/SpotifyAuthView';
import useSpotifyStore from './state/SpotifyStore';
import { StoreProvider } from './state/SpotifyStoreProvider';

import 'react-spotify-auth/dist/index.css'
import SpotifyAuthCallback from './auth/SpotifyAuthCallback';

const App = observer(() => {
  const store = useSpotifyStore();

  useEffect(() => { store.fetchToken() }, []);

  return (
    <div className="app">
      <StoreProvider store={store}>
        <BrowserRouter>
          <Routes>
            <Route path="/welcome" element="hey :)"/>
            <Route path="/" element={store.token ? (
              <Dashboard />
            ) : (
              <SpotifyAuthView />
            )} />
            <Route path="/callback" element={<SpotifyAuthCallback />}/>
          </Routes>
        </BrowserRouter>
      </StoreProvider>
    </div>
  );
});

export default App;
