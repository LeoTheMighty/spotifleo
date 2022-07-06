import React from 'react';
import { useStore } from '../state/SpotifyStoreProvider';

/*

Handles the on-boarding process. First you load all of the albums for the artist. Then allow the user
to both toggle them on and off as well as drag and drop them around each other.

Give sort options for chronological, split singles/eps and albums, and filter options for albums, singles, and eps.
*/

type Props = {

};

const DeepDiveCreator = () => {
  const store = useStore();

  return (
    <div>

    </div>
  );
};

export default DeepDiveCreator;
