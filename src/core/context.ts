/**************************************************************************************************************************
 Copyright (c) 2026

     Name: context.ts
   Author: Harikrishnan Gangadharan
 Comments:

/**************************************************************************************************************************
 IMPORTS
***************************************************************************************************************************/
import path from 'node:path';
import { readOptionalTextFile } from '@/utils/file';

/**************************************************************************************************************************
 TYPES / GLOBAL DEFINITIONS
***************************************************************************************************************************/
function pushHint(hints: ContextHint[], key: string, value: string, source: string): void {
  hints.push({ key, value, source });
}

function parseEnvContent(content: string, source: string, hints: ContextHint[]): void {
  const env = new Map<string, string>();

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    const value = line
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^['"]|['"]$/g, '');
    if (!key) continue;
    env.set(key, value);
  }

  for (const trackedKey of [
    'REDIS_HOST',
    'REDIS_PORT',
    'REDIS_URL',
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'MYSQL_HOST',
    'MONGO_URL',
    'KAFKA_BROKERS',
    'RABBITMQ_URL'
  ]) {
    const value = env.get(trackedKey);
    if (value) {
      pushHint(hints, trackedKey, value, source);
    }
  }
}

// This Compose parser is intentionally shallow: it extracts enough structure to improve detection
// without trying to fully implement YAML parsing inside the CLI runtime.
function parseComposeContent(content: string, source: string, hints: ContextHint[]): void {
  const serviceMatches = [...content.matchAll(/^\s{2}([a-zA-Z0-9_-]+):\s*$/gm)];
  for (const match of serviceMatches) {
    const service = match[1];
    if (service) {
      pushHint(hints, 'docker_service', service, source);
    }
  }

  const portMatches = [...content.matchAll(/^\s*-\s*"?(?<host>\d+):(?<container>\d+)"?\s*$/gm)];
  for (const match of portMatches) {
    const host = match.groups?.host;
    const container = match.groups?.container;
    if (host && container) {
      pushHint(hints, 'docker_port_mapping', `${host}:${container}`, source);
    }
  }
}

function parseKubernetesContent(content: string, source: string, hints: ContextHint[]): void {
  const kindMatch = content.match(/^\s*kind:\s*([A-Za-z]+)/m);
  if (kindMatch?.[1]) {
    pushHint(hints, 'k8s_kind', kindMatch[1], source);
  }

  const nameMatch = content.match(/^\s*name:\s*([a-zA-Z0-9._-]+)/m);
  if (nameMatch?.[1]) {
    pushHint(hints, 'k8s_name', nameMatch[1], source);
  }

  const imageMatches = [...content.matchAll(/^\s*image:\s*([^\s]+)/gm)];
  for (const match of imageMatches) {
    if (match[1]) {
      pushHint(hints, 'k8s_image', match[1], source);
    }
  }
}

function parseJsonConfigContent(content: string, source: string, hints: ContextHint[]): void {
  try {
    const parsed = JSON.parse(content) as Record<string, unknown>;

    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value !== 'string' && typeof value !== 'number') {
        continue;
      }

      if (/(redis|db|mysql|mongo|kafka|rabbit|tls|ssl)/i.test(key)) {
        pushHint(hints, `config_${key}`, String(value), source);
      }
    }
  } catch {
    // Ignore invalid JSON files so optional context never blocks analysis.
  }
}

/**************************************************************************************************************************
 IMPLEMENTATIONS
***************************************************************************************************************************/
export async function loadContextHints(files: string[]): Promise<ContextHint[]> {
  const hints: ContextHint[] = [];

  for (const file of files) {
    const content = await readOptionalTextFile(file);
    if (!content) continue;

    const source = path.basename(file);
    const lowerSource = source.toLowerCase();

    parseEnvContent(content, source, hints);

    if (
      lowerSource.includes('compose') ||
      /^\s*services:\s*$/m.test(content) ||
      /^\s{2}[a-zA-Z0-9_-]+:\s*$/m.test(content)
    ) {
      parseComposeContent(content, source, hints);
    }

    if (/^\s*apiVersion:\s*/m.test(content) && /^\s*kind:\s*/m.test(content)) {
      parseKubernetesContent(content, source, hints);
    }

    if (lowerSource.endsWith('.json')) {
      parseJsonConfigContent(content, source, hints);
    }
  }

  return hints;
}
