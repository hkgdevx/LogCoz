/**************************************************************************************************************************
 Copyright (c) 2026

     Name: correlate-docker.ts
   Author: Harikrishnan Gangadharan
 Comments:

/**************************************************************************************************************************
 IMPORTS
***************************************************************************************************************************/
import ora from 'ora';
import { EXIT_CODE_RUNTIME_ERROR, EXIT_CODE_SUCCESS } from '@/constants/exit';
import { createCorrelateOutputEnvelope } from '@/core/output';
import { correlateLogs } from '@/correlation/correlate';
import { annotateSourceForCorrelation, collectCorrelationRuntimeSources } from '@/runtime/collect';

/**************************************************************************************************************************
 IMPLEMENTATIONS
***************************************************************************************************************************/
export async function correlateDocker(options: CorrelateOptions): Promise<void> {
  const spinner = ora('Collecting runtime sources for correlation...').start();

  try {
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

    process.exitCode = envelope.exitCode;
  } catch (error) {
    spinner.fail('Failed to correlate runtime sources');
    console.error(error);
    process.exitCode = EXIT_CODE_RUNTIME_ERROR;
  }
}
