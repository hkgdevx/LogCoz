/**************************************************************************************************************************
 Copyright (c) 2026

     Name: platform.ts
   Author: Harikrishnan Gangadharan
 Comments:

/**************************************************************************************************************************
 IMPLEMENTATIONS
***************************************************************************************************************************/
export function isWindowsPlatform(platform = process.platform): boolean {
  return platform === 'win32';
}

// Keep user-facing debug commands practical on both Linux and Windows shells.
export function pickPlatformCommands(
  unixCommands: string[],
  windowsCommands: string[],
  platform = process.platform
): string[] {
  return isWindowsPlatform(platform) ? windowsCommands : unixCommands;
}
