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
import { renderAnalyzeHtmlReport } from '@/core/html-report';
import { analyzeCollectedSources } from '@/core/runtime-analyze';
import { collectRuntimeSources } from '@/runtime/collect';
import { writeTextFile } from '@/utils/file';

/**************************************************************************************************************************
 IMPLEMENTATIONS
***************************************************************************************************************************/
export async function analyze(options: AnalyzeOptions): Promise<void> {
  const spinner = ora('Collecting runtime logs...').start();

  try {
    if (options.json && options.htmlOut) {
      throw new Error('Cannot use --json and --html-out together.');
    }

    const sources = await collectRuntimeSources(options);
    if (sources.length === 0) {
      spinner.fail('No runtime sources were discovered');
      process.exitCode = EXIT_CODE_RUNTIME_ERROR;
      return;
    }

    const envelope = await analyzeCollectedSources(sources, options);
    spinner.succeed('Runtime analysis complete');

    if (options.htmlOut) {
      await writeTextFile(
        options.htmlOut,
        renderAnalyzeHtmlReport(envelope),
        options.force ? { force: true } : {}
      );
      console.log(`HTML report written to ${options.htmlOut}`);
      process.exitCode = envelope.exitCode;
      return;
    }

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
