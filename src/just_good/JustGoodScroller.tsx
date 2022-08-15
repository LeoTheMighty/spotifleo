import React from 'react';
import HorizontalScrollView from '../components/HorizontalScrollView';
import LoadingIndicator from '../common/LoadingIndicator';
import { CachedJustGoodPlaylist } from '../types';
import { useNavigate } from 'react-router-dom';
import Image from '../components/Image';
import { deepDiver } from '../logic/common';

type Props = {
  label?: string;
  emptyLabel?: string;
  playlists?: CachedJustGoodPlaylist[];
  view?: 'edit-deep-dive' | 'deep-dive' | 'view-deep-dive';
}

const JustGoodScroller = ({ label, emptyLabel, playlists, view = 'edit-deep-dive' }: Props) => {
  const navigate = useNavigate();

  return (
    <div className="just-good-scroller">
      <h2> { label || 'Just Good Playlists' } </h2>
      {playlists?.length ? (
        <div className="just-good-scroll-container">
          <HorizontalScrollView>
            {playlists?.map((playlist) => (
              <button
                key={playlist.id}
                type="button"
                className="horizontal-menu-item d-block"
                onClick={() => navigate(deepDiver(playlist.id, view))}>
                {playlist.artistImg && <Image className="just-good-scroller-image" src={playlist.artistImg} alt="test" large />}
                <p> {playlist.name} </p>
              </button>
            ))}
          </HorizontalScrollView>
        </div>
      ) : <div className="d-flex align-items-center m-3"> <i>{ emptyLabel }</i> </div>}
    </div>
  );
};

export default JustGoodScroller;
