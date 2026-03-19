import { describe, expect, it } from 'vitest';
import { mongodb } from '@/detectors/database/mongodb';

function createContext(normalized: string): DetectionContext {
  return { raw: normalized, normalized, lines: normalized.split('\n'), contextHints: [] };
}

describe('mongodbDetector', () => {
  it('detects mongodb connection problems', () => {
    const result = mongodb.detect(
      createContext('MongoNetworkError: failed to connect to server mongo:27017')
    );
    expect(result?.type).toBe('mongodb_connection_error');
  });
});
