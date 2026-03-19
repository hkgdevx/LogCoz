import { describe, expect, it } from 'vitest';
import { rabbitmq } from '@/detectors/messaging/rabbitmq';

function createContext(normalized: string): DetectionContext {
  return { raw: normalized, normalized, lines: normalized.split('\n'), contextHints: [] };
}

describe('rabbitmqDetector', () => {
  it('detects rabbitmq broker failures', () => {
    const result = rabbitmq.detect(
      createContext('amqp ACCESS_REFUSED - Login was refused using authentication mechanism')
    );
    expect(result?.type).toBe('rabbitmq_connection_error');
  });
});
