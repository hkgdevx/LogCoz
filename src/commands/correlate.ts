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
import { createCorrelateOutputEnvelope } from '@/core/output';
import { readTextFile } from '@/utils/file';
import { correlateLogs } from '@/correlation/correlate';

/**************************************************************************************************************************
 IMPLEMENTATIONS
***************************************************************************************************************************/
export async function correlate(files: string[], options: CorrelateOptions): Promise<void> {
  const spinner = ora('Correlating logs...').start();

  try {
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

    if (options.json) {
      console.log(JSON.stringify(envelope, null, 2));
      process.exitCode = envelope.exitCode;
      return;
    }

    if (incidents.length === 0) {
      console.log('No correlated incidents found.');
      process.exitCode = EXIT_CODE_SUCCESS;
      return;
    }

    for (const incident of incidents) {
      console.log(`\nIncident: ${incident.title}`);
      console.log(`Confidence: ${(incident.confidence * 100).toFixed(0)}%`);
      console.log(`Shared keys: ${JSON.stringify(incident.sharedKeys)}`);
      console.log('Timeline:');
      for (const event of incident.timeline.slice(0, 10)) {
        console.log(`- ${event.timestamp ?? 'unknown-time'} | ${event.message}`);
      }
    }
    process.exitCode = EXIT_CODE_SUCCESS;
  } catch (error) {
    spinner.fail('Failed to correlate logs');
    console.error(error);
    process.exitCode = EXIT_CODE_RUNTIME_ERROR;
  }
}
