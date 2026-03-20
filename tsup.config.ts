/**************************************************************************************************************************
 Copyright (c) 2026

     Name: tsup.config.ts
   Author: Harikrishnan Gangadharan
 Comments: 

/**************************************************************************************************************************
 IMPORTS
***************************************************************************************************************************/
import { defineConfig } from 'tsup';

/**************************************************************************************************************************
 TYPES / GLOBAL DEFINITIONS
***************************************************************************************************************************/

export default defineConfig([
  {
    entry: ['src/cli.ts'],
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    splitting: false,
    outDir: 'dist',
    banner: {
      js: '#!/usr/bin/env node'
    }
  },
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: false,
    splitting: false,
    outDir: 'dist'
  }
]);
