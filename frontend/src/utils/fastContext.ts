export function store<Store>(initialState: Store): {
  get: () => Store;
  set: (value: Partial<Store>) => void;
  subscribe: (callback: () => void) => () => void;
} {
  const store = { current: initialState };

  const get = () => store.current;

  const subscribers = new Set<() => void>();

  const set = (value: Partial<Store>) => {
    store.current = { ...store.current, ...value };
    subscribers.forEach((callback) => callback());
  };

  const subscribe = (callback: () => void) => {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
  };

  return {
    get,
    set,
    subscribe,
  };
}
