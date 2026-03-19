import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { loadContextHints } from '@/core/context';

describe('loadContextHints', () => {
  let tempDir = '';

  afterEach(async () => {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
      tempDir = '';
    }
  });

  it('extracts env, compose, kubernetes, and json hints', async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'logcoz-context-'));
    const envPath = path.join(tempDir, '.env');
    const composePath = path.join(tempDir, 'docker-compose.yml');
    const kubePath = path.join(tempDir, 'deployment.yaml');
    const jsonPath = path.join(tempDir, 'app.json');

    await fs.writeFile(envPath, 'REDIS_HOST=localhost\nMYSQL_HOST=db\n', 'utf8');
    await fs.writeFile(composePath, 'services:\n  redis:\n    image: redis\n', 'utf8');
    await fs.writeFile(
      kubePath,
      'apiVersion: v1\nkind: Deployment\nmetadata:\n  name: api\n',
      'utf8'
    );
    await fs.writeFile(jsonPath, JSON.stringify({ kafkaBroker: 'broker:9092' }), 'utf8');

    const hints = await loadContextHints([envPath, composePath, kubePath, jsonPath]);

    expect(hints).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'REDIS_HOST', value: 'localhost' }),
        expect.objectContaining({ key: 'docker_service', value: 'redis' }),
        expect.objectContaining({ key: 'k8s_kind', value: 'Deployment' }),
        expect.objectContaining({ key: 'config_kafkaBroker', value: 'broker:9092' })
      ])
    );
  });
});
