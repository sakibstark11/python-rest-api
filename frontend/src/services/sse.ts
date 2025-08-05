import { AuthService } from './auth';
import logger from '../utils/logger';
import type { AxiosProgressEvent } from 'axios';

export async function connectSSE(url: string, onMessage: (message: any) => void) {
  const controller = new AbortController();

  try {
    await AuthService.getApi().get(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },

      onDownloadProgress: (progressEvent: AxiosProgressEvent) => {
        const { responseText } = progressEvent.event.target;

        const lastDoubleNewline = responseText.lastIndexOf('\n\n');

        if (lastDoubleNewline !== -1) {
          const prevDoubleNewline = responseText.lastIndexOf('\n\n', lastDoubleNewline - 1);

          const startPos = prevDoubleNewline === -1 ? 0 : prevDoubleNewline + 2;
          const message = responseText.substring(startPos, lastDoubleNewline);

          if (message.startsWith('data: ')) {
            const data = message.slice(6).trim();
            if (data) {
              try {
                const parsedMessage = JSON.parse(data);
                onMessage(parsedMessage);
              } catch (error) {
                logger.error({ error }, 'Failed to parse SSE message');
              }
            }
          }
        }
      },
    });
  } finally {
    controller.abort();
  }
}
