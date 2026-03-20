/**************************************************************************************************************************
 Copyright (c) 2026

     Name: cli.ts
   Author: Harikrishnan Gangadharan
 Comments: 

/**************************************************************************************************************************
 IMPORTS
***************************************************************************************************************************/
import { Command } from 'commander';
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
const program = new Command();

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

/**************************************************************************************************************************
 IMPLEMENTATIONS
***************************************************************************************************************************/
program.name(CLI_NAME).description('Find the cause behind logs').version(CLI_VERSION);

const explainCommand = program.command('explain');

addExplainLikeOptions(
  explainCommand
    .description('Analyze a log file and explain the likely root cause')
    .argument('<file>', 'Path to the log file')
).action(explain);

addRuntimeSourceOptions(
  addExplainLikeOptions(
    explainCommand
      .command('docker')
      .description('Collect Docker container logs and explain the likely root cause')
  )
).action(explainDocker);

addExplainLikeOptions(
  program.command('paste').description('Read logs from stdin and analyze them')
).action(paste);

const correlateCommand = program.command('correlate');

correlateCommand
  .description('Correlate multiple log files into incident groups')
  .argument('<files...>', 'Paths to log files')
  .option('--json', 'Output structured JSON')
  .action(correlate);

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
).action(correlateDocker);

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
  )
).action(analyze);

program.parse();
