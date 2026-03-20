/**************************************************************************************************************************
 Copyright (c) 2026

     Name: collect.ts
   Author: Harikrishnan Gangadharan
 Comments:

/**************************************************************************************************************************
 IMPORTS
***************************************************************************************************************************/
import { execFile } from 'node:child_process';
import { readOptionalTextFile } from '@/utils/file';

/**************************************************************************************************************************
 TYPES / GLOBAL DEFINITIONS
***************************************************************************************************************************/
const DEFAULT_TAIL = '200';

interface DockerContainerRecord {
  id: string;
  name: string;
  image: string;
}

function toValues(value?: string | string[]): string[] {
  if (value === undefined) return [];
  return (Array.isArray(value) ? value : [value])
    .flatMap((item) => item.split(','))
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseCsv(value?: string | string[]): string[] {
  return toValues(value).map((item) => item.toLowerCase());
}

function getRequestedSystemSources(
  options: AnalyzeOptions | ExplainOptions | CorrelateOptions
): string[] {
  return parseCsv((options as Partial<CorrelateOptions>).systemSource);
}

function normalizeTail(tail?: string | number): string {
  if (tail === undefined) return DEFAULT_TAIL;
  const text = String(tail).trim();
  return text || DEFAULT_TAIL;
}

async function runCommand(command: string, args: string[]): Promise<string | null> {
  return new Promise((resolve) => {
    execFile(
      command,
      args,
      {
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024
      },
      (error, stdout, stderr) => {
        const combined = `${stdout ?? ''}${stderr ?? ''}`.trim();
        if (combined) {
          resolve(combined);
          return;
        }

        if (error) {
          resolve(null);
          return;
        }

        resolve(null);
      }
    );
  });
}

function classifyServiceType(input: string): ServiceType {
  const value = input.toLowerCase();

  if (/(^|[-_/])postgres|postgresql|timescaledb/.test(value)) return 'postgres';
  if (/(^|[-_/])redis/.test(value)) return 'redis';
  if (/(^|[-_/])mongo|mongodb/.test(value)) return 'mongodb';
  if (/(^|[-_/])nginx/.test(value)) return 'nginx';
  if (/(^|[-_/])ssh|sshd/.test(value)) return 'ssh';
  if (/(^|[-_/])kube|k8s/.test(value)) return 'kubernetes';
  if (/(^|[-_/])system|syslog|journal/.test(value)) return 'system';
  return 'app';
}

function matchesServiceFilter(
  serviceType: ServiceType,
  options: AnalyzeOptions | ExplainOptions
): boolean {
  const includeServices = 'includeServices' in options ? parseCsv(options.includeServices) : [];
  if (includeServices.length === 0) return true;
  return includeServices.includes(serviceType);
}

function matchesExcludeFilter(
  source: Pick<CollectedSource, 'id' | 'displayName'>,
  options: AnalyzeOptions
): boolean {
  const excluded = parseCsv(options.excludeSources);
  if (excluded.length === 0) return false;
  const haystack = [source.id.toLowerCase(), source.displayName.toLowerCase()];
  return haystack.some((value) => excluded.includes(value));
}

function buildWindow(options: Pick<ExplainOptions, 'since' | 'tail'>): string {
  const parts = [`tail=${normalizeTail(options.tail)}`];
  if (options.since) parts.push(`since=${options.since}`);
  return parts.join(', ');
}

async function listDockerContainers(): Promise<DockerContainerRecord[]> {
  const output = await runCommand('docker', ['ps', '--format', '{{.ID}}\t{{.Names}}\t{{.Image}}']);
  if (!output) return [];

  return output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [id, name, image] = line.split('\t');
      return {
        id: id ?? '',
        name: name ?? '',
        image: image ?? ''
      };
    })
    .filter((record) => Boolean(record.id && record.name));
}

function filterDockerContainers(
  containers: DockerContainerRecord[],
  options: AnalyzeOptions | ExplainOptions
): DockerContainerRecord[] {
  const requestedContainers = parseCsv(options.container);
  const requestedServices = parseCsv(options.service);

  return containers.filter((container) => {
    if (requestedContainers.length > 0) {
      const names = [container.id.toLowerCase(), container.name.toLowerCase()];
      if (!requestedContainers.some((requested) => names.includes(requested))) return false;
    }

    const serviceType = classifyServiceType(`${container.name} ${container.image}`);
    if (requestedServices.length > 0 && !requestedServices.includes(serviceType)) return false;
    return matchesServiceFilter(serviceType, options);
  });
}

async function collectDockerLog(
  container: DockerContainerRecord,
  options: AnalyzeOptions | ExplainOptions
): Promise<CollectedSource | null> {
  const args = ['logs', '--tail', normalizeTail(options.tail)];
  if (options.since) {
    args.push('--since', options.since);
  }
  args.push(container.name);

  const raw = await runCommand('docker', args);
  if (!raw) return null;

  return {
    id: container.id,
    kind: 'docker-container',
    displayName: container.name,
    serviceType: classifyServiceType(`${container.name} ${container.image}`),
    raw,
    metadata: {
      host: 'local',
      command: `docker ${args.join(' ')}`,
      window: buildWindow(options),
      truncated: true,
      image: container.image,
      container: container.name
    }
  };
}

export async function collectDockerSources(
  options: AnalyzeOptions | ExplainOptions
): Promise<CollectedSource[]> {
  const discovered = filterDockerContainers(await listDockerContainers(), options);

  if (discovered.length === 0) {
    const fallbackContainers = toValues(options.container);
    if (fallbackContainers.length === 0) {
      return [];
    }

    const fallbacks = (
      await Promise.all(
        fallbackContainers.map((container) =>
          collectDockerLog(
            {
              id: container,
              name: container,
              image: toValues(options.service)[0] ?? container
            },
            options
          )
        )
      )
    ).filter((item): item is CollectedSource => item !== null);

    return fallbacks;
  }

  const collected = (
    await Promise.all(discovered.map((container) => collectDockerLog(container, options)))
  ).filter((item): item is CollectedSource => item !== null);

  return 'excludeSources' in options
    ? collected.filter((source) => !matchesExcludeFilter(source, options))
    : collected;
}

async function collectJournalSource(
  label: string,
  serviceType: ServiceType,
  args: string[],
  unit?: string
): Promise<CollectedSource | null> {
  const raw = await runCommand('journalctl', args);
  if (!raw) return null;

  return {
    id: unit ?? label.toLowerCase(),
    kind: 'system-log',
    displayName: label,
    serviceType,
    raw,
    metadata: {
      host: 'local',
      command: `journalctl ${args.join(' ')}`,
      window: args.includes('--since')
        ? `tail=${args[args.indexOf('-n') + 1] ?? DEFAULT_TAIL}, since=${
            args[args.indexOf('--since') + 1] ?? ''
          }`
        : `tail=${args[args.indexOf('-n') + 1] ?? DEFAULT_TAIL}`,
      truncated: true,
      ...(unit ? { unit } : {})
    }
  };
}

export async function collectSystemSources(
  options: AnalyzeOptions | ExplainOptions
): Promise<CollectedSource[]> {
  const tail = normalizeTail(options.tail);
  const sinceArgs = options.since ? ['--since', options.since] : [];
  const requestedSystemSources = getRequestedSystemSources(options);

  const journalCandidates = [
    {
      label: 'system-journal',
      serviceType: 'system' as const,
      args: ['-n', tail, '--no-pager', ...sinceArgs]
    },
    {
      label: 'ssh',
      serviceType: 'ssh' as const,
      args: ['-u', 'ssh', '-n', tail, '--no-pager', ...sinceArgs],
      unit: 'ssh'
    },
    {
      label: 'docker-daemon',
      serviceType: 'system' as const,
      args: ['-u', 'docker', '-n', tail, '--no-pager', ...sinceArgs],
      unit: 'docker'
    }
  ].filter((candidate) => {
    if (requestedSystemSources.length === 0) return true;
    const names = [candidate.label.toLowerCase(), candidate.unit?.toLowerCase()].filter(Boolean);
    return requestedSystemSources.some((requested) => names.includes(requested));
  });

  const journalResults = (
    await Promise.all(
      journalCandidates.map((candidate) =>
        collectJournalSource(candidate.label, candidate.serviceType, candidate.args, candidate.unit)
      )
    )
  ).filter((item): item is CollectedSource => item !== null);

  if (journalResults.length > 0) {
    return 'excludeSources' in options
      ? journalResults.filter((source) => !matchesExcludeFilter(source, options))
      : journalResults;
  }

  const fileCandidates = [
    {
      id: 'auth-log',
      displayName: 'auth.log',
      path: '/var/log/auth.log',
      serviceType: 'ssh' as const
    },
    {
      id: 'syslog',
      displayName: 'syslog',
      path: '/var/log/syslog',
      serviceType: 'system' as const
    }
  ].filter((candidate) => {
    if (requestedSystemSources.length === 0) return true;
    return requestedSystemSources.some((requested) =>
      [candidate.id.toLowerCase(), candidate.displayName.toLowerCase()].includes(requested)
    );
  });

  const fileResults: CollectedSource[] = (
    await Promise.all(
      fileCandidates.map(async (candidate) => {
        const raw = await readOptionalTextFile(candidate.path);
        if (!raw) return null;
        const result: CollectedSource = {
          id: candidate.id,
          kind: 'system-log',
          displayName: candidate.displayName,
          serviceType: candidate.serviceType,
          raw,
          metadata: {
            host: 'local' as const,
            path: candidate.path,
            window: buildWindow(options)
          }
        };
        return result;
      })
    )
  ).filter((item): item is CollectedSource => item !== null);

  return 'excludeSources' in options
    ? fileResults.filter((source) => !matchesExcludeFilter(source, options))
    : fileResults;
}

export async function collectRuntimeSources(options: AnalyzeOptions): Promise<CollectedSource[]> {
  const useScopedIncludes = options.includeDocker || options.includeSystem;
  const includeDocker = useScopedIncludes ? Boolean(options.includeDocker) : true;
  const includeSystem = useScopedIncludes ? Boolean(options.includeSystem) : true;

  const groups = await Promise.all([
    includeDocker ? collectDockerSources(options) : Promise.resolve([]),
    includeSystem ? collectSystemSources(options) : Promise.resolve([])
  ]);

  return groups.flat();
}

export async function collectCorrelationRuntimeSources(
  options: CorrelateOptions
): Promise<CollectedSource[]> {
  const groups = await Promise.all([
    collectDockerSources(options),
    options.includeSystem ? collectSystemSources(options) : Promise.resolve([])
  ]);

  return groups.flat();
}

export function annotateSourceForCorrelation(source: CollectedSource): string {
  return source.raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `[${source.displayName}] ${line}`)
    .join('\n');
}

export function detectServiceType(input: string): ServiceType {
  return classifyServiceType(input);
}
