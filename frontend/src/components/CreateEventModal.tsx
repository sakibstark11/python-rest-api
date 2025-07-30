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
import { useState } from 'react';
import { useAppStore } from '../context/AppContext';
import { EventService } from '../services/events';
import type { EventCreate } from '../types';

type FormData = EventCreate & {
  participant_input: string;
};

interface CreateEventModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateEventModal({ open, onClose }: CreateEventModalProps) {
  const [, setAppState] = useAppStore((state) => state);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
    participant_emails: [],
    participant_input: '',
  });
  const [loading, setLoading] = useState(false);

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
    setLoading(true);

    try {

      const { participant_input, ...eventData } = formData;
      await EventService.createEvent(eventData);

      const now = new Date();
      const dayOfWeek = now.getUTCDay();
      const diff = now.getUTCDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const monday = new Date(now);
      monday.setUTCDate(diff);
      monday.setUTCHours(0, 0, 0, 0);

      const sunday = new Date(monday);
      sunday.setUTCDate(monday.getUTCDate() + 6);
      sunday.setUTCHours(23, 59, 59, 999);

      const updatedEvents = await EventService.getEvents(
        monday.toISOString(),
        sunday.toISOString()
      );

      setAppState({ events: updatedEvents });

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
      setLoading(false);
    }
  };

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
                  {loading ? 'Creating...' : 'Create Event'}
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
