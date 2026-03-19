/**************************************************************************************************************************
 Copyright (c) 2026

     Name: paste.ts
   Author: Harikrishnan Gangadharan
 Comments: 

/**************************************************************************************************************************
 IMPORTS
***************************************************************************************************************************/
import ora from 'ora';
import { analyzeLogInput } from '@/core/analyze';
import { formatExplanation } from '@/core/format';
import { EXIT_CODE_RUNTIME_ERROR } from '@/constants/exit';
import { readFromStdin } from '@/utils/file';

/**************************************************************************************************************************
 IMPLEMENTATIONS
***************************************************************************************************************************/
export async function paste(options: PasteOptions): Promise<void> {
  const spinner = ora('Reading pasted logs from stdin...').start();

  try {
    const raw = await readFromStdin();

    if (!raw.trim()) {
      spinner.fail('No input received from stdin');
      process.exitCode = EXIT_CODE_RUNTIME_ERROR;
      return;
    }

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
    spinner.fail('Failed to analyze pasted logs');
    console.error(error);
    process.exitCode = EXIT_CODE_RUNTIME_ERROR;
  }
}
