import type { Event, EventCreate } from '../types';
import { AuthService } from './auth';
import { logAxiosError } from '../utils/errorLogger';

const api = AuthService.getApi();

export class EventService {
  static async getEvents(startDate?: string, endDate?: string): Promise<Event[]> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await api.get(`/events/?start_date=${startDate}&end_date=${endDate}`);
      return response.data;
    } catch (error) {
      logAxiosError(error, 'get events');
      throw error;
    }
  }

  static async getEvent(eventId: string): Promise<Event> {
    try {
      const response = await api.get(`/events/${eventId}`);
      return response.data;
    } catch (error) {
      logAxiosError(error, 'get event');
      throw error;
    }
  }

  static async createEvent(eventData: EventCreate): Promise<Event> {
    try {
      const response = await api.post('/events/', eventData);
      return response.data;
    } catch (error) {
      logAxiosError(error, 'create event');
      throw error;
    }
  }

  static async updateEvent(eventId: string, eventData: Partial<EventCreate>): Promise<Event> {
    try {
      const response = await api.put(`/events/${eventId}`, eventData);
      return response.data;
    } catch (error) {
      logAxiosError(error, 'update event');
      throw error;
    }
  }

  static async deleteEvent(eventId: string): Promise<void> {
    try {
      await api.delete(`/events/${eventId}`);
    } catch (error) {
      logAxiosError(error, 'delete event');
      throw error;
    }
  }

  static async respondToEvent(eventId: string, status: 'accepted' | 'declined'): Promise<void> {
    try {
      await api.post(`/events/${eventId}/respond`, {
        event_id: eventId,
        status,
      });
    } catch (error) {
      logAxiosError(error, 'respond to event');
      throw error;
    }
  }

  static async inviteToEvent(eventId: string, participantEmail: string): Promise<void> {
    try {
      await api.post(`/events/${eventId}/invite`, { participant_email: participantEmail });
    } catch (error) {
      logAxiosError(error, 'invite to event');
      throw error;
    }
  }
}
