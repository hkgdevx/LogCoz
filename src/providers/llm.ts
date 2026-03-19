/**************************************************************************************************************************
 Copyright (c) 2026

     Name: llm.ts
   Author: Harikrishnan Gangadharan
 Comments:

/**************************************************************************************************************************
 IMPORTS
***************************************************************************************************************************/
import OpenAI from 'openai';

/**************************************************************************************************************************
 TYPES / GLOBAL DEFINITIONS
***************************************************************************************************************************/
interface HttpLlmResponse {
  explanation?: string;
  likelyCauses?: string[];
  suggestedFixes?: string[];
  debugCommands?: string[];
  warnings?: string[];
}

interface LlmRefinementPayload {
  explanation?: unknown;
  likelyCauses?: unknown;
  suggestedFixes?: unknown;
  debugCommands?: unknown;
  warnings?: unknown;
}

function sanitizeStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const sanitized = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);

  return sanitized.length > 0 ? sanitized : undefined;
}

function mergeRefinementPayload(
  base: ExplanationResult,
  payload: LlmRefinementPayload
): ExplanationResult {
  return {
    ...base,
    explanation:
      typeof payload.explanation === 'string' && payload.explanation.trim()
        ? payload.explanation.trim()
        : base.explanation,
    likelyCauses: sanitizeStringArray(payload.likelyCauses) ?? base.likelyCauses,
    suggestedFixes: sanitizeStringArray(payload.suggestedFixes) ?? base.suggestedFixes,
    debugCommands: sanitizeStringArray(payload.debugCommands) ?? base.debugCommands,
    warnings: [...(base.warnings ?? []), ...(sanitizeStringArray(payload.warnings) ?? [])]
  };
}

function buildOpenAiPrompt(input: LlmExplainInput, base: ExplanationResult): string {
  return JSON.stringify(
    {
      task: 'Refine the existing diagnostic explanation for a CLI log analysis tool.',
      rules: [
        'Return valid JSON only.',
        'Do not change issueType, title, category, confidence, metadata, or confidenceReasons.',
        'Only refine explanation, likelyCauses, suggestedFixes, debugCommands, and warnings.',
        'If you are unsure, keep the base content semantically equivalent.',
        'Use concise operator-focused language.'
      ],
      expectedShape: {
        explanation: 'string',
        likelyCauses: ['string'],
        suggestedFixes: ['string'],
        debugCommands: ['string'],
        warnings: ['string']
      },
      issue: input.issue,
      raw: input.raw,
      normalized: input.normalized,
      contextHints: input.contextHints,
      base
    },
    null,
    2
  );
}

/**************************************************************************************************************************
 IMPLEMENTATIONS
***************************************************************************************************************************/
export class NoopLlmProvider implements LlmProvider {
  isEnabled(): boolean {
    return false;
  }

  async enhanceExplanation(
    _input: LlmExplainInput,
    base: ExplanationResult
  ): Promise<ExplanationResult> {
    return base;
  }
}

export class MockLlmProvider implements LlmProvider {
  isEnabled(): boolean {
    return true;
  }

  async enhanceExplanation(
    input: LlmExplainInput,
    base: ExplanationResult
  ): Promise<ExplanationResult> {
    const hintText =
      input.contextHints.length > 0
        ? ` Context hints: ${input.contextHints
            .map((hint) => `${hint.key}=${hint.value}`)
            .join(', ')}.`
        : '';

    return {
      ...base,
      explanation: `${base.explanation}${hintText}`,
      warnings: [
        ...(base.warnings ?? []),
        'Using mock LLM provider. Replace with a real provider for production-quality enhancements.'
      ]
    };
  }
}

export class HttpLlmProvider implements LlmProvider {
  constructor(private readonly config: LlmProviderConfig) {}

  isEnabled(): boolean {
    return Boolean(this.config.enabled && this.config.endpoint);
  }

