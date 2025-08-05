import { useEffect } from 'react';
import WeeklyEvents from '../components/Events';
import { useStore } from '../components/hooks/useStore';
import { useSnackBar } from '../components/hooks/useSnackBar';
import type { Event } from '../types';
import { SSEEventType } from '../types';
import { connectSSE } from '../services/sse';

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
  const [setState] = useStore();
  const { showSuccess, showInfo, showError } = useSnackBar();

  useEffect(() => {
    setState({ sseConnection: true });
    showSuccess('Connected for updates');
    connectSSE('/sse/events', (message: any) => {
      switch (message.type) {
        case SSEEventType.EVENT_UPDATED:
          setState((prevState) => ({
            events: handleEventUpdate(prevState.events, message.data),
          }));
          showInfo(`Event "${message.data.title}" was updated`);
          break;
            
        case SSEEventType.EVENT_INVITE_SENT:
          setState((prevState) => ({ 
            events: handleEventUpdate(prevState.events, message.data),
          }));
          showSuccess(`You were invited to "${message.data.title}"`);
          break;
              
        case SSEEventType.EVENT_RESPONSE_UPDATED:
          setState((prevState) => ({ 
            events: handleEventUpdate(prevState.events, message.data),
          }));
          showInfo(`Response updated for "${message.data.title}"`);
          break;
              
        case SSEEventType.EVENT_DELETED:
          setState((prevState) => ({ 
            events: handleEventDelete(prevState.events, message.data.id),
          }));
          showInfo(`Event "${message.data.title}" was deleted`);
          break;
              
        default:
          showError(`Unknown SSE event type ${message.type}`);
      }
    });
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps  
  , []);

  return (
    <>
      <WeeklyEvents />
    </>
  );
}
