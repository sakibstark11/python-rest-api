import type { Event, EventCreate } from '../types';
import { logAxiosError } from '../utils/errorLogger';
import type { AxiosInstance } from 'axios';
import { authService } from './auth';

export class EventService {
  private api: AxiosInstance;

  constructor(apiInstance: AxiosInstance) {
    this.api = apiInstance;
  }

  public async getEvents(startDate?: string, endDate?: string): Promise<Event[]> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await this.api.get(`/events/?start_date=${startDate}&end_date=${endDate}`);
      return response.data;
    } catch (error) {
      logAxiosError(error, 'get events');
      throw error;
    }
  }

  public async getEvent(eventId: string): Promise<Event> {
    try {
      const response = await this.api.get(`/events/${eventId}`);
      return response.data;
    } catch (error) {
      logAxiosError(error, 'get event');
      throw error;
    }
  }

  public async createEvent(eventData: EventCreate): Promise<Event> {
    try {
      const response = await this.api.post('/events/', eventData);
      return response.data;
    } catch (error) {
      logAxiosError(error, 'create event');
      throw error;
    }
  }

  public async updateEvent(eventId: string, eventData: Partial<EventCreate>): Promise<Event> {
    try {
      const response = await this.api.put(`/events/${eventId}`, eventData);
      return response.data;
    } catch (error) {
      logAxiosError(error, 'update event');
      throw error;
    }
  }

  public async deleteEvent(eventId: string): Promise<void> {
    try {
      await this.api.delete(`/events/${eventId}`);
    } catch (error) {
      logAxiosError(error, 'delete event');
      throw error;
    }
  }

  public async respondToEvent(eventId: string, status: 'accepted' | 'declined'): Promise<void> {
    try {
      await this.api.post(`/events/${eventId}/respond`, {
        event_id: eventId,
        status,
      });
    } catch (error) {
      logAxiosError(error, 'respond to event');
      throw error;
    }
  }
}

export const eventService = new EventService(authService.getApi());
