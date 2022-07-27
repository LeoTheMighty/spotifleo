import React, { useEffect } from 'react';
import Dashboard from './just_good/DeepDiveDashboard';

import { Route, BrowserRouter, Routes, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react';
import SpotifyAuthView from './auth/SpotifyAuthView';
import useSpotifyStore from './state/SpotifyStore';
import { StoreProvider } from './state/SpotifyStoreProvider';

import 'react-spotify-auth/dist/index.css'
import SpotifyAuthCallback from './auth/SpotifyAuthCallback';
import DeepDiver from './just_good/DeepDiver';
import TopBar from './just_good/TopBar';
import BottomBar from './just_good/BottomBar';
import SpotifyAuthLogout from './auth/SpotifyAuthLogout';
import LoadingIndicator from './common/LoadingIndicator';
import LoadingScreen from './components/LoadingScreen';
import { Modal } from 'react-bootstrap';

const NavToRoot = () => {
  const navigate = useNavigate();
  useEffect(() => navigate('/spotifleo'), [navigate]);
  return (<div />);
};

const App = observer(() => {
  const store = useSpotifyStore();

  useEffect(() => { store.fetchToken() }, []);

  return (
    <div className="app">
      <StoreProvider store={store}>
        <BrowserRouter>
          <TopBar />
          <div className="app-content">
            { store.setupLoading ? (
              <div className="d-flex justify-content-center align-items-center text-center w-100">
                <i className="text-center text-bigger m-3"> Loading all current user data... This may take a while </i>
              </div>
            ) : (
              <Routes>
                { store.token ? [
                  <Route path="/spotifleo/welcome" element="hey :)"/>,
                  <Route path="/spotifleo/deepdiver" element={<DeepDiver />} />,
                  <Route path="/spotifleo/logout" element={<SpotifyAuthLogout />} />,
                  <Route path="/spotifleo" element={<Dashboard />} />,
                  // <Route path="/*" element={<NavToRoot />} />,
                  <Route path="/" element={<NavToRoot />} />
                ] : [
                  <Route path="/spotifleo/callback" element={<SpotifyAuthCallback />} />,
                  <Route path="/spotifleo" element={<SpotifyAuthView />} />,
                  <Route path="/*" element={<NavToRoot />} />,
                  // <Route path="/" element={<NavToRoot />} />
                ]}
                <Route path="/" element={<NavToRoot />} />
              </Routes>
            )}
          </div>
          <BottomBar />
          {/*<Modal show={store.progress !== undefined}>*/}
          {/*  <LoadingScreen />*/}
          {/*</Modal>*/}
        </BrowserRouter>
      </StoreProvider>
    </div>
  );
});

export default App;
