import { useRef, useCallback, createContext } from 'react';
import type { User, Event } from '../types';

export type AppState = {
  user: User | null;
  events: Event[];
  loading: boolean;
  error: string | null;
  accessToken: string | null;
};

export const initialState: AppState = {
  user: null,
  events: [],
  loading: false,
  error: null,
  accessToken: null,
};

type StoreApi = {
  get: () => AppState;
  set: (value: Partial<AppState>) => void;
  subscribe: (callback: () => void) => () => void;
};

export const StoreContext = createContext<StoreApi | null>(null);

export function Store<Store>(initialState: Store): {
  get: () => Store;
  set: (value: Partial<Store>) => void;
  subscribe: (callback: () => void) => () => void;
} {
  const storeRef = useRef(initialState);
  const subscribersRef = useRef(new Set<() => void>());

  const get = useCallback(() => storeRef.current, []);

  const set = useCallback((value: Partial<AppState>) => {
    storeRef.current = { ...storeRef.current, ...value };
    subscribersRef.current.forEach((callback) => callback());
  }, []);

  const subscribe = useCallback((callback: () => void) => {
    subscribersRef.current.add(callback);
    return () => subscribersRef.current.delete(callback);
  }, []);

  return {
    get,
    set,
    subscribe,
  };
}
