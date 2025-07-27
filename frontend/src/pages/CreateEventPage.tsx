import { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Grid,
  Chip,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { EventService } from '../services/events';
import { useStore } from '../hooks/useStore';
import type { EventCreate } from '../types';

export const CreateEventPage = () => {
  const [state, actions] = useStore();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<EventCreate>({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
    participant_emails: [],
  });
  
  const [startTime, setStartTime] = useState<Dayjs | null>(dayjs().add(1, 'hour'));
  const [endTime, setEndTime] = useState<Dayjs | null>(dayjs().add(2, 'hour'));
  const [newEmail, setNewEmail] = useState('');
  const [errors, setErrors] = useState<Partial<EventCreate & { time: string; email: string }>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof EventCreate]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleStartTimeChange = (newValue: Dayjs | null) => {
    setStartTime(newValue);
    if (newValue) {
      setFormData(prev => ({
        ...prev,
        start_time: newValue.toISOString(),
      }));
      
      // Auto-adjust end time if it's before start time
      if (endTime && newValue.isAfter(endTime)) {
        const newEndTime = newValue.add(1, 'hour');
        setEndTime(newEndTime);
        setFormData(prev => ({
          ...prev,
          end_time: newEndTime.toISOString(),
        }));
      }
    }
    
    if (errors.time) {
      setErrors(prev => ({ ...prev, time: undefined }));
    }
  };

  const handleEndTimeChange = (newValue: Dayjs | null) => {
    setEndTime(newValue);
    if (newValue) {
      setFormData(prev => ({
        ...prev,
        end_time: newValue.toISOString(),
      }));
    }
    
    if (errors.time) {
      setErrors(prev => ({ ...prev, time: undefined }));
    }
  };

  const addParticipantEmail = () => {
    if (newEmail && /\S+@\S+\.\S+/.test(newEmail)) {
      if (!formData.participant_emails?.includes(newEmail)) {
        setFormData(prev => ({
          ...prev,
          participant_emails: [...(prev.participant_emails || []), newEmail],
        }));
        setNewEmail('');
        setErrors(prev => ({ ...prev, email: undefined }));
      } else {
        setErrors(prev => ({ ...prev, email: 'Email already added' }));
      }
    } else {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email' }));
    }
  };

  const removeParticipantEmail = (emailToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      participant_emails: prev.participant_emails?.filter(email => email !== emailToRemove) || [],
    }));
  };

  const handleEmailKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addParticipantEmail();
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<EventCreate & { time: string; email: string }> = {};

    if (!formData.title) {
      newErrors.title = 'Title is required';
    }

    if (!startTime || !endTime) {
      newErrors.time = 'Both start and end times are required';
    } else if (startTime.isAfter(endTime)) {
      newErrors.time = 'End time must be after start time';
    } else if (startTime.isBefore(dayjs())) {
      newErrors.time = 'Start time cannot be in the past';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    actions.setLoading(true);
    actions.clearError();

    try {
      const event = await EventService.createEvent(formData);
      actions.addEvent(event);
      navigate('/');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      const errorMessage = err.response?.data?.error?.message || 'Failed to create event';
      actions.setError(errorMessage);
    } finally {
      actions.setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Typography component="h1" variant="h4" gutterBottom>
          Create New Event
        </Typography>

        {state.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {state.error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="title"
                label="Event Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                error={!!errors.title}
                helperText={errors.title}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="description"
                label="Description"
                name="description"
                multiline
                rows={3}
                value={formData.description}
                onChange={handleChange}
                error={!!errors.description}
                helperText={errors.description}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <DateTimePicker
                label="Start Time"
                value={startTime}
                onChange={handleStartTimeChange}
                slotProps={{
                  textField: {
                    required: true,
                    fullWidth: true,
                    error: !!errors.time,
                    helperText: errors.time,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <DateTimePicker
                label="End Time"
                value={endTime}
                onChange={handleEndTimeChange}
                slotProps={{
                  textField: {
                    required: true,
                    fullWidth: true,
                    error: !!errors.time,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                id="location"
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                error={!!errors.location}
                helperText={errors.location}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                id="newEmail"
                label="Add Participant Email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyPress={handleEmailKeyPress}
                error={!!errors.email}
                helperText={errors.email || 'Press Enter to add email'}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={addParticipantEmail} edge="end">
                        <AddIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {formData.participant_emails && formData.participant_emails.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Participants:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {formData.participant_emails.map((email) => (
                    <Chip
                      key={email}
                      label={email}
                      onDelete={() => removeParticipantEmail(email)}
                      deleteIcon={<DeleteIcon />}
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Grid>
            )}

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button 
                  variant="outlined" 
                  onClick={() => navigate('/')}
                  disabled={state.loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={state.loading}
                >
                  {state.loading ? 'Creating...' : 'Create Event'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};