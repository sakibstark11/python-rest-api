import { Check, Clear, Close } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  IconButton,
  Modal,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useAppStore } from '../context/AppContext';
import { EventService } from '../services/events';
import type { Event, EventCreate } from '../types';

type FormData = EventCreate & {
  participant_input: string;
};


type EventModalProps =
  {
    onClose: () => void;
    eventData?: Event;
    edit?: boolean;
  }

export default function CreateEventModal({ onClose, edit, eventData }: EventModalProps) {
  const [loading, setAppState] = useAppStore((state) => state.loading);
  const [previousEvents] = useAppStore((state) => state.events);
  const [currentUser] = useAppStore((state) => state.user);
  const [formData, setFormData] = useState<FormData>(() => ({
    title: eventData?.title || '',
    description: eventData?.description || '',
    start_time: eventData
      ? new Date(new Date(eventData.start_time).getTime() - new Date().getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
      : '',
    end_time: eventData
      ? new Date(new Date(eventData.end_time).getTime() - new Date().getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
      : '',
    location: eventData?.location || '',
    participant_emails: eventData?.participants?.map(p => p.user.email) || [],
    participant_input: '',
  }));
  const responseMode = !edit && !!eventData

  const userParticipation = eventData?.participants?.find(p => p.user.id === currentUser?.id);
  const userStatus = userParticipation?.status;

  const getHeaderText = () => {
    if (edit) {
      return 'Edit Event'
    }
    if (responseMode) {
      return 'Respond to Event'
    }
    return 'Create New Event'
  }
  const handleResponse = async (status: 'accepted' | 'declined') => {
    if (!eventData) return;

    setAppState({ loading: true });

    try {
      await EventService.respondToEvent(eventData.id, status);

      const updatedEvents = previousEvents.map(event => {
        if (event.id === eventData.id) {
          return {
            ...event,
            participants: event.participants.map(p =>
              p.user.id === eventData.participants.find(part => part.status === 'pending')?.user.id
                ? { ...p, status, responded_at: new Date().toISOString() }
                : p
            )
          };
        }
        return event;
      });

      setAppState({ events: updatedEvents });
      onClose();
    } catch (error) {
      setAppState({ error: 'Failed to respond to event' });
    } finally {
      setAppState({ loading: false });
    }
  };

  const handleChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const removeParticipant = (emailToRemove: string) => {
    setFormData({
      ...formData,
      participant_emails: formData.participant_emails.filter(email => email !== emailToRemove)
    });
  };

  const handleParticipantKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const email = formData.participant_input.trim();
      if (email && !formData.participant_emails.includes(email)) {
        setFormData({
          ...formData,
          participant_emails: [...formData.participant_emails, email],
          participant_input: ''
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAppState({ loading: true });

    try {
      const { participant_input, ...rest } = formData;

      if (edit && eventData) {
        const updatedEvent = await EventService.updateEvent(eventData.id, rest);
        setAppState({
          events: previousEvents.map(event =>
            event.id === updatedEvent.id ? updatedEvent : event
          )
        });
      } else {
        const newEvent = await EventService.createEvent(rest);
        setAppState({ events: [...previousEvents, newEvent] });
      }
      onClose();
    } catch (error) {
      setAppState({ error: 'Failed to create event' });
    } finally {
      setAppState({ loading: false })
    };
  }

  return (
    <Modal
      open
      onClose={onClose}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Container maxWidth="sm">
        <Card>
          <CardContent>
            <Grid display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">{getHeaderText()}</Typography>
              <IconButton onClick={onClose}>
                <Close />
              </IconButton>
            </Grid>

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Event Title"
                value={formData.title}
                onChange={handleChange('title')}
                margin="normal"
                required
                disabled={responseMode}
              />

              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={handleChange('description')}
                margin="normal"
                multiline
                disabled={responseMode}
                rows={3}
              />

              <TextField
                fullWidth
                label="Start Time"
                type="datetime-local"
                value={formData.start_time}
                onChange={handleChange('start_time')}
                margin="normal"
                required
                InputLabelProps={{ shrink: true }}
                disabled={responseMode}
              />

              <TextField
                fullWidth
                label="End Time"
                type="datetime-local"
                value={formData.end_time}
                onChange={handleChange('end_time')}
                margin="normal"
                required
                InputLabelProps={{ shrink: true }}
                disabled={responseMode}
              />

              <TextField
                fullWidth
                label="Location"
                value={formData.location}
                onChange={handleChange('location')}
                margin="normal"
                disabled={responseMode}
              />

              <TextField
                fullWidth
                label="Add Participants"
                placeholder="Enter email and press Enter"
                value={formData.participant_input}
                onChange={handleChange('participant_input')}
                onKeyDown={handleParticipantKeyDown}
                margin="normal"
                type="email"
                disabled={responseMode}
              />

              {formData.participant_emails.length > 0 && (
                <Box>
                  {formData.participant_emails.map((email) => (
                    <Chip
                      key={email}
                      label={email}
                      onDelete={() => removeParticipant(email)}
                      size="small"
                      disabled={responseMode}
                    />
                  ))}
                </Box>
              )}

              {
                responseMode == false ?
                  <Box display="flex" gap={2} mt={3}>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading}
                      fullWidth
                    >
                      {loading ? `${edit ? 'Upda' : 'Crea'}ting...` : `${edit ? 'Update' : 'Create'} Event`}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={onClose}
                      disabled={loading}
                      fullWidth
                    >
                      Cancel
                    </Button>
                  </Box> :
                  <Box display="flex" gap={2} mt={3}>
                    <Button
                      variant={userStatus === 'accepted' ? 'contained' : 'outlined'}
                      color="success"
                      startIcon={<Check />}
                      onClick={() => handleResponse('accepted')}
                      disabled={loading || userStatus === 'accepted'}
                      fullWidth
                    >
                      {loading ? 'Responding...' : 'Accept'}
                    </Button>
                    <Button
                      variant={userStatus === 'declined' ? 'contained' : 'outlined'}
                      color="error"
                      startIcon={<Clear />}
                      onClick={() => handleResponse('declined')}
                      disabled={loading || userStatus === 'declined'}
                      fullWidth
                    >
                      {loading ? 'Responding...' : 'Decline'}
                    </Button>
                  </Box>
              }
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Modal>
  );
}
