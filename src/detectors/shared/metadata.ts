/**************************************************************************************************************************
 Copyright (c) 2026

     Name: metadata.ts
   Author: Harikrishnan Gangadharan
 Comments: 

/**************************************************************************************************************************
 IMPLEMENTATIONS
***************************************************************************************************************************/
export function extractHostPort(input: string): Record<string, unknown> {
  const match = input.match(/([0-9a-zA-Z._-]+):(\d{2,5})/);

  if (!match) return {};

  return {
    host: match[1],
    port: Number(match[2])
  };
}

export function extractServiceName(input: string): string | undefined {
  const patterns = [
    /\bservice[=: ]([a-zA-Z0-9._-]+)/i,
    /\bcontainer[=: ]([a-zA-Z0-9._-]+)/i,
    /\bpod[=: ]([a-zA-Z0-9._-]+)/i
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return undefined;
}
