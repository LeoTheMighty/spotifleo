import { SpotifyStore } from './SpotifyStore';
import createStoreProvider from './StoreProviderFactory';

const { StoreProvider, useStore } = createStoreProvider<SpotifyStore>();

export { StoreProvider, useStore };
