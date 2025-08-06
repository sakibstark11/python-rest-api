import { Add } from '@mui/icons-material';
import { Fab, useTheme } from '@mui/material';
import moment from 'moment';
import { useCallback, useEffect, useState } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import { useStore } from './hooks/useStore';
import { useSnackBar } from './hooks/useSnackBar';
import { eventService } from '../services/events';
import { authService } from '../services/auth';
import { SSEClient } from '../services/sse';
import type { Event } from '../types';
import { SSEEventType } from '../types';
import EventModal from './Event';
import './styles/calendar.scss';
import logger from '../utils/logger';

const localizer = momentLocalizer(moment);
const defaultView = Views.WEEK;

const today = new Date();
let currentStartDate: Date = moment(today).startOf(defaultView).toDate();
let currentEndDate: Date = moment(today).endOf(defaultView).toDate();

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


export default function WeeklyEvents() {
  const [events, setAppState] = useStore(state => state.events);
  const [userId] = useStore(state => state.user?.id);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | undefined>();
  const theme = useTheme();
  const { showSuccess, showInfo, showError } = useSnackBar();


  const shouldFetchEvents = (centerDate: Date, view: typeof Views.DAY | typeof Views.MONTH | typeof Views.WEEK) => {
    const start = moment(centerDate).startOf(view).toDate();
    const end = moment(centerDate).endOf(view).toDate();

    if (start >= currentStartDate && end <= currentEndDate) {
      return false;
    }
    currentStartDate = start;
    currentEndDate = end;

    return true;
  };

  const fetchEventsInRange = useCallback(async(start: Date, end: Date) => {
    try {
      setAppState({ loading: true });

      const result = await eventService.getEvents(
        moment(start).toISOString(),
        moment(end).toISOString(),
      );

      setAppState({ events: result });
    } catch (error) {
      logger.error({ message: 'Failed to fetch events', error });
      setAppState({ error: 'Failed to fetch events' });
    }
    finally {
      setAppState({ loading: false });
    }
  }, [setAppState]);

  useEffect(() => {
    fetchEventsInRange(currentStartDate, currentEndDate);
  }, [fetchEventsInRange]);

  useEffect(() => {
    const abortController = new AbortController();
    const client = new SSEClient('/sse/events', authService.getApi(), abortController);

    const run = async() => {
      try {
        for await (const message of client) {
          switch (message.type) {
            case SSEEventType.CONNECTED:
              setAppState({ sseConnection: true });
              showSuccess('Connected for updates');
              break;

            case SSEEventType.EVENT_UPDATED:
              setAppState((prevState) => ({
                events: handleEventUpdate(prevState.events, message.data),
              }));
              showInfo(`Event "${message.data.title}" was updated`);
              break;

            case SSEEventType.EVENT_INVITE_SENT:
              setAppState((prevState) => ({
                events: handleEventUpdate(prevState.events, message.data),
              }));
              showSuccess(`You were invited to "${message.data.title}"`);
              break;

            case SSEEventType.EVENT_RESPONSE_UPDATED:
              setAppState((prevState) => ({
                events: handleEventUpdate(prevState.events, message.data),
              }));
              showInfo(`Response updated for "${message.data.title}"`);
              break;

            case SSEEventType.EVENT_DELETED:
              setAppState((prevState) => ({
                events: handleEventDelete(prevState.events, message.data.id),
              }));
              showInfo(`Event "${message.data.title}" was deleted`);
              break;

            default:
              showError('Unknown SSE event type');
          }
        }
      } catch (_e) {
        setAppState({ sseConnection: false });
        showError('Connection lost. Please refresh to reconnect.');
      }
    };

    run();

    return () => {
      client.disconnect();
      setAppState({ sseConnection: false });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    root.style.setProperty('--mui-palette-primary-main', theme.palette.primary.main);
    root.style.setProperty('--mui-palette-primary-dark', theme.palette.primary.dark);
    root.style.setProperty('--mui-palette-primary-light', theme.palette.primary.light);
    root.style.setProperty('--mui-palette-primary-contrastText', theme.palette.primary.contrastText);
    root.style.setProperty('--mui-palette-success-main', theme.palette.success.main);
    root.style.setProperty('--mui-palette-background-default', theme.palette.background.default);
    root.style.setProperty('--mui-palette-background-paper', theme.palette.background.paper);
    root.style.setProperty('--mui-palette-text-primary', theme.palette.text.primary);
    root.style.setProperty('--mui-palette-text-secondary', theme.palette.text.secondary);
    root.style.setProperty('--mui-palette-text-disabled', theme.palette.text.disabled);
    root.style.setProperty('--mui-calendar-border', theme.palette.mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[200]);
    root.style.setProperty('--mui-palette-action-hover', theme.palette.action.hover);
    root.style.setProperty('--mui-palette-action-selected', theme.palette.action.selected);
    root.style.setProperty('--mui-palette-action-disabledBackground', theme.palette.action.disabledBackground);
    root.style.setProperty('--mui-shape-borderRadius', `${theme.shape.borderRadius}px`);
    root.style.setProperty('--mui-typography-fontFamily', String(theme.typography.fontFamily));
    root.style.setProperty('--mui-typography-fontWeightMedium', String(theme.typography.fontWeightMedium));
  }, [theme]);

  const calendarEvents = events.map(event => ({
    id: event.id,
    title: event.title,
    start: new Date(event.start_time),
    end: new Date(event.end_time),
    resource: event,
  }));

  return (
    <>
      <Calendar
        localizer={localizer}
        events={calendarEvents}
        startAccessor="start"
        endAccessor="end"
        defaultView={defaultView}
        views={[Views.WEEK, Views.DAY, Views.MONTH]}
        showMultiDayTimes
        step={60}
        toolbar
        style={{ height: 'calc(100vh - 64px - 32px)', width: '100%', overflow: 'auto' }}
        onNavigate={(date, view) => {
          if (view !== Views.AGENDA && view !== Views.WORK_WEEK) {
            if (shouldFetchEvents(date, view)) {
              fetchEventsInRange(currentStartDate, currentEndDate);
            }
          }
        }}
        onSelectEvent={event => {
          setModalOpen(true);
          setSelectedEvent(event.resource);
        }}
      />

      <Fab
        color="primary"
        aria-label="add event"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setModalOpen(true)}
      >
        <Add />
      </Fab>

      {modalOpen && (
        <EventModal
          onClose={() => {
            setModalOpen(false);
            setSelectedEvent(undefined);
          }}
          eventData={selectedEvent}
          edit={selectedEvent && selectedEvent.creator_id === userId}
        />
      )}
    </>
  );
}
