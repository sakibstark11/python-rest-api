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
import moment from 'moment';
import { useState } from 'react';
import { useAppStore } from '../context/AppContext';
import { EventService } from '../services/events';
import { ParticipantStatus, type Event, type EventCreate } from '../types';

type FormData = EventCreate & {
  participant_input: string;
};

type EventModalProps =
  {
    onClose: () => void;
    eventData?: Event;
    edit?: boolean;
  }

const statusToChipMap = {
  accepted: 'success',
  declined: 'error',
  pending: 'warning',
  default: 'primary'
} as const

export default function CreateEventModal({ onClose, edit, eventData }: EventModalProps) {
  const [loading, setAppState] = useAppStore((state) => state.loading);
  const [previousEvents] = useAppStore((state) => state.events);
  const [currentUser] = useAppStore((state) => state.user);
  const [formData, setFormData] = useState<FormData>(() => ({
    title: eventData?.title || '',
    description: eventData?.description || '',
    start_time: eventData
      ? moment(eventData.start_time).local().format('YYYY-MM-DDTHH:mm')
      : '',
    end_time: eventData
      ? moment(eventData.end_time).local().format('YYYY-MM-DDTHH:mm')
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

  const handleResponse = async (
    status: typeof ParticipantStatus.ACCEPTED | typeof ParticipantStatus.DECLINED) => {
    if (!eventData) return;

    setAppState({ loading: true });

    try {
      await EventService.respondToEvent(eventData.id, status);

      const updatedEvents = previousEvents.map(event => {
        if (event.id === eventData.id) {
          return {
            ...event,
            participants: event.participants.map(p =>
              p.user.id === eventData.participants.find(part => part.status === ParticipantStatus.PENDING)?.user.id
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
        justifyContent: 'center',
        '&:focus': {
          outline: 'none'
        }
      }}
    >
      <Container maxWidth="sm" sx={{ outline: 'none' }}>
        <Card sx={{ outline: 'none' }}>
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
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
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
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
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
                  {formData.participant_emails.map((email) => {
                    const color = eventData?.participants?.find(p => p.user.email === email)?.status ?? 'default'
                    return <Chip
                      color={statusToChipMap[color]}
                      key={email}
                      label={email}
                      onDelete={() => removeParticipant(email)}
                      size="small"
                      disabled={responseMode}
                    />
                  })}
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
                      variant={userStatus === ParticipantStatus.ACCEPTED ? 'contained' : 'outlined'}
                      color="success"
                      startIcon={<Check />}
                      onClick={() => handleResponse(ParticipantStatus.ACCEPTED)}
                      disabled={loading || userStatus === ParticipantStatus.ACCEPTED}
                      fullWidth
                    >
                      {loading ? 'Responding...' : 'Accept'}
                    </Button>
                    <Button
                      variant={userStatus === ParticipantStatus.DECLINED ? 'contained' : 'outlined'}
                      color="error"
                      startIcon={<Clear />}
                      onClick={() => handleResponse(ParticipantStatus.DECLINED)}
                      disabled={loading || userStatus === ParticipantStatus.DECLINED}
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
