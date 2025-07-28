import { Add } from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Fab,
  Grid,
  Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useAppStore } from '../context/AppContext';
import { EventService } from '../services/events';
import type { Event } from '../types';
import CreateEventModal from './CreateEventModal';

export default function WeeklyEvents() {
  const [{ events }, setAppState] = useAppStore((state) => state);
  const [modalOpen, setModalOpen] = useState(false);

  const getWeekStart = () => {
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const diff = now.getUTCDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(now);
    monday.setUTCDate(diff);
    monday.setUTCHours(0, 0, 0, 0);
    return monday;
  };

  const getWeekEnd = () => {
    const weekStart = getWeekStart();
    const sunday = new Date(weekStart);
    sunday.setUTCDate(weekStart.getUTCDate() + 6);
    sunday.setUTCHours(23, 59, 59, 999);
    return sunday;
  };

  const startDate = getWeekStart();
  const endDate = getWeekEnd();

  // Generate array of 7 days for the current week
  const getWeekDays = () => {
    const monday = getWeekStart();
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(monday);
      day.setUTCDate(monday.getUTCDate() + i);
      return day;
    });
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date): Event[] => {
    return events.filter(event => {
      const eventDate = new Date(event.start_time);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const weekDays = getWeekDays();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const weekEvents = await EventService.getEvents(
          startDate.toISOString(),
          endDate.toISOString()
        );

        setAppState({ events: weekEvents });

      } catch (error) {
        setAppState({
          error: 'Failed to fetch events'
        });
      }
    };

    fetchEvents();
  }, []);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        This Week's Events ({getWeekStart().toLocaleDateString()} - {getWeekEnd().toLocaleDateString()})
      </Typography>

      <Grid container spacing={2}>
        {weekDays.map((day, index) => {
          const dayEvents = getEventsForDate(day);
          const isToday = day.toDateString() === new Date().toDateString();

          return (
            <Grid size={{
              xs: 12,
              sm: 6,
              md: 4,
              lg: 3

            }} key={day.toISOString()}>
              <Card
                sx={{
                  minHeight: 200,
                  bgcolor: isToday ? 'primary.light' : 'background.paper',
                  border: isToday ? 2 : 1,
                  borderColor: isToday ? 'primary.main' : 'divider'
                }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {isToday && ' (Today)'}
                  </Typography>

                  <Box mt={2}>
                    {dayEvents.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" fontStyle="italic">
                        No events
                      </Typography>
                    ) : (
                      dayEvents.map((event) => (
                        <Chip
                          key={event.id}
                          label={event.title}
                          size="small"
                          sx={{
                            mb: 1,
                            mr: 1,
                            display: 'block',
                            width: 'fit-content'
                          }}
                          color="primary"
                        />
                      ))
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add event"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
        onClick={() => setModalOpen(true)}
      >
        <Add />
      </Fab>

      {/* Create Event Modal */}
      <CreateEventModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </Box>
  );
}
