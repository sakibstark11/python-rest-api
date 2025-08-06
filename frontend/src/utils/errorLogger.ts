import axios from 'axios';
import logger from './logger';

export function logAxiosError(error: unknown, operation: string) {
  if (axios.isAxiosError(error)) {
    const requestId = error.response?.headers?.['x-request-id'];

    logger.error({
      message: `Failed to ${operation}`,
      error: error.response?.data?.error?.message || error.message,
      status: error.response?.status,
      request_id: requestId,
    });
  } else {
    logger.error({ message: `Failed to ${operation}`, error });
  }
}
