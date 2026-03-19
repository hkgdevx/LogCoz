/**************************************************************************************************************************
 Copyright (c) 2026

     Name: llm.spec.ts
   Author: Harikrishnan Gangadharan
 Comments:

/**************************************************************************************************************************
 IMPORTS
***************************************************************************************************************************/
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { createMockResponse, openAiCtor } = vi.hoisted(() => {
  const createMockResponse = vi.fn();
  const openAiCtor = vi.fn(
    class {
      responses = {
        create: createMockResponse
      };
    }
  );

  return { createMockResponse, openAiCtor };
});

vi.mock('openai', () => ({
  default: openAiCtor
}));

import {
  HttpLlmProvider,
  MockLlmProvider,
  NoopLlmProvider,
  OpenAiLlmProvider,
  createLlmProvider,
  resolveLlmConfig
} from '@/providers/llm';

/**************************************************************************************************************************
 TYPES / GLOBAL DEFINITIONS
***************************************************************************************************************************/
const issue: DetectionCandidate = {
  detector: 'redis-detector',
  type: 'redis_connection_refused',
  title: 'Redis connection refused',
  category: 'database',
  confidence: 0.9,
  score: 90,
  specificity: 4,
  evidence: ['Error: connect ECONNREFUSED 127.0.0.1:6379'],
  matchedPatterns: ['ECONNREFUSED', 'redis'],
  summary: 'The application failed to connect to Redis.',
  confidenceReasons: [{ label: 'ECONNREFUSED', impact: 40, source: 'pattern' }]
};

const base: ExplanationResult = {
  issueType: 'redis_connection_refused',
  title: 'Redis connection refused',
  category: 'database',
  confidence: 0.9,
  explanation: 'Base explanation.',
  evidence: ['Error: connect ECONNREFUSED 127.0.0.1:6379'],
  likelyCauses: ['Redis service is not running'],
  suggestedFixes: ['Verify Redis is running'],
  debugCommands: ['docker ps'],
  confidenceReasons: []
};

const llmInput: LlmExplainInput = {
  issue,
  raw: 'Error: connect ECONNREFUSED 127.0.0.1:6379',
  normalized: 'Error: connect ECONNREFUSED 127.0.0.1:6379',
  contextHints: []
};

/**************************************************************************************************************************
 IMPLEMENTATIONS
***************************************************************************************************************************/
describe('llm.provider', () => {
  beforeEach(() => {
    createMockResponse.mockReset();
    openAiCtor.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.LOGCOZ_LLM_PROVIDER;
    delete process.env.LOGCOZ_LLM_ENABLED;
    delete process.env.LOGCOZ_LLM_ENDPOINT;
    delete process.env.LOGCOZ_LLM_MODEL;
    delete process.env.LOGCOZ_LLM_API_KEY;
    delete process.env.LOGCOZ_OPENAI_BASE_URL;
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_BASE_URL;
  });

  it('noop provider returns base explanation unchanged', async () => {
    const provider = new NoopLlmProvider();
    const result = await provider.enhanceExplanation(llmInput, base);

    expect(result).toEqual(base);
  });

  it('mock provider appends a warning', async () => {
    const provider = new MockLlmProvider();
    const result = await provider.enhanceExplanation(
      {
        ...llmInput,
        contextHints: [{ key: 'REDIS_HOST', value: 'localhost', source: '.env' }]
      },
      base
    );

    expect(result.warnings).toBeDefined();
    expect(result.explanation).toContain('Context hints');
  });

  it('http provider merges remote explanation fields', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          explanation: 'Remote explanation.',
          suggestedFixes: ['Restart the target service']
        })
      })
    );

    const provider = new HttpLlmProvider({
      enabled: true,
      provider: 'http',
      endpoint: 'https://llm.internal'
    });

    const result = await provider.enhanceExplanation(llmInput, base);

    expect(result.explanation).toBe('Remote explanation.');
    expect(result.suggestedFixes).toEqual(['Restart the target service']);
  });

  it('openai provider merges valid JSON output from responses api', async () => {
    createMockResponse.mockResolvedValue({
      output_text: JSON.stringify({
        explanation: 'OpenAI refined explanation.',
        likelyCauses: ['Cause A'],
        suggestedFixes: ['Fix A']
      })
    });

    const provider = new OpenAiLlmProvider({
      enabled: true,
      provider: 'openai',
      apiKey: 'test-key',
      model: 'gpt-5-mini'
    });

    const result = await provider.enhanceExplanation(llmInput, base);

    expect(openAiCtor).toHaveBeenCalled();
    expect(createMockResponse).toHaveBeenCalled();
    expect(result.explanation).toBe('OpenAI refined explanation.');
    expect(result.likelyCauses).toEqual(['Cause A']);
  });

  it('openai provider falls back with a warning when output is invalid', async () => {
    createMockResponse.mockResolvedValue({
      output_text: 'not-json'
    });

    const provider = new OpenAiLlmProvider({
      enabled: true,
      provider: 'openai',
      apiKey: 'test-key'
    });

    const result = await provider.enhanceExplanation(llmInput, base);

    expect(result.explanation).toBe(base.explanation);
    expect(result.warnings?.[0]).toContain('OpenAI provider failed');
  });

  it('resolves config from options and env', () => {
    process.env.LOGCOZ_LLM_ENABLED = 'true';
    process.env.LOGCOZ_LLM_PROVIDER = 'openai';
    process.env.OPENAI_API_KEY = 'env-key';
    process.env.LOGCOZ_OPENAI_BASE_URL = 'https://api.openai-proxy.local/v1';

    const config = resolveLlmConfig({
      llmModel: 'gpt-5-mini'
    });

    expect(config.enabled).toBe(true);
    expect(config.provider).toBe('openai');
    expect(config.model).toBe('gpt-5-mini');
    expect(config.apiKey).toBe('env-key');
    expect(config.baseUrl).toBe('https://api.openai-proxy.local/v1');
  });

  it('creates openai provider when enabled via config', () => {
    const provider = createLlmProvider({
      enabled: true,
      provider: 'openai',
      apiKey: 'test-key'
    });

    expect(provider).toBeInstanceOf(OpenAiLlmProvider);
  });
});
