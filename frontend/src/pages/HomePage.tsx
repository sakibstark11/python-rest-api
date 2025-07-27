import {
  Add as AddIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Fab,
  Grid,
  Typography
} from '@mui/material';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../hooks/useStore';
import { EventService } from '../services/events';
import type { Event } from '../types';

const EventCard = ({ event }: { event: Event }) => {
  const navigate = useNavigate();
  const [state] = useStore();

  const isCreator = event.creator_id === state.user?.id;
  const userParticipation = event.participants.find(p => p.user.id === state.user?.id);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'success';
      case 'declined': return 'error';
      case 'invited': return 'warning';
      default: return 'default';
    }
  };

  const formatDateTime = (dateTime: string) => {
    return dayjs(dateTime).format('MMM DD, YYYY h:mm A');
  };

  return (
    <Card
      sx={{
        height: '100%',
        cursor: userParticipation ? 'pointer' : 'default',
        '&:hover': {
          boxShadow: userParticipation ? 3 : 1,
        }
      }}
      onClick={() => {
        if (userParticipation) {
          navigate(`/events/${event.id}/respond`);
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" component="h2" sx={{ flexGrow: 1 }}>
            {event.title}
          </Typography>
          {isCreator && (
            <Chip label="Creator" size="small" color="primary" />
          )}
          {userParticipation && (
            <Chip
              label={userParticipation.status}
              size="small"
              color={getStatusColor(userParticipation.status) as 'success' | 'error' | 'warning' | 'default'}
            />
          )}
        </Box>

        {event.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {event.description}
          </Typography>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <TimeIcon sx={{ mr: 1, fontSize: 16 }} color="action" />
          <Typography variant="body2">
            {formatDateTime(event.start_time)} - {formatDateTime(event.end_time)}
          </Typography>
        </Box>

        {event.location && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <LocationIcon sx={{ mr: 1, fontSize: 16 }} color="action" />
            <Typography variant="body2">
              {event.location}
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
          <PersonIcon sx={{ mr: 1, fontSize: 16 }} color="action" />
          <Typography variant="body2">
            {event.participants.length} participant{event.participants.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export const HomePage = () => {
  const [state, actions] = useStore();
  const navigate = useNavigate();
  const [initialLoad, setInitialLoad] = useState(true);

  const loadEvents = async () => {
    try {
      const events = await EventService.getEvents();
      actions.setEvents(events);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      const errorMessage = err.response?.data?.error?.message || 'Failed to load events';
      actions.setError(errorMessage);
    }
  }

  // Load events on component mount with loading state
  useEffect(() => {
    actions.setLoading(true);
    loadEvents();
    actions.setLoading(false);
    setInitialLoad(false);
  }, []);


  // Separate events by time
  const now = dayjs();
  const upcomingEvents = state.events.filter(event => dayjs(event.start_time).isAfter(now));
  const pastEvents = state.events.filter(event => dayjs(event.start_time).isBefore(now));

  if (state.loading && initialLoad) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          My Events
        </Typography>
      </Box>

      {state.error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={actions.clearError}>
          {state.error}
        </Alert>
      )}

      {state.events.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No events yet
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Create your first event to get started
          </Typography>
        </Box>
      ) : (
        <>
          {/* Upcoming Events */}
          {upcomingEvents.length > 0 && (
            <Box mb={4}>
              <Typography variant="h5" component="h2" gutterBottom>
                Upcoming Events ({upcomingEvents.length})
              </Typography>
              <Grid container spacing={3}>
                {upcomingEvents.map((event) => (
                  <Grid item xs={12} sm={6} lg={4} key={event.id}>
                    <EventCard event={event} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Past Events */}
          {pastEvents.length > 0 && (
            <Box>
              <Typography variant="h5" component="h2" gutterBottom>
                Past Events ({pastEvents.length})
              </Typography>
              <Grid container spacing={3}>
                {pastEvents.map((event) => (
                  <Grid item xs={12} sm={6} lg={4} key={event.id}>
                    <EventCard event={event} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </>
      )}

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="create event"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
        onClick={() => navigate('/events/create')}
      >
        <AddIcon />
      </Fab>
    </Container>
  );
};
