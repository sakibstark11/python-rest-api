import { Box, Typography } from '@mui/material';
import { useEffect } from 'react';
import { useAppStore } from '../context/AppContext';
import { EventService } from '../services/events';

export default function WeeklyEvents() {
  const [{ events }, setAppState] = useAppStore((state) => state);

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

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const weekEvents = await EventService.getEvents(
          startDate.toISOString(),
          endDate.toISOString()
        );

        console.log('Fetched events:', weekEvents);
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

      {events.length === 0 ? (
        <Typography color="text.secondary">
          No events this week.
        </Typography>
      ) : (
        <Box>
          {events.map((event) => (
            <Box key={event.id} p={2} border={1} borderColor="grey.300" borderRadius={1} mb={2}>
              <Typography variant="h6">{event.title}</Typography>
              <Typography variant="body2">
                {new Date(event.start_time).toLocaleString()} - {new Date(event.end_time).toLocaleString()}
              </Typography>
              {event.description && (
                <Typography variant="body2">{event.description}</Typography>
              )}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
