import React, { createContext, useContext, useSyncExternalStore } from 'react';
import type { Event, User } from '../types';
import { store } from '../utils/fastContext';

export type AppState = {
  user: User | null;
  events: Event[];
  loading: boolean;
  error: string | null;
  accessToken: string | null;
};

const initialState: AppState = {
  user: null,
  events: [],
  loading: false,
  error: null,
  accessToken: null,
};

const fastContext = store(initialState);


type UseStoreDataReturnType = typeof fastContext

const StoreContext = createContext<UseStoreDataReturnType | null>(null);

export default function AppContext({ children }: { children: React.ReactNode }) {
  return (
    <StoreContext.Provider value={fastContext}>
      {children}
    </StoreContext.Provider>
  );
}



export function useStore<SelectorOutput>(
  selector: (store: AppState) => SelectorOutput
): [SelectorOutput, (value: Partial<AppState>) => void];
export function useStore(): [(value: Partial<AppState>) => void];
export function useStore<SelectorOutput>(
  selector?: (store: AppState) => SelectorOutput,
): [SelectorOutput, (value: Partial<AppState>) => void] | [(value: Partial<AppState>) => void] {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error('Store not found');
  }
  if (selector) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const state = useSyncExternalStore(
      store.subscribe,
      () => selector(store.get()),
      () => selector(initialState),
    );
    return [state, store.set];
  }
  return [store.set];
}
