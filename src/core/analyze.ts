/**************************************************************************************************************************
 Copyright (c) 2026

     Name: analyze.ts
   Author: Harikrishnan Gangadharan
 Comments:

/**************************************************************************************************************************
 IMPORTS
***************************************************************************************************************************/
import { loadContextHints } from '@/core/context';
import { detectIssue } from '@/core/detect';
import { explainIssue } from '@/core/explain';
import { normalizeLog } from '@/core/normalize';
import { extractRelevantBlock } from '@/core/extract';
import { createExplainOutputEnvelope } from '@/core/output';
import { createLlmProvider, resolveLlmConfig } from '@/providers/llm';
import { redactSecrets } from '@/utils/redact';

/**************************************************************************************************************************
 IMPLEMENTATIONS
***************************************************************************************************************************/
export async function analyzeLogInput(
  raw: string,
  options: ExplainOptions | PasteOptions
): Promise<ExplainOutputEnvelope> {
  const explanation = await analyzeExplanation(raw, options);
  return createExplainOutputEnvelope(explanation);
}

export async function analyzeExplanation(
  raw: string,
  options: ExplainOptions | PasteOptions
): Promise<ExplanationResult> {
  const redacted = redactSecrets(raw);
  const normalized = normalizeLog(redacted);
  const extracted = extractRelevantBlock(normalized);

  const contextFiles = options.context
    ? options.context
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  const contextHints = await loadContextHints(contextFiles);

  const ctx: DetectionContext = {
    raw,
    normalized: extracted,
    lines: extracted.split('\n'),
    contextHints
  };

  const issue = detectIssue(ctx);
  let explanation = explainIssue(issue);

  const llmProvider = createLlmProvider(resolveLlmConfig(options));
  if (llmProvider.isEnabled()) {
    explanation = await llmProvider.enhanceExplanation(
      {
        issue,
        raw,
        normalized: extracted,
        contextHints
      },
      explanation
    );
  }

  if (!options.includeReasoning) {
    explanation = {
      ...explanation,
      confidenceReasons: []
    };
  }

  return explanation;
}
