/**************************************************************************************************************************
 Copyright (c) 2026

     Name: correlate.ts
   Author: Harikrishnan Gangadharan
 Comments: 

/**************************************************************************************************************************
 IMPORTS
***************************************************************************************************************************/
import ora from 'ora';
import { EXIT_CODE_RUNTIME_ERROR, EXIT_CODE_SUCCESS } from '@/constants/exit';
import { formatCorrelateReport } from '@/core/format';
import { renderCorrelateHtmlReport } from '@/core/html-report';
import { createCorrelateOutputEnvelope } from '@/core/output';
import { readTextFile, writeTextFile } from '@/utils/file';
import { correlateLogs } from '@/correlation/correlate';

/**************************************************************************************************************************
 IMPLEMENTATIONS
***************************************************************************************************************************/
export async function correlate(files: string[], options: CorrelateOptions): Promise<void> {
  const spinner = ora('Correlating logs...').start();

  try {
    if (options.json && options.htmlOut) {
      throw new Error('Cannot use --json and --html-out together.');
    }

    const contents = await Promise.all(files.map((file) => readTextFile(file)));
    const incidents = correlateLogs(contents);
    const envelope = createCorrelateOutputEnvelope({
      incidents,
      count: incidents.length,
      metadata: {
        filesAnalyzed: files.length
      }
    });

    spinner.succeed('Correlation complete');

    if (options.htmlOut) {
      await writeTextFile(
        options.htmlOut,
        renderCorrelateHtmlReport(envelope),
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

    console.log(formatCorrelateReport(envelope.result));
    process.exitCode = EXIT_CODE_SUCCESS;
  } catch (error) {
    spinner.fail('Failed to correlate logs');
    console.error(error);
    process.exitCode = EXIT_CODE_RUNTIME_ERROR;
  }
}
