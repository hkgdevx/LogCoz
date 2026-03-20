/**************************************************************************************************************************
 Copyright (c) 2026

     Name: analyze.ts
   Author: Harikrishnan Gangadharan
 Comments:

/**************************************************************************************************************************
 IMPORTS
***************************************************************************************************************************/
import ora from 'ora';
import { EXIT_CODE_RUNTIME_ERROR } from '@/constants/exit';
import { formatAnalyzeReport } from '@/core/format';
import { analyzeCollectedSources } from '@/core/runtime-analyze';
import { collectRuntimeSources } from '@/runtime/collect';

/**************************************************************************************************************************
 IMPLEMENTATIONS
***************************************************************************************************************************/
export async function analyze(options: AnalyzeOptions): Promise<void> {
  const spinner = ora('Collecting runtime logs...').start();

  try {
    const sources = await collectRuntimeSources(options);
    if (sources.length === 0) {
      spinner.fail('No runtime sources were discovered');
      process.exitCode = EXIT_CODE_RUNTIME_ERROR;
      return;
    }

    const envelope = await analyzeCollectedSources(sources, options);
    spinner.succeed('Runtime analysis complete');

    if (options.json) {
      console.log(JSON.stringify(envelope, null, 2));
      process.exitCode = envelope.exitCode;
      return;
    }

    console.log(formatAnalyzeReport(envelope.result));
    process.exitCode = envelope.exitCode;
  } catch (error) {
    spinner.fail('Failed to analyze runtime logs');
    console.error(error);
    process.exitCode = EXIT_CODE_RUNTIME_ERROR;
  }
}
