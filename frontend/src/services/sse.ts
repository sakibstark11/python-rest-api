import type { AxiosProgressEvent, AxiosInstance } from 'axios';

export class SSEClient implements AsyncIterable<any> {
  private messageHandler!: (msg: any) => void;
  private errorHandler!: (error: any) => void;
  private api: AxiosInstance;
  private url: string;
  private controller: AbortController;
  private connected: boolean = false;

  constructor(url: string, api: AxiosInstance, controller: AbortController) {
    this.api = api;
    this.controller = controller;
    this.url = url;
  }

  public isConnected(): boolean {
    return this.connected;
  }

  private connect() {
    this.api.get(this.url, {
      signal: this.controller.signal,
      headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
      onDownloadProgress: (progressEvent: AxiosProgressEvent) => {
        this.connected = true;
        const { responseText } = progressEvent.event.target;

        const lastDoubleNewline = responseText.lastIndexOf('\n\n');
        if (lastDoubleNewline === -1) return;

        const prevDoubleNewline = responseText.lastIndexOf('\n\n', lastDoubleNewline - 1);
        const start = prevDoubleNewline === -1 ? 0 : prevDoubleNewline + 2;
        const message = responseText.substring(start, lastDoubleNewline);

        if (message.startsWith('data: ')) {
          const data = message.slice(6).trim();
          if (data) {
            try {
              const parsed = JSON.parse(data);
              queueMicrotask(() => this.messageHandler(parsed));
            } catch (err) {
              queueMicrotask(() => this.errorHandler(new Error(`Failed to parse SSE message: ${err}`)));
            }
          }
        }
      },
    }).catch(err => {
      this.connected = false;
      queueMicrotask(() => this.errorHandler(err));
    });
  }

  public disconnect() {
    this.connected = false;
    this.controller.abort();
  }

  public [Symbol.asyncIterator](): AsyncIterator<any> {
    this.connect();

    return {
      next: () =>
        new Promise((resolve, reject) => {
          this.messageHandler = (msg: any) => resolve({ value: msg, done: false });
          this.errorHandler = (error: any) => reject(error);
        }),
    };
  }
}
