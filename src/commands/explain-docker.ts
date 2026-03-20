/**************************************************************************************************************************
 Copyright (c) 2026

     Name: explain-docker.ts
   Author: Harikrishnan Gangadharan
 Comments:

/**************************************************************************************************************************
 IMPORTS
***************************************************************************************************************************/
import ora from 'ora';
import { analyzeLogInput } from '@/core/analyze';
import { formatExplanation } from '@/core/format';
import { EXIT_CODE_RUNTIME_ERROR } from '@/constants/exit';
import { collectDockerSources } from '@/runtime/collect';

/**************************************************************************************************************************
 IMPLEMENTATIONS
***************************************************************************************************************************/
export async function explainDocker(options: ExplainOptions): Promise<void> {
  const spinner = ora('Collecting Docker logs...').start();

  try {
    const sources = await collectDockerSources(options);
    if (sources.length === 0) {
      spinner.fail('No matching Docker containers were found');
      process.exitCode = EXIT_CODE_RUNTIME_ERROR;
      return;
    }

    const raw = sources.map((source) => source.raw).join('\n');
    const envelope = await analyzeLogInput(raw, options);
    envelope.result.metadata = {
      ...(envelope.result.metadata ?? {}),
      sourceNames: sources.map((source) => source.displayName),
      sourceCount: sources.length
    };

    spinner.succeed('Docker analysis complete');

    if (options.json) {
      console.log(JSON.stringify(envelope, null, 2));
      process.exitCode = envelope.exitCode;
      return;
    }

    console.log(formatExplanation(envelope.result));
    process.exitCode = envelope.exitCode;
  } catch (error) {
    spinner.fail('Failed to analyze Docker logs');
    console.error(error);
    process.exitCode = EXIT_CODE_RUNTIME_ERROR;
  }
}
