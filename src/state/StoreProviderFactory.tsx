import React, { useContext } from 'react';

/*
 * This function returns a StoreProvider component that provides a
 * store of the given type to all of its children components. The
 * useStore react hook can be used to access this store from any
 * child function components.
 *
 * This is not meant to be used to replace libraries like redux/mobx,
 * but to provide a more lightweight way to share state amongst components.
 */
export default function createStoreProvider<T>() {
  const context = React.createContext<T>({} as any);

  const StoreProvider = ({ store, children }: { store: any, children: JSX.Element }) => {
    return (
      <context.Provider value={store}>
        { children }
      </context.Provider>
    );
  };

  const useStore = (): T => useContext(context);

  return { StoreProvider, useStore };
}
