/**************************************************************************************************************************
 Copyright (c) 2026

     Name: correlate-docker.ts
   Author: Harikrishnan Gangadharan
 Comments:

/**************************************************************************************************************************
 IMPORTS
***************************************************************************************************************************/
import ora from 'ora';
import { EXIT_CODE_RUNTIME_ERROR } from '@/constants/exit';
import { formatCorrelateReport } from '@/core/format';
import { renderCorrelateHtmlReport } from '@/core/html-report';
import { createCorrelateOutputEnvelope } from '@/core/output';
import { correlateLogs } from '@/correlation/correlate';
import { annotateSourceForCorrelation, collectCorrelationRuntimeSources } from '@/runtime/collect';
import { writeTextFile } from '@/utils/file';

/**************************************************************************************************************************
 IMPLEMENTATIONS
***************************************************************************************************************************/
export async function correlateDocker(options: CorrelateOptions): Promise<void> {
  const spinner = ora('Collecting runtime sources for correlation...').start();

  try {
    if (options.json && options.htmlOut) {
      throw new Error('Cannot use --json and --html-out together.');
    }

    const sources = await collectCorrelationRuntimeSources(options);
    if (sources.length === 0) {
      spinner.fail('No matching runtime sources were found');
      process.exitCode = EXIT_CODE_RUNTIME_ERROR;
      return;
    }

    if (sources.length < 2) {
      spinner.fail('Runtime correlation requires at least two sources');
      process.exitCode = EXIT_CODE_RUNTIME_ERROR;
      return;
    }

    const incidents = correlateLogs(sources.map((source) => annotateSourceForCorrelation(source)));
    const envelope = createCorrelateOutputEnvelope({
      incidents,
      count: incidents.length,
      metadata: {
        sourcesAnalyzed: sources.length,
        sourceNames: sources.map((source) => source.displayName),
        sourceKinds: sources.map((source) => source.kind)
      }
    });

    spinner.succeed('Runtime correlation complete');

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

    process.exitCode = envelope.exitCode;
  } catch (error) {
    spinner.fail('Failed to correlate runtime sources');
    console.error(error);
    process.exitCode = EXIT_CODE_RUNTIME_ERROR;
  }
}
