import { Close } from '@mui/icons-material';
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
import { useEffect, useState } from 'react';
import { useAppStore } from '../context/AppContext';
import { EventService } from '../services/events';
import type { Event, EventCreate } from '../types';

type FormData = EventCreate & {
  participant_input: string;
};


type EventModalProps =
  {
    open: boolean;
    onClose: () => void;
    eventData?: Event;
    edit?: boolean;
  }

export default function CreateEventModal({ open, onClose, edit, eventData }: EventModalProps) {
  const [loading, setAppState] = useAppStore((state) => state.loading);
  const [previousEvents] = useAppStore((state) => state.events);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
    participant_emails: [],
    participant_input: '',
  });

  useEffect(() => {
    if (edit && eventData) {
      setFormData({
        title: eventData.title,
        description: eventData.description,
        start_time: new Date(new Date(eventData.start_time).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
        end_time: new Date(new Date(eventData.end_time).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
        location: eventData.location,
        participant_emails: eventData.participants.map(p => p.user.email),
        participant_input: '',
      });
    }
  }, [edit, eventData]);

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
      setFormData({
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        location: '',
        participant_emails: [],
        participant_input: '',
      });
      onClose();
    } catch (error) {
      setAppState({ error: 'Failed to create event' });
    } finally {
      setAppState({ loading: false })
    };
  }
  return (
    <Modal
      open={open}
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
              <Typography variant="h6">Create New Event</Typography>
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
              />

              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={handleChange('description')}
                margin="normal"
                multiline
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
              />

              <TextField
                fullWidth
                label="Location"
                value={formData.location}
                onChange={handleChange('location')}
                margin="normal"
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
              />

              {formData.participant_emails.length > 0 && (
                <Box>
                  {formData.participant_emails.map((email) => (
                    <Chip
                      key={email}
                      label={email}
                      onDelete={() => removeParticipant(email)}
                      size="small"
                    />
                  ))}
                </Box>
              )}

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
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Modal>
  );
}
