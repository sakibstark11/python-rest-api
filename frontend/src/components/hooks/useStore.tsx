import { useContext, useSyncExternalStore } from 'react';
import type { AppState } from '../../utils/fastContext';
import { initialState, StoreContext } from '../../utils/fastContext';

export function useStore<SelectorOutput>(
  selector: (store: AppState) => SelectorOutput
): [SelectorOutput, (value: Partial<AppState> | ((prevState: AppState) => Partial<AppState>)) => void];
export function useStore(): [(value: Partial<AppState> | ((prevState: AppState) => Partial<AppState>)) => void];
export function useStore<SelectorOutput>(
  selector?: (store: AppState) => SelectorOutput,
): [SelectorOutput, (value: Partial<AppState> | ((prevState: AppState) => Partial<AppState>)) => void] | [(value: Partial<AppState> | ((prevState: AppState) => Partial<AppState>)) => void] {
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
