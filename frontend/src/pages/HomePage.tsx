import { useEffect } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import WeeklyEvents from '../components/Events';
import { AuthService } from '../services/auth';
import { useStore } from '../components/hooks/useStore';
import type { Event } from '../types';
import logger from '../utils/logger';

function handleEventUpdate(events: Event[], updatedEvent: Event): Event[] {
  const existingIndex = events.findIndex(event => event.id === updatedEvent.id);
  
  if (existingIndex >= 0) {
    const newEvents = [...events];
    newEvents[existingIndex] = updatedEvent;
    return newEvents;
  }
  return [...events, updatedEvent];
}

function handleEventDelete(events: Event[], eventId: string): Event[] {
  return events.filter(event => event.id !== eventId);
}

export default function HomePage() {
  const [_,setState] = useStore(state => state.events);

  useEffect(() => {
    const token = AuthService.getToken();
    if (!token) return;

    const baseURL = import.meta.env.VITE_API_BASE_URL;
    const controller = new AbortController();

    fetchEventSource(`${baseURL}/sse/events`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      signal: controller.signal,

      onmessage(event) {
        try {
          const message = JSON.parse(event.data);
          
          switch (message.type) {
            case 'connected':
              logger.info('connected');
              break;
            
            case 'event_updated':
            case 'event_invite_sent':
            case 'event_response_updated':
              setState((prevState) => ({ 
                events: handleEventUpdate(prevState.events, message.data),
              }));
              break;
              
            case 'event_deleted':
              setState((prevState) => ({ 
                events: handleEventDelete(prevState.events, message.data.id),
              }));
              break;
              
            default:
              logger.error({ type: message.type },'Unknown SSE event type');
          }
        } catch (error) {
          logger.error({ error }, 'sse updates failed');
        }
      },
      onerror(error) {
        logger.error({ error }, 'sse updates failed');
      },
    });

    return () => {
      controller.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <WeeklyEvents />
    </>
  );
}
