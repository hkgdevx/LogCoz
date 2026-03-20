/**************************************************************************************************************************
 Copyright (c) 2026

     Name: smoke-check.ts
   Author: Harikrishnan Gangadharan
 Comments:

/**************************************************************************************************************************
 EXPORTS
***************************************************************************************************************************/
export const prePublishSmokeChecks = [
  'pnpm check',
  'pnpm build',
  'pnpm smoke:packaged-cli',
  'pnpm publish --dry-run --no-git-checks --access public --registry https://registry.npmjs.org'
] as const;
