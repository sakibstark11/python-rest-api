import type { Event, EventCreate } from '../types';
import { AuthService } from './auth';

const api = AuthService.getApi();

export class EventService {
  static async getEvents(startDate?: string, endDate?: string): Promise<Event[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const response = await api.get(`/events/?start_date=${startDate}&end_date=${endDate}`);
    return response.data;
  }

  static async getEvent(eventId: string): Promise<Event> {
    const response = await api.get(`/events/${eventId}`);
    return response.data;
  }

  static async createEvent(eventData: EventCreate): Promise<Event> {
    const response = await api.post('/events/', eventData);
    return response.data;
  }

  static async updateEvent(eventId: string, eventData: Partial<EventCreate>): Promise<Event> {
    const response = await api.put(`/events/${eventId}`, eventData);
    return response.data;
  }

  static async deleteEvent(eventId: string): Promise<void> {
    await api.delete(`/events/${eventId}`);
  }

  static async respondToEvent(eventId: string, status: 'accepted' | 'declined'): Promise<void> {
    await api.post(`/events/${eventId}/respond`, {
      event_id: eventId,
      status,
    });
  }

  static async inviteToEvent(eventId: string, participantEmail: string): Promise<void> {
    await api.post(`/events/${eventId}/invite`, { participant_email: participantEmail });
  }
}
