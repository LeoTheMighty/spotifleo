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
      <p> <h2> { label || 'Just Good Playlists' } </h2> </p>
      {playlists?.length ? (
        <HorizontalScrollView>
          {playlists?.map((playlist) => (
            <button
              type="button"
              className="horizontal-menu-item d-block"
              onClick={() => navigate(deepDiver(playlist.id, view))}>
              {playlist.artistImg && <Image className="just-good-scroller-image" src={playlist.artistImg} alt="test" large />}
              <p> {playlist.name} </p>
            </button>
          ))}
          {/*<LoadingIndicator onView={() => alert('viewed')} />*/}
        </HorizontalScrollView>
      ) : <div className="d-flex align-items-center h-100"> <i>{ emptyLabel }</i> </div>}
    </div>
  );
};

export default JustGoodScroller;
