/**************************************************************************************************************************
 Copyright (c) 2026

     Name: explain.ts
   Author: Harikrishnan Gangadharan
 Comments: 

/**************************************************************************************************************************
 IMPORTS
***************************************************************************************************************************/
import ora from 'ora';
import { analyzeLogInput } from '@/core/analyze';
import { formatExplanation } from '@/core/format';
import { EXIT_CODE_RUNTIME_ERROR } from '@/constants/exit';
import { readTextFile } from '@/utils/file';

/**************************************************************************************************************************
 IMPLEMENTATIONS
***************************************************************************************************************************/
export async function explain(file: string, options: ExplainOptions): Promise<void> {
  const spinner = ora('Analyzing logs...').start();

  try {
    const raw = await readTextFile(file);
    const envelope = await analyzeLogInput(raw, options);

    spinner.succeed('Analysis complete');

    if (options.json) {
      console.log(JSON.stringify(envelope, null, 2));
      process.exitCode = envelope.exitCode;
      return;
    }

    console.log(formatExplanation(envelope.result));
    process.exitCode = envelope.exitCode;
  } catch (error) {
    spinner.fail('Failed to analyze logs');
    console.error(error);
    process.exitCode = EXIT_CODE_RUNTIME_ERROR;
  }
}
