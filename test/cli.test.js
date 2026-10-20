import { spawnSync } from 'child_process';
import { resolve } from 'path';

describe('CLI options', () => {
  test('accepts --headless false after positional arguments', () => {
    const result = spawnSync(
      process.execPath,
      [
        'cli.js',
        'run',
        resolve('missing-story.html'),
        resolve('test/story-walkthrough.json'),
        '--headless',
        'false'
      ],
      { encoding: 'utf8' }
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('HTML file not found');
    expect(result.stderr).not.toContain('too many arguments');
  });
});
