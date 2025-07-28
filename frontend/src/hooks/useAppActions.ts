import { useCallback } from 'react';
import { useAppStore } from '../context/AppContext';
import type { Event, User } from '../types';

export const useAppActions = () => {
  const [, setState] = useAppStore((state) => state);

  const setUser = useCallback((user: User | null) => {
    setState({ user });
  }, [setState]);

  const setEvents = useCallback((events: Event[]) => {
    setState({ events });
  }, [setState]);

  // For array operations, components should pass current state
  const addEvent = useCallback((event: Event, currentEvents: Event[]) => {
    setState({ events: [...currentEvents, event] });
  }, [setState]);

  const updateEvent = useCallback((eventId: string, event: Event, currentEvents: Event[]) => {
    setState({
      events: currentEvents.map(e => e.id === eventId ? event : e)
    });
  }, [setState]);

  const removeEvent = useCallback((eventId: string, currentEvents: Event[]) => {
    setState({
      events: currentEvents.filter(e => e.id !== eventId)
    });
  }, [setState]);

  const setLoading = useCallback((loading: boolean) => {
    setState({ loading });
  }, [setState]);

  const setError = useCallback((error: string | null) => {
    setState({ error });
  }, [setState]);

  const clearError = useCallback(() => {
    setState({ error: null });
  }, [setState]);

  return {
    setUser,
    setEvents,
    addEvent,
    updateEvent,
    removeEvent,
    setLoading,
    setError,
    clearError,
  };
};