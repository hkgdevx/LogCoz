/**************************************************************************************************************************
 Copyright (c) 2026

     Name: cli.ts
   Author: Harikrishnan Gangadharan
 Comments: 

/**************************************************************************************************************************
 IMPORTS
***************************************************************************************************************************/
import { Command } from 'commander';
import { realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CLI_NAME, CLI_VERSION } from '@/constants/meta';
import { explain } from '@/commands/explain';
import { explainDocker } from '@/commands/explain-docker';
import { paste } from './commands/paste';
import { correlate } from '@/commands/correlate';
import { correlateDocker } from '@/commands/correlate-docker';
import { analyze } from '@/commands/analyze';

/**************************************************************************************************************************
 TYPES / GLOBAL DEFINITIONS
***************************************************************************************************************************/
function addExplainLikeOptions(command: Command): Command {
  return command
    .option('--json', 'Output structured JSON')
    .option('--context <files>', 'Comma-separated context files, e.g. .env,docker-compose.yml')
    .option('--llm', 'Enable LLM-based explanation enhancement')
    .option('--llm-provider <provider>', 'LLM provider, e.g. mock or http')
    .option('--llm-endpoint <url>', 'LLM provider HTTP endpoint')
    .option('--llm-model <model>', 'LLM model identifier for the configured provider')
    .option('--include-reasoning', 'Include detector confidence reasoning in the output');
}

function addRuntimeSourceOptions(command: Command): Command {
  return command
    .option('--container <name-or-id...>', 'One or more Docker container names or ids')
    .option(
      '--service <service...>',
      'One or more service type filters, e.g. postgres, redis, mongodb, nginx'
    )
    .option('--tail <n>', 'Number of log lines to collect', '200')
    .option('--since <value>', 'Relative duration or timestamp passed to the runtime collector');
}

function addExamples(command: Command, sections: string[]): Command {
  const content = ['']
    .concat(sections)
    .concat(['', 'More examples and reference:', '  README.md', '  docs/cli-reference.md'])
    .join('\n');

  const originalHelpInformation = command.helpInformation.bind(command);
  command.helpInformation = () => `${originalHelpInformation()}${content}\n`;
  return command;
}

/**************************************************************************************************************************
 IMPLEMENTATIONS
***************************************************************************************************************************/
export function createProgram(): Command {
  const program = new Command();

  program.name(CLI_NAME).description('Find the cause behind logs').version(CLI_VERSION);
  program.showHelpAfterError();

  addExamples(program, [
    'Common Workflows:',
    '  explain        Investigate one log file or one matching Docker source.',
    '  correlate      Connect related events across files or runtime sources.',
    '  analyze        Auto-discover local Docker and system sources for grouped analysis.',
    '',
    'Examples:',
    '  logcozcli explain ./app.log --include-reasoning',
    '  logcozcli explain docker --container api --json',
    '  logcozcli correlate ./api.log ./nginx.log --json',
    '  logcozcli correlate docker --container api --container nginx --include-system --system-source ssh',
    '  logcozcli analyze --include-docker --include-system --json'
  ]);

  const explainCommand = program.command('explain');

  addExamples(
    addExplainLikeOptions(
      explainCommand
        .description('Analyze a log file and explain the likely root cause')
        .argument('<file>', 'Path to the log file')
    ).action(explain),
    [
      'Notes:',
      '  Use this for one file-based investigation.',
      '  Pass --context when config files help explain the failure.',
      '',
      'Examples:',
      '  logcozcli explain ./app.log',
      '  logcozcli explain ./app.log --json',
      '  logcozcli explain ./app.log --context .env,docker-compose.yml --include-reasoning',
      '  OPENAI_API_KEY=YOUR_API_KEY logcozcli explain ./app.log --llm --llm-provider openai --llm-model gpt-5-mini'
    ]
  );

  addExamples(
    addRuntimeSourceOptions(
      addExplainLikeOptions(
        explainCommand
          .command('docker')
          .description('Collect Docker container logs and explain the likely root cause')
      ).action(explainDocker)
    ),
    [
      'Notes:',
      '  Use this for single-source runtime investigation.',
      '  If you need cross-source runtime correlation, use `correlate docker` instead.',
      '',
      'Examples:',
      '  logcozcli explain docker --container api',
      '  logcozcli explain docker --service mongodb --tail 150',
      '  logcozcli explain docker --container api --json',
      '  logcozcli explain docker --service redis --since 30m --include-reasoning'
    ]
  );

  addExamples(
    addExplainLikeOptions(
      program.command('paste').description('Read logs from stdin and analyze them')
    ).action(paste),
    [
      'Notes:',
      '  Use this when logs are piped from another command or copied into stdin.',
      '',
      'Examples:',
      '  cat ./worker.log | logcozcli paste',
      '  cat ./worker.log | logcozcli paste --json',
      '  docker logs api | logcozcli paste --include-reasoning'
    ]
  );

  const correlateCommand = program.command('correlate');

  addExamples(
    correlateCommand
      .description('Correlate multiple log files into incident groups')
      .argument('<files...>', 'Paths to log files')
      .option('--json', 'Output structured JSON')
      .action(correlate),
    [
      'Notes:',
      '  Use this for file-based cross-log correlation.',
      '',
      'Examples:',
      '  logcozcli correlate ./api.log ./worker.log ./nginx.log',
      '  logcozcli correlate ./api.log ./nginx.log --json'
    ]
  );

  addExamples(
    addRuntimeSourceOptions(
      correlateCommand
        .command('docker')
        .description(
          'Collect multiple Docker and optional system sources and correlate incident groups'
        )
        .option('--include-system', 'Include local system log sources in runtime correlation')
        .option(
          '--system-source <name...>',
          'Restrict included system sources, e.g. ssh, docker, syslog'
        )
        .option('--json', 'Output structured JSON')
        .action(correlateDocker)
    ),
    [
      'Notes:',
      '  This is multi-source runtime correlation.',
      '  At least two runtime sources are required.',
      '',
      'Examples:',
      '  logcozcli correlate docker --container api --container nginx',
      '  logcozcli correlate docker --service app --service nginx --json',
      '  logcozcli correlate docker --container api --container nginx --include-system --system-source ssh',
      '  logcozcli correlate docker --service redis --service postgres --tail 300 --since 1h --json'
    ]
  );

  addExamples(
    addRuntimeSourceOptions(
      addExplainLikeOptions(
        program
          .command('analyze')
          .description(
            'Auto-discover local Docker and system logs, correlate them, and summarize incidents'
          )
          .option('--include-docker', 'Include Docker container logs during discovery')
          .option('--include-system', 'Include local system logs during discovery')
          .option('--include-services <services>', 'Comma-separated service types to include')
          .option('--exclude-sources <sources>', 'Comma-separated source ids or names to exclude')
      ).action(analyze)
    ),
    [
      'Notes:',
      '  Use this for grouped local investigation across discovered runtime sources.',
      '',
      'Examples:',
      '  logcozcli analyze',
      '  logcozcli analyze --include-docker --json',
      '  logcozcli analyze --include-system --include-services ssh,system',
      '  logcozcli analyze --include-docker --include-services redis,postgres --exclude-sources docker-daemon',
      '  logcozcli analyze --include-docker --include-system --tail 300 --since 2h --include-reasoning'
    ]
  );

  return program;
}

function resolveComparablePath(input: string | null): string | null {
  if (!input) return null;

  try {
    return realpathSync(input);
  } catch {
    return path.resolve(input);
  }
}

export function isCliEntrypoint(
  entrypointArg: string | null,
  moduleUrl: string,
  resolver: (input: string | null) => string | null = resolveComparablePath
): boolean {
  const entrypointPath = resolver(entrypointArg);
  const currentPath = resolver(fileURLToPath(moduleUrl));
  return entrypointPath === currentPath;
}

const program = createProgram();

if (isCliEntrypoint(process.argv[1] ?? null, import.meta.url)) {
  program.parse();
}
