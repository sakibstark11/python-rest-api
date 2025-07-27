import { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Grid,
} from '@mui/material';
import { 
  CheckCircle as AcceptIcon,
  Cancel as DeclineIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { EventService } from '../services/events';
import { useStore } from '../hooks/useStore';
import type { Event } from '../types';

export const EventResponsePage = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [state, actions] = useStore();
  const [event, setEvent] = useState<Event | null>(null);
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    if (!eventId) {
      navigate('/');
      return;
    }

    const loadEvent = async () => {
      try {
        actions.setLoading(true);
        const eventData = await EventService.getEvent(eventId);
        setEvent(eventData);
      } catch (error: unknown) {
        const err = error as { response?: { data?: { error?: { message?: string } } } };
        const errorMessage = err.response?.data?.error?.message || 'Failed to load event';
        actions.setError(errorMessage);
        navigate('/');
      } finally {
        actions.setLoading(false);
      }
    };

    loadEvent();
  }, [eventId, navigate, actions]);

  const handleResponse = async (status: 'accepted' | 'declined') => {
    if (!eventId) return;

    setResponding(true);
    actions.clearError();

    try {
      await EventService.respondToEvent(eventId, status);
      
      // Update local event state
      if (event && state.user) {
        const updatedEvent = {
          ...event,
          participants: event.participants.map(p =>
            p.user.id === state.user?.id
              ? { ...p, status, responded_at: new Date().toISOString() }
              : p
          ),
        };
        setEvent(updatedEvent);
        
        // Update global events state
        actions.updateEvent(eventId, updatedEvent);
      }

      // Show success message
      const message = status === 'accepted' ? 'Event accepted!' : 'Event declined!';
      actions.setError(message); // Using error state for success message
      
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      const errorMessage = err.response?.data?.error?.message || 'Failed to respond to event';
      actions.setError(errorMessage);
    } finally {
      setResponding(false);
    }
  };

  const formatDateTime = (dateTime: string) => {
    return dayjs(dateTime).format('dddd, MMMM DD, YYYY [at] h:mm A');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'success';
      case 'declined': return 'error';
      case 'invited': return 'warning';
      default: return 'default';
    }
  };

  if (state.loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!event) {
    return (
      <Container>
        <Alert severity="error">
          Event not found
        </Alert>
      </Container>
    );
  }

  const userParticipation = event.participants.find(p => p.user.id === state.user?.id);
  const isCreator = event.creator_id === state.user?.id;

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Typography variant="h4" component="h1">
            {event.title}
          </Typography>
          {isCreator && (
            <Chip label="You created this event" color="primary" />
          )}
        </Box>

        {state.error && (
          <Alert 
            severity={state.error.includes('accepted') || state.error.includes('declined') ? 'success' : 'error'} 
            sx={{ mb: 3 }}
            onClose={actions.clearError}
          >
            {state.error}
          </Alert>
        )}

        {event.description && (
          <Typography variant="body1" sx={{ mb: 3 }}>
            {event.description}
          </Typography>
        )}

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TimeIcon sx={{ mr: 2 }} color="primary" />
              <Box>
                <Typography variant="h6">When</Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatDateTime(event.start_time)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  to {formatDateTime(event.end_time)}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {event.location && (
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocationIcon sx={{ mr: 2 }} color="primary" />
                <Box>
                  <Typography variant="h6">Where</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {event.location}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          )}
        </Grid>

        {/* Response Section */}
        {userParticipation && !isCreator && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Your Response
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Typography variant="body2">
                Current status:
              </Typography>
              <Chip 
                label={userParticipation.status} 
                color={getStatusColor(userParticipation.status) as 'success' | 'error' | 'warning' | 'default'}
                size="small"
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant={userParticipation.status === 'accepted' ? 'contained' : 'outlined'}
                color="success"
                startIcon={<AcceptIcon />}
                onClick={() => handleResponse('accepted')}
                disabled={responding || userParticipation.status === 'accepted'}
              >
                {responding && userParticipation.status !== 'accepted' ? 'Accepting...' : 'Accept'}
              </Button>
              <Button
                variant={userParticipation.status === 'declined' ? 'contained' : 'outlined'}
                color="error"
                startIcon={<DeclineIcon />}
                onClick={() => handleResponse('declined')}
                disabled={responding || userParticipation.status === 'declined'}
              >
                {responding && userParticipation.status !== 'declined' ? 'Declining...' : 'Decline'}
              </Button>
            </Box>
          </Box>
        )}

        {/* Participants Section */}
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <PersonIcon sx={{ mr: 1 }} />
            Participants ({event.participants.length})
          </Typography>
          
          {event.participants.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No participants yet
            </Typography>
          ) : (
            <List>
              {event.participants.map((participant, index) => (
                <Box key={participant.user.id}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar>
                        {participant.user.first_name[0]}{participant.user.last_name[0]}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${participant.user.first_name} ${participant.user.last_name}`}
                      secondary={participant.user.email}
                    />
                    <Chip 
                      label={participant.status} 
                      color={getStatusColor(participant.status) as 'success' | 'error' | 'warning' | 'default'}
                      size="small"
                    />
                  </ListItem>
                  {index < event.participants.length - 1 && <Divider variant="inset" component="li" />}
                </Box>
              ))}
            </List>
          )}
        </Box>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button variant="outlined" onClick={() => navigate('/')}>
            Back to Events
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};