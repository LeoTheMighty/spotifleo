import React, { useEffect } from 'react';
import Dashboard from './just_good/DeepDiveDashboard';

import { Route, BrowserRouter, Routes, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react';
import SpotifyAuthView from './auth/SpotifyAuthView';

import 'react-spotify-auth/dist/index.css'
import SpotifyAuthCallback from './auth/SpotifyAuthCallback';
import DeepDiver from './just_good/DeepDiver';
import TopBar from './just_good/TopBar';
import BottomBar from './just_good/BottomBar';
import SpotifyAuthLogout from './auth/SpotifyAuthLogout';
import { Modal } from 'react-bootstrap';
import HelpView from './just_good/HelpView';
import { useStore } from './state/SpotifyStoreProvider';

const NavToRoot = () => {
  const navigate = useNavigate();
  useEffect(() => navigate('/spotifleo'), [navigate]);
  return (<div>Rerouting to root...</div>);
};

const App = observer(() => {
  const store = useStore();

  useEffect(() => { store.fetchToken() }, []);

  return (
    <div className="app">
      <BrowserRouter>
        <TopBar />
        <div className="app-content">
          { store.setupLoading ? (
            <div className="d-flex justify-content-center flex-column align-items-center text-center w-100">
              <i className="text-center text-bigger m-3"> Loading all current user data... This may take a while </i>
              <i className="text-center text-smaller mx-5"> {store.progress?.current} </i>
            </div>
          ) : (
            <Routes>
              { store.token ? [
                <Route path="/spotifleo/welcome" element="hey :)" key={1} />,
                <Route path="/spotifleo/deepdiver" element={<DeepDiver />} key={2} />,
                <Route path="/spotifleo/logout" element={<SpotifyAuthLogout />} key={3} />,
                <Route path="/spotifleo" element={<Dashboard />} key={4} />,
                // <Route path="/*" element={<NavToRoot />} />,
                <Route path="/" element={<NavToRoot />} key={5} />
              ] : [
                <Route path="/spotifleo/callback" element={<SpotifyAuthCallback />} key={1} />,
                <Route path="/spotifleo" element={<SpotifyAuthView />} key={2} />,
                <Route path="/*" element={<NavToRoot />} key={3} />,
                // <Route path="/" element={<NavToRoot />} />
              ]}
              <Route path="/" element={<NavToRoot />} key={0} />
            </Routes>
          )}
        </div>
        <BottomBar />
        <Modal show={store.helpView !== undefined} onHide={() => store.setHelpView(undefined)}>
          <HelpView view={store.helpView} />
        </Modal>
      </BrowserRouter>
    </div>
  );
});

export default App;
