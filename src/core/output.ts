/**************************************************************************************************************************
 Copyright (c) 2026

     Name: output.ts
   Author: Harikrishnan Gangadharan
 Comments:

/**************************************************************************************************************************
 IMPORTS
***************************************************************************************************************************/
import { CLI_NAME, CLI_VERSION, JSON_SCHEMA_VERSION } from '@/constants/meta';
import { EXIT_CODE_SUCCESS, EXIT_CODE_UNKNOWN_ISSUE } from '@/constants/exit';

/**************************************************************************************************************************
 IMPLEMENTATIONS
***************************************************************************************************************************/
export function createExplainOutputEnvelope(result: ExplanationResult): ExplainOutputEnvelope {
  const exitCode = result.issueType === 'unknown' ? EXIT_CODE_UNKNOWN_ISSUE : EXIT_CODE_SUCCESS;

  return {
    schemaVersion: JSON_SCHEMA_VERSION,
    cliName: CLI_NAME,
    cliVersion: CLI_VERSION,
    exitCode,
    status: result.issueType === 'unknown' ? 'unknown' : 'detected',
    result
  };
}

export function createCorrelateOutputEnvelope(
  result: CorrelateOutputResult
): CorrelateOutputEnvelope {
  return {
    schemaVersion: JSON_SCHEMA_VERSION,
    cliName: CLI_NAME,
    cliVersion: CLI_VERSION,
    exitCode: EXIT_CODE_SUCCESS,
    status: 'correlated',
    result
  };
}

export function createAnalyzeOutputEnvelope(result: AnalyzeOutputResult): AnalyzeOutputEnvelope {
  return {
    schemaVersion: JSON_SCHEMA_VERSION,
    cliName: CLI_NAME,
    cliVersion: CLI_VERSION,
    exitCode: EXIT_CODE_SUCCESS,
    status: 'analyzed',
    result
  };
}
