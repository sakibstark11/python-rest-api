import type React from 'react';
import { Store, StoreContext, initialState } from '../utils/fastContext';

export default function AppContext({ children }: { children: React.ReactNode }) {
  return (
    <StoreContext.Provider value={Store(initialState)}>
      {children}
    </StoreContext.Provider>
  );
}
