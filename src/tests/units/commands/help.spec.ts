import type { Command } from 'commander';
import { afterEach, describe, expect, it, vi } from 'vitest';

function getSubcommand(command: Command, name: string): Command {
  const match = command.commands.find((candidate) => candidate.name() === name);
  if (!match) {
    throw new Error(`Missing command: ${name}`);
  }
  return match;
}

describe('cli help', () => {
  vi.setConfig({ testTimeout: 15000 });

  afterEach(() => {
    vi.resetModules();
  });

  it('renders common workflows in root help', async () => {
    const { createProgram } = await import('@/cli');
    const program = createProgram();
    const output = program.helpInformation();

    expect(output).toContain('Common Workflows:');
    expect(output).toContain('logcozcli explain ./app.log --include-reasoning');
    expect(output).toContain(
      'logcozcli analyze --include-docker --include-system --html-out ./reports/system-scan.html --recon'
    );
  });

  it('renders examples in explain docker help', async () => {
    const { createProgram } = await import('@/cli');
    const program = createProgram();
    const explainCommand = getSubcommand(program, 'explain');
    const dockerCommand = getSubcommand(explainCommand, 'docker');
    const output = dockerCommand.helpInformation();

    expect(output).toContain('Use this for single-source runtime investigation.');
    expect(output).toContain('logcozcli explain docker --container api');
    expect(output).toContain('If you need cross-source runtime correlation');
  });

  it('renders multi-source guidance in correlate docker help', async () => {
    const { createProgram } = await import('@/cli');
    const program = createProgram();
    const correlateCommand = getSubcommand(program, 'correlate');
    const dockerCommand = getSubcommand(correlateCommand, 'docker');
    const output = dockerCommand.helpInformation();

    expect(output).toContain('This is multi-source runtime correlation.');
    expect(output).toContain('At least two runtime sources are required.');
    expect(output).toContain('logcozcli correlate docker --container api --container nginx');
    expect(output).toContain('--include-system');
    expect(output).toContain('--html-out <file>');
  });

  it('renders grouped analysis examples in analyze help', async () => {
    const { createProgram } = await import('@/cli');
    const program = createProgram();
    const analyzeCommand = getSubcommand(program, 'analyze');
    const output = analyzeCommand.helpInformation();

    expect(output).toContain('Use this for grouped local investigation');
    expect(output).toContain('preferred system-scan workflow');
    expect(output).toContain('Use --recon with --html-out');
    expect(output).toContain('logcozcli analyze --include-docker --json');
    expect(output).toContain('logcozcli analyze --include-system --include-services ssh,system');
    expect(output).toContain(
      'logcozcli analyze --include-docker --include-system --html-out ./reports/system-scan.html'
    );
    expect(output).toContain(
      'logcozcli analyze --include-docker --include-system --html-out ./reports/system-scan.html --recon'
    );
    expect(output).toContain(
      'logcozcli analyze --include-docker --include-system --html-out ./reports/analyze.html'
    );
  });
});
