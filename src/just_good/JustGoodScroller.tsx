import React from 'react';
import HorizontalScrollView from '../components/HorizontalScrollView';
import { CachedJustGoodPlaylist } from '../types';
import { useNavigate } from 'react-router-dom';
import Image from '../components/Image';
import { deepDiver, outOfDate } from '../logic/common';
import { useStore } from '../state/SpotifyStoreProvider';

type Props = {
  label?: string;
  emptyLabel?: string;
  playlists?: CachedJustGoodPlaylist[];
  view?: 'edit-deep-dive' | 'deep-dive' | 'view-deep-dive';
  welcomeFirst?: boolean;
}

const JustGoodScroller = ({ label, emptyLabel, playlists, view = 'edit-deep-dive', welcomeFirst }: Props) => {
  const store = useStore();
  const navigate = useNavigate();

  return (
    <div className={`just-good-scroller ${welcomeFirst ? 'welcome-select' : ''}`}>
      <h2> { label || 'Just Good Playlists' } </h2>
      {playlists?.length ? (
        <div className="just-good-scroll-container">
          <HorizontalScrollView>
            {playlists?.map((playlist, i) => (
              <button
                key={playlist.id}
                type="button"
                className={`horizontal-menu-item d-block ${(welcomeFirst && i === 0) ? 'welcome-select-highlighted' : ''}`}
                onClick={() => { if (welcomeFirst && i === 0) { store.welcomeStep = 2 } navigate(deepDiver(playlist.id, view)) }}>
                {playlist.artistImg && <Image className="just-good-scroller-image" src={playlist.artistImg} alt="test" large />}
                <i className="d-block text-big text-lighter">
                  <div className="d-flex justify-content-center align-items-center">
                    {playlist.artistName}
                    { outOfDate(playlist) && <i className="bi bi-circle-fill text-greener text-smallest mx-2" /> }
                  </div>
                  </i>
              </button>
            ))}
          </HorizontalScrollView>
        </div>
      ) : <div className="d-flex align-items-center m-3"> <i>{ emptyLabel }</i> </div>}
    </div>
  );
};

export default JustGoodScroller;
