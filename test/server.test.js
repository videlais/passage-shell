import { jest } from '@jest/globals';

// Mock the Playwright-backed runner so server tests stay fast and deterministic.
const runActionsDetailed = jest.fn();

jest.unstable_mockModule('../src/runner.js', () => ({
  runActions: jest.fn(),
  runActionsDetailed
}));

const request = (await import('supertest')).default;
const { app } = await import('../src/web/server.js');

const validHtml = Buffer.from(
  '<!DOCTYPE html><html><body><div id="story">Hi</div></body></html>'
);

/**
 * Build a JSON actions upload buffer.
 * @param {Array} actions - Actions array to serialize.
 * @returns {Buffer} Buffer of serialized JSON.
 */
function actionsBuffer(actions) {
  return Buffer.from(JSON.stringify(actions));
}

beforeEach(() => {
  runActionsDetailed.mockReset();
});

describe('Web server API', () => {
  test('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  describe('POST /api/run validation', () => {
    test('rejects when files are missing', async () => {
      const res = await request(app).post('/api/run');

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/exactly one HTML file/i);
    });

    test('rejects a non-HTML story file', async () => {
      const res = await request(app)
        .post('/api/run')
        .attach('htmlFile', validHtml, 'story.txt')
        .attach('actionsFile', actionsBuffer([{ type: 'getLinks' }]), 'actions.json');

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/\.html or \.htm/i);
    });

    test('rejects a non-JSON actions file', async () => {
      const res = await request(app)
        .post('/api/run')
        .attach('htmlFile', validHtml, 'story.html')
        .attach('actionsFile', actionsBuffer([{ type: 'getLinks' }]), 'actions.txt');

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/must be \.json/i);
    });

    test('rejects invalid JSON content', async () => {
      const res = await request(app)
        .post('/api/run')
        .attach('htmlFile', validHtml, 'story.html')
        .attach('actionsFile', Buffer.from('{ not valid json'), 'actions.json');

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/valid JSON/i);
    });

    test('rejects actions JSON that is not an array', async () => {
      const res = await request(app)
        .post('/api/run')
        .attach('htmlFile', validHtml, 'story.html')
        .attach('actionsFile', Buffer.from(JSON.stringify({})), 'actions.json');

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/must be an array/i);
    });

    test('rejects a non-object action', async () => {
      const res = await request(app)
        .post('/api/run')
        .attach('htmlFile', validHtml, 'story.html')
        .attach('actionsFile', actionsBuffer([null]), 'actions.json');

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/must be an object/i);
    });

    test('rejects an action without a type', async () => {
      const res = await request(app)
        .post('/api/run')
        .attach('htmlFile', validHtml, 'story.html')
        .attach('actionsFile', actionsBuffer([{ selector: '#x' }]), 'actions.json');

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/missing a valid type/i);
    });

    test('rejects an unsupported action type', async () => {
      const res = await request(app)
        .post('/api/run')
        .attach('htmlFile', validHtml, 'story.html')
        .attach('actionsFile', actionsBuffer([{ type: 'teleport' }]), 'actions.json');

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/unsupported type/i);
    });

    test('rejects an action missing a required field', async () => {
      const res = await request(app)
        .post('/api/run')
        .attach('htmlFile', validHtml, 'story.html')
        .attach('actionsFile', actionsBuffer([{ type: 'click' }]), 'actions.json');

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/missing required field: selector/i);
    });
  });

  describe('POST /api/run execution', () => {
    test('returns completed status on a successful run', async () => {
      runActionsDetailed.mockResolvedValue({
        results: [{ action: 'getText', result: { text: 'Hi' } }]
      });

      const res = await request(app)
        .post('/api/run')
        .field('headless', 'true')
        .field('slowMo', '0')
        .field('verbose', 'false')
        .attach('htmlFile', validHtml, 'story.html')
        .attach('actionsFile', actionsBuffer([{ type: 'getText', selector: '#story' }]), 'actions.json');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('completed');
      expect(res.body.error).toBeNull();
      expect(res.body.results).toHaveLength(1);
      expect(typeof res.body.runId).toBe('string');
      expect(runActionsDetailed).toHaveBeenCalledTimes(1);
    });

    test('returns failed status when the runner reports an action error', async () => {
      runActionsDetailed.mockResolvedValue({
        results: [],
        error: { index: 0, action: 'click', message: 'boom' }
      });

      const res = await request(app)
        .post('/api/run')
        .attach('htmlFile', validHtml, 'story.html')
        .attach('actionsFile', actionsBuffer([{ type: 'click', selector: '#x' }]), 'actions.json');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('failed');
      expect(res.body.error).toEqual({ index: 0, action: 'click', message: 'boom' });
    });

    test('returns 500 when the runner throws', async () => {
      runActionsDetailed.mockRejectedValue(new Error('browser crashed'));

      const res = await request(app)
        .post('/api/run')
        .attach('htmlFile', validHtml, 'story.html')
        .attach('actionsFile', actionsBuffer([{ type: 'getText', selector: '#story' }]), 'actions.json');

      expect(res.status).toBe(500);
      expect(res.body.error).toMatch(/browser crashed/i);
    });
  });

  describe('Screenshot downloads', () => {
    /**
     * Run a story whose only action is a screenshot, writing a fake file so the
     * server records the artifact and exposes a download URL.
     * @returns {Promise<object>} The parsed run response body.
     */
    async function runWithScreenshot() {
      runActionsDetailed.mockImplementation(async (_storyPath, actions) => {
        const { writeFile } = await import('fs/promises');

        for (const action of actions) {
          if (action.type === 'screenshot') {
            await writeFile(action.path, Buffer.from('fake-png-data'));
          }
        }

        return { results: [{ action: 'screenshot', result: { screenshot: 'ok' } }] };
      });

      const res = await request(app)
        .post('/api/run')
        .attach('htmlFile', validHtml, 'story.html')
        .attach('actionsFile', actionsBuffer([{ type: 'screenshot', path: 'shot.png' }]), 'actions.json');

      return res.body;
    }

    test('downloads a generated screenshot', async () => {
      const body = await runWithScreenshot();

      expect(body.screenshots).toHaveLength(1);

      const download = await request(app).get(body.screenshots[0].url);

      expect(download.status).toBe(200);
      expect(Buffer.from(download.body).toString()).toContain('fake-png-data');
    });

    test('returns 404 for an unknown run', async () => {
      const res = await request(app).get('/api/runs/does-not-exist/screenshots/shot-1');

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/run not found/i);
    });

    test('returns 404 for an unknown screenshot in a known run', async () => {
      const body = await runWithScreenshot();
      const runId = body.screenshots[0].url.split('/')[3];

      const res = await request(app).get(`/api/runs/${runId}/screenshots/missing-shot`);

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/screenshot not found/i);
    });
  });
});
