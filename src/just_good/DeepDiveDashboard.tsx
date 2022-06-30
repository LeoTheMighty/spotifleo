import React from 'react';
import DeepDiver from './DeepDiver';
import BackgroundPlayer from './BackgroundPlayer';
import ArtistSearch from './ArtistSearch';
import UserProfile from '../components/UserProfile';
import { useStore } from '../state/SpotifyStoreProvider';
import HorizontalScrollView from '../components/HorizontalScrollView';
import { useNavigate } from 'react-router-dom';

const TEST_PLAYLIST_ID = '';

/*

Dashboard should show:
* Finished Deep Dive Playlists
  * View the Artist image
  * Click should load the playlist
     * Should have an "Edit" button that allows you to run the deep diver again?
* Deep Dive Playlists in Progress
  * View the artist image / maybe the albums?
  * Click should pull up the Deep Diver

Extra:
* Suggested Deep Dives

*/

const Dashboard = () => {
  const store = useStore();
  const navigate = useNavigate();

  return (
    <div className="dashboard">
      <div className="top-bar d-flex justify-content-center align-items-center sticky-top">
        <ArtistSearch />
      </div>
      <p> Finished Just Good Playlists: </p>
      <HorizontalScrollView>
        {store.justGoodPlaylists?.map((playlist) => (
          <button type="button" className="horizontal-menu-item d-block" onClick={() => navigate({ pathname: '/spotifleo/deepdiver', search: `?playlist_id=${playlist.id}`})}>
            { playlist.artistImg && <img className="background-player-album" src={playlist.artistImg.small} alt="test" /> }
            <p> {playlist.name} </p>
          </button>
        ))}
      </HorizontalScrollView>
      <p> In Progress Just Good Playlists: </p>
      <HorizontalScrollView>
        {store.inProgressJustGoodPlaylists?.map((playlist) => (
          <div className="horizontal-menu-item d-block">
            { playlist.artistImg && <img className="background-player-album" src={playlist.artistImg.small} alt="test" /> }
            <p> {playlist.name} </p>
          </div>
        ))}
      </HorizontalScrollView>
      {/*<DeepDiver playlistID={TEST_PLAYLIST_ID} />*/}
      {/*<UserProfile />*/}
      <BackgroundPlayer />
    </div>
  );
};

export default Dashboard;
