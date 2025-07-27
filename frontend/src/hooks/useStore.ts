import { useEffect, useState } from 'react';
import type { AppState, AppActions } from '../store';
import { store } from '../store';

export const useStore = (): [AppState, AppActions] => {
  const [state, setState] = useState(store.getState());

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setState(store.getState());
    });

    return unsubscribe;
  }, []);

  return [state, store.actions];
};