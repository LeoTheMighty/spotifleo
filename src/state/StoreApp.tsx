import React from 'react';
import useSpotifyStore from './SpotifyStore';
import { StoreProvider } from './SpotifyStoreProvider';

type Props = {
  children: JSX.Element;
};

const StoreApp = ({ children }: Props) => {
  const store = useSpotifyStore();

  return (
    <StoreProvider store={store}>
      { children }
    </StoreProvider>
  );
};

export default StoreApp;