  async enhanceExplanation(
    input: LlmExplainInput,
    base: ExplanationResult
  ): Promise<ExplanationResult> {
    if (!this.config.endpoint) {
      return {
        ...base,
        warnings: [...(base.warnings ?? []), 'LLM endpoint not configured. Using base explanation.']
      };
    }

    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(this.config.apiKey ? { authorization: `Bearer ${this.config.apiKey}` } : {})
      },
      body: JSON.stringify({
        model: this.config.model,
        issue: input.issue,
        raw: input.raw,
        normalized: input.normalized,
        contextHints: input.contextHints,
        base
      })
    });

    if (!response.ok) {
      return {
        ...base,
        warnings: [
          ...(base.warnings ?? []),
          `LLM provider request failed with status ${response.status}. Using base explanation.`
        ]
      };
    }

    const payload = (await response.json()) as HttpLlmResponse;

    return {
      ...base,
      explanation: payload.explanation ?? base.explanation,
      likelyCauses: payload.likelyCauses ?? base.likelyCauses,
      suggestedFixes: payload.suggestedFixes ?? base.suggestedFixes,
      debugCommands: payload.debugCommands ?? base.debugCommands,
      warnings: [...(base.warnings ?? []), ...(payload.warnings ?? [])]
    };
  }
}

export class OpenAiLlmProvider implements LlmProvider {
  private readonly client: OpenAI | null;

  constructor(private readonly config: LlmProviderConfig) {
    this.client = config.apiKey
      ? new OpenAI({
          apiKey: config.apiKey,
          ...(config.baseUrl ? { baseURL: config.baseUrl } : {})
        })
      : null;
  }

  isEnabled(): boolean {
    return Boolean(this.config.enabled && this.client);
  }

  async enhanceExplanation(
    input: LlmExplainInput,
    base: ExplanationResult
  ): Promise<ExplanationResult> {
    if (!this.client) {
      return {
        ...base,
        warnings: [
          ...(base.warnings ?? []),
          'OpenAI provider not configured. Using base explanation.'
        ]
      };
    }

    try {
      const response = await this.client.responses.create({
        model: this.config.model ?? 'gpt-5-mini',
        instructions:
          'You refine root-cause explanations for a CLI log analysis tool. Return valid JSON only.',
        input: buildOpenAiPrompt(input, base)
      });

      const rawOutput = response.output_text?.trim();
      if (!rawOutput) {
        return {
          ...base,
          warnings: [
            ...(base.warnings ?? []),
            'OpenAI provider returned no text. Using base explanation.'
          ]
        };
      }

      const parsed = JSON.parse(rawOutput) as LlmRefinementPayload;
      return mergeRefinementPayload(base, parsed);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown provider error';
      return {
        ...base,
        warnings: [
          ...(base.warnings ?? []),
          `OpenAI provider failed: ${message}. Using base explanation.`
        ]
      };
    }
  }
}

export function resolveLlmConfig(
  options?: Partial<ExplainOptions & PasteOptions>
): LlmProviderConfig {
  const provider =
    options?.llmProvider?.trim().toLowerCase() ??
    process.env.LOGCOZ_LLM_PROVIDER?.trim().toLowerCase() ??
    'noop';

  const enabled = Boolean(options?.llm || process.env.LOGCOZ_LLM_ENABLED === 'true');
  const endpoint = options?.llmEndpoint ?? process.env.LOGCOZ_LLM_ENDPOINT;
  const model = options?.llmModel ?? process.env.LOGCOZ_LLM_MODEL;
  const apiKey = process.env.LOGCOZ_LLM_API_KEY ?? process.env.OPENAI_API_KEY;
  const baseUrl = process.env.LOGCOZ_OPENAI_BASE_URL ?? process.env.OPENAI_BASE_URL;

  return {
    enabled,
    provider,
    ...(endpoint ? { endpoint } : {}),
    ...(model ? { model } : {}),
    ...(apiKey ? { apiKey } : {}),
    ...(baseUrl ? { baseUrl } : {})
  };
}

export function createLlmProvider(config = resolveLlmConfig()): LlmProvider {
  if (!config.enabled) {
    return new NoopLlmProvider();
  }

  if (config.provider === 'mock') {
    return new MockLlmProvider();
  }

  if (config.provider === 'http') {
    return new HttpLlmProvider(config);
  }

  if (config.provider === 'openai') {
    return new OpenAiLlmProvider(config);
  }

  return new NoopLlmProvider();
}
