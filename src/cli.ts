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
import { paste } from './commands/paste';
import { correlate } from '@/commands/correlate';

/**************************************************************************************************************************
 TYPES / GLOBAL DEFINITIONS
***************************************************************************************************************************/
const program = new Command();

/**************************************************************************************************************************
 IMPLEMENTATIONS
***************************************************************************************************************************/
program.name(CLI_NAME).description('Find the cause behind logs').version(CLI_VERSION);

program
  .command('explain')
  .description('Analyze a log file and explain the likely root cause')
  .argument('<file>', 'Path to the log file')
  .option('--json', 'Output structured JSON')
  .option('--context <files>', 'Comma-separated context files, e.g. .env,docker-compose.yml')
  .option('--llm', 'Enable LLM-based explanation enhancement')
  .option('--llm-provider <provider>', 'LLM provider, e.g. mock or http')
  .option('--llm-endpoint <url>', 'LLM provider HTTP endpoint')
  .option('--llm-model <model>', 'LLM model identifier for the configured provider')
  .option('--include-reasoning', 'Include detector confidence reasoning in the output')
  .action(explain);

program
  .command('paste')
  .description('Read logs from stdin and analyze them')
  .option('--json', 'Output structured JSON')
  .option('--context <files>', 'Comma-separated context files, e.g. .env,docker-compose.yml')
  .option('--llm', 'Enable LLM-based explanation enhancement')
  .option('--llm-provider <provider>', 'LLM provider, e.g. mock or http')
  .option('--llm-endpoint <url>', 'LLM provider HTTP endpoint')
  .option('--llm-model <model>', 'LLM model identifier for the configured provider')
  .option('--include-reasoning', 'Include detector confidence reasoning in the output')
  .action(paste);

program
  .command('correlate')
  .description('Correlate multiple log files into incident groups')
  .argument('<files...>', 'Paths to log files')
  .option('--json', 'Output structured JSON')
  .action(correlate);

program.parse();
