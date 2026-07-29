import { jest } from '@jest/globals';
import { mkdirSync, writeFileSync, unlinkSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

// Create a real dist/web/index.html so server.js finds it at module-load time,
// avoiding any need to mock the entire fs module (which causes heap overflow).
const projectRoot = resolve(fileURLToPath(import.meta.url), '..', '..');
const webDistDir = resolve(projectRoot, 'dist', 'web');
const indexPath = resolve(webDistDir, 'index.html');
const SPA_HTML = '<html><body>SPA</body></html>';

mkdirSync(webDistDir, { recursive: true });
writeFileSync(indexPath, SPA_HTML);

jest.unstable_mockModule('../src/runner.js', () => ({
  runActions: jest.fn(),
  runActionsDetailed: jest.fn(),
}));

const request = (await import('supertest')).default;
const { app } = await import('../src/web/server.js');

afterAll(() => {
  try { unlinkSync(indexPath); } catch {}
});

describe('SPA static middleware', () => {
  // Use a path with no corresponding static file so express.static calls next()
  // and the SPA fallback middleware serves the cached index.html.
  test('serves cached index.html for non-existent static routes', async () => {
    const res = await request(app).get('/some-spa-route');
    expect(res.status).toBe(200);
    expect(res.type).toMatch(/html/);
    expect(res.text).toContain('SPA');
  });

  test('passes API requests through to route handlers', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  test('passes non-GET requests through without serving SPA', async () => {
    const res = await request(app).delete('/some-page');
    expect(res.text).not.toContain('SPA');
  });
});
