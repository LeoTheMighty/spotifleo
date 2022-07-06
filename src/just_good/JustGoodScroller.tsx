import React from 'react';
import HorizontalScrollView from '../components/HorizontalScrollView';
import LoadingIndicator from '../common/LoadingIndicator';
import { CachedJustGoodPlaylist } from '../types';
import { useNavigate } from 'react-router-dom';

type Props = {
  label?: string;
  emptyLabel?: string;
  playlists?: CachedJustGoodPlaylist[];
}

const JustGoodScroller = ({ label, emptyLabel, playlists }: Props) => {
  const navigate = useNavigate();

  return (
    <div className="just-good-scroller">
      <p> { label || 'Just Good Playlists' } </p>
      {playlists?.length ? (
        <HorizontalScrollView>
          {playlists?.map((playlist) => (
            <button type="button" className="horizontal-menu-item d-block" onClick={() => navigate({ pathname: '/spotifleo/deepdiver', search: `?playlist_id=${playlist.id}`})}>
              {playlist.artistImg && <img className="just-good-scroller-image" src={playlist.artistImg.large} alt="test" />}
              <p> {playlist.name} </p>
            </button>
          ))}
          <LoadingIndicator onView={() => alert('viewed')} />
        </HorizontalScrollView>
      ) : emptyLabel}
    </div>
  );
};

export default JustGoodScroller;
