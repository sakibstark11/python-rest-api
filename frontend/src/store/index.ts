import type { Event, User } from '../types';

export type AppState = {
  user: User | null;
  events: Event[];
  loading: boolean;
  error: string | null;
}

export type AppActions = {
  setUser: (user: User | null) => void;
  setEvents: (events: Event[]) => void;
  addEvent: (event: Event) => void;
  updateEvent: (eventId: string, event: Event) => void;
  removeEvent: (eventId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

class Store {
  private state: AppState = {
    user: null,
    events: [],
    loading: false,
    error: null,
  };

  private listeners: Array<() => void> = [];

  getState(): AppState {
    return { ...this.state };
  }

  setState(newState: Partial<AppState>): void {
    this.state = { ...this.state, ...newState };
    this.notifyListeners();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  // Actions
  actions: AppActions = {
    setUser: (user: User | null) => {
      this.setState({ user });
    },

    setEvents: (events: Event[]) => {
      this.setState({ events });
    },

    addEvent: (event: Event) => {
      this.setState({
        events: [...this.state.events, event]
      });
    },

    updateEvent: (eventId: string, event: Event) => {
      this.setState({
        events: this.state.events.map(e =>
          e.id === eventId ? event : e
        )
      });
    },

    removeEvent: (eventId: string) => {
      this.setState({
        events: this.state.events.filter(e => e.id !== eventId)
      });
    },

    setLoading: (loading: boolean) => {
      this.setState({ loading });
    },

    setError: (error: string | null) => {
      this.setState({ error });
    },

    clearError: () => {
      this.setState({ error: null });
    },
  };
}

export const store = new Store();
