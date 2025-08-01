import { Add } from '@mui/icons-material';
import { Box, Fab, useTheme } from '@mui/material';
import moment from 'moment';
import { useEffect, useState } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import { useAppStore } from '../context/AppContext';
import { EventService } from '../services/events';
import type { Event } from '../types';
import EventModal from './Event';
import './styles/calendar.scss';

const localizer = momentLocalizer(moment);

export default function WeeklyEvents() {
  const [events, setAppState] = useAppStore(state => state.events);
  const [userId] = useAppStore(state => state.user?.id);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | undefined>();
  const theme = useTheme();

  const defaultView = Views.WEEK;

  const fetchEventsInRange = async (centerDate: Date,
    view: typeof Views.DAY | typeof Views.MONTH | typeof Views.WEEK) => {
    const start = moment(centerDate).startOf(view).toISOString();
    const end = moment(centerDate).endOf(view).toISOString();
    try {
      const result = await EventService.getEvents(start, end);
      setAppState({ events: result });
    } catch {
      setAppState({ error: 'Failed to fetch events' });
    }
  };

  useEffect(() => {
    const defaultDate = new Date();
    fetchEventsInRange(defaultDate, defaultView);
  }, []);

  const calendarEvents = events.map(event => ({
    id: event.id,
    title: event.title,
    start: new Date(event.start_time),
    end: new Date(event.end_time),
    resource: event
  }));

  return (
    <>
      <Box
        sx={{
          width: '100%',
          height: 'calc(100vh - 64px - 32px)',
          display: 'flex',
          '--mui-palette-background-paper': theme.palette.background.paper,
          '--mui-palette-background-default': theme.palette.background.default,
          '--mui-palette-text-primary': theme.palette.text.primary,
          '--mui-palette-text-secondary': theme.palette.text.secondary,
          '--mui-palette-text-disabled': theme.palette.text.disabled,
          '--mui-palette-primary-main': theme.palette.primary.main,
          '--mui-palette-primary-dark': theme.palette.primary.dark,
          '--mui-palette-primary-light': theme.palette.primary.light,
          '--mui-palette-primary-contrastText': theme.palette.primary.contrastText,
          '--mui-palette-primary-main-alpha50': `${theme.palette.primary.main}80`,
          '--mui-palette-success-main': theme.palette.success.main,
          '--mui-palette-action-hover': theme.palette.action.hover,
          '--mui-palette-action-selected': theme.palette.action.selected,
          '--mui-palette-action-disabledBackground': theme.palette.action.disabledBackground,
          '--mui-palette-divider': theme.palette.divider,
          '--mui-shape-borderRadius': `${theme.shape.borderRadius}px`,
          '--mui-spacing-1': theme.spacing(0.5),
          '--mui-spacing-2': theme.spacing(1),
          '--mui-typography-fontFamily': theme.typography.fontFamily,
          '--mui-typography-fontWeightMedium': theme.typography.fontWeightMedium,
        }}
      >
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
          style={{ height: '100%', width: '100%', overflow: 'auto' }}
          // onNavigate={(date) => {
          //   fetchEventsInRange(date, defaultView);
          // }}
          onSelectEvent={event => {
            setModalOpen(true);
            setSelectedEvent(event.resource);
          }}
        />
      </Box>

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
