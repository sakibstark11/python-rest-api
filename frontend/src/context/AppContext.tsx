import type { Event, User } from '../types';
import createFastContext from './createFastContext';

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

const { Provider, useStore } = createFastContext(initialState);

export const AppProvider = Provider;

export const useAppStore = useStore;
