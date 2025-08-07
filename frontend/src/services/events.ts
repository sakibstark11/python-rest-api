import type { Event, EventCreate } from '../types';
import { logAxiosError } from '../utils/errorLogger';
import type { AxiosInstance } from 'axios';
import { authService } from './auth';

export class EventService {
  private api: AxiosInstance;

  private currentAbortController: AbortController | null = null;

  constructor(apiInstance: AxiosInstance) {
    this.api = apiInstance;
  }

  private handleAbort() {
    if (this.currentAbortController) {
      this.currentAbortController.abort();
      console.warn('Previous request aborted due to new request');
    }
    this.currentAbortController = new AbortController();
  }

  public async getEvents(startDate: string, endDate: string): Promise<Event[]> {
    try {
      this.handleAbort();
      const response = await this.api.get(
        `/events/?start_date=${startDate}&end_date=${endDate}`,
        {
          signal: this.currentAbortController?.signal,
        });

      return response.data;
    } catch (error) {
      logAxiosError(error, 'get events');
      throw error;
    }
  }

  public async getEvent(eventId: string): Promise<Event> {
    try {
      this.handleAbort();
      const response = await this.api.get(`/events/${eventId}`, {
        signal: this.currentAbortController?.signal,
      });

      return response.data;
    } catch (error) {
      logAxiosError(error, 'get event');
      throw error;
    }
  }

  public async createEvent(eventData: EventCreate): Promise<Event> {
    try {
      this.handleAbort();
      const response = await this.api.post('/events/', eventData, {
        signal: this.currentAbortController?.signal,
      });

      return response.data;
    } catch (error) {
      logAxiosError(error, 'create event');
      throw error;
    }
  }

  public async updateEvent(eventId: string, eventData: Partial<EventCreate>):
    Promise<Event> {
    try {
      this.handleAbort();
      const response = await this.api.put(`/events/${eventId}`, eventData, {
        signal: this.currentAbortController?.signal,
      });

      return response.data;
    } catch (error) {
      logAxiosError(error, 'update event');
      throw error;
    }
  }

  public async deleteEvent(eventId: string): Promise<void> {
    try {
      this.handleAbort();
      await this.api.delete(`/events/${eventId}`, {
        signal: this.currentAbortController?.signal,
      });
    } catch (error) {
      logAxiosError(error, 'delete event');
      throw error;
    }
  }

  public async respondToEvent(eventId: string, status: 'accepted' | 'declined'):
    Promise<void> {
    try {
      this.handleAbort();
      await this.api.post(`/events/${eventId}/respond`, {
        event_id: eventId,
        status,
      }, {
        signal: this.currentAbortController?.signal,
      });
    } catch (error) {
      logAxiosError(error, 'respond to event');
      throw error;
    }
  }
}

export const eventService = new EventService(authService.getApi());
