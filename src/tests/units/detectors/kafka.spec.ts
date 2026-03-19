import { describe, expect, it } from 'vitest';
import { kafka } from '@/detectors/messaging/kafka';

function createContext(normalized: string): DetectionContext {
  return { raw: normalized, normalized, lines: normalized.split('\n'), contextHints: [] };
}

describe('kafkaDetector', () => {
  it('detects kafka broker failures', () => {
    const result = kafka.detect(createContext('KafkaJSConnectionError: broker is not available'));
    expect(result?.type).toBe('kafka_broker_error');
  });
});
