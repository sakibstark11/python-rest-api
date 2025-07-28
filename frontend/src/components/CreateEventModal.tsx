import { Close } from '@mui/icons-material';
import {
  Box,
  Button,
  IconButton,
  Modal,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useAppStore } from '../context/AppContext';
import { EventService } from '../services/events';
import type { EventCreate } from '../types';

interface CreateEventModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateEventModal({ open, onClose }: CreateEventModalProps) {
  const [, setAppState] = useAppStore((state) => state);
  const [formData, setFormData] = useState<EventCreate>({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
    participant_emails: [],
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof EventCreate) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await EventService.createEvent(formData);

      // Refresh events list
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

      // Reset form and close modal
      setFormData({
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        location: '',
        participant_emails: [],
      });
      onClose();
    } catch (error) {
      setAppState({ error: 'Failed to create event' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90%', sm: 400 },
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">Create New Event</Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>

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
      </Box>
    </Modal>
  );
}
