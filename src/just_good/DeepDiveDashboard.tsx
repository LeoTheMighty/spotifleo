import React, { useEffect } from 'react';
import DeepDiver from './DeepDiver';
import BackgroundPlayer from './BackgroundPlayer';
import ArtistSearch from './ArtistSearch';
import UserProfile from '../components/UserProfile';
import { useStore } from '../state/SpotifyStoreProvider';
import HorizontalScrollView from '../components/HorizontalScrollView';
import { useNavigate } from 'react-router-dom';
import LoadingIndicator from '../common/LoadingIndicator';
import JustGoodScroller from './JustGoodScroller';
import { observer } from 'mobx-react';

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

const Dashboard = observer(() => {
  const store = useStore();
  const navigate = useNavigate();

  return (
    <div className="deep-dive-dashboard">
      <JustGoodScroller label="Finished Just Good Playlists" emptyLabel="haha no bitches" playlists={store.justGoodPlaylists} />
      <JustGoodScroller label="In Progress Just Good Playlists" emptyLabel="haha no bitches" playlists={store.inProgressJustGoodPlaylists} />
      <JustGoodScroller label="Planned Just Good Playlists" emptyLabel="haha no bitches" playlists={store.plannedJustGoodPlaylists} />
    </div>
  );
});

export default Dashboard;
