import { describe, expect, it } from 'vitest';
import { mysql } from '@/detectors/database/mysql';

function createContext(normalized: string): DetectionContext {
  return { raw: normalized, normalized, lines: normalized.split('\n'), contextHints: [] };
}

describe('mysqlDetector', () => {
  it('detects mysql connection problems', () => {
    const result = mysql.detect(createContext('mysql ECONNREFUSED 127.0.0.1:3306'));
    expect(result?.type).toBe('mysql_connection_error');
  });
});
