import request from 'supertest';
import { readFile } from 'fs/promises';
import { join } from 'path';

// This test exercises the full server stack against a real browser via the
// unmocked runner. It is intentionally separate from the mocked server suite.
const { app } = await import('../src/web/server.js');

describe('Web server API (end-to-end)', () => {
  test('POST /api/run completes a real run against the sample story', async () => {
    const storyHtml = await readFile(join(process.cwd(), 'test', 'sample-story.html'));
    const actions = [
      { type: 'getText', selector: '#story', description: 'Read intro' },
      { type: 'getLinks', description: 'List links' }
    ];

    const res = await request(app)
      .post('/api/run')
      .field('headless', 'true')
      .attach('htmlFile', storyHtml, 'sample-story.html')
      .attach('actionsFile', Buffer.from(JSON.stringify(actions)), 'actions.json');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('completed');
    expect(res.body.results).toHaveLength(2);
    expect(res.body.results[0].action).toBe('getText');
    expect(res.body.results[1].action).toBe('getLinks');
  });
}, 30000);
