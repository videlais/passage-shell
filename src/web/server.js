import express from 'express';
import multer from 'multer';
import { mkdtemp, mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { basename, extname, join, resolve } from 'path';
import { tmpdir } from 'os';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import { runActionsDetailed } from '../runner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');
const projectRoot = resolve(__dirname, '..', '..');
const webDistDir = resolve(projectRoot, 'dist', 'web');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const runStore = new Map();

const ACTION_RULES = {
  click: ['selector'],
  getText: ['selector'],
  getHTML: ['selector'],
  getLinks: [],
  type: ['selector', 'text'],
  wait: ['ms'],
  waitForSelector: ['selector'],
  screenshot: [],
  evaluate: ['script'],
  getAttribute: ['selector', 'attribute'],
  hover: ['selector'],
  select: ['selector', 'value'],
  check: ['selector'],
  uncheck: ['selector'],
  goBack: [],
  goForward: [],
  reload: []
};

/**
 *
 * @param input
 * @param fallback
 */
function toBool(input, fallback = true) {
  if (typeof input === 'boolean') {
    return input;
  }

  if (typeof input === 'string') {
    if (input.toLowerCase() === 'true') {
      return true;
    }

    if (input.toLowerCase() === 'false') {
      return false;
    }
  }

  return fallback;
}

/**
 *
 * @param input
 * @param fallback
 */
function toInt(input, fallback = 0) {
  const parsed = Number.parseInt(input, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

/**
 *
 * @param fileName
 */
function isHtmlFile(fileName) {
  const extension = extname(fileName).toLowerCase();
  return extension === '.html' || extension === '.htm';
}

/**
 *
 * @param fileName
 */
function isJsonFile(fileName) {
  return extname(fileName).toLowerCase() === '.json';
}

/**
 *
 * @param raw
 * @param index
 */
function safeScreenshotFileName(raw, index) {
  const proposed = raw && typeof raw === 'string' ? basename(raw) : `screenshot-${index + 1}.png`;
  const clean = proposed.replace(/[^a-zA-Z0-9._-]/g, '-');
  return clean.toLowerCase().endsWith('.png') ? clean : `${clean}.png`;
}

/**
 *
 * @param fileBuffer
 */
function parseActionsJson(fileBuffer) {
  const text = fileBuffer.toString('utf-8');

  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Actions file must contain valid JSON.');
  }
}

/**
 *
 * @param actions
 */
function validateActions(actions) {
  if (!Array.isArray(actions)) {
    throw new Error('Actions JSON must be an array.');
  }

  actions.forEach((action, index) => {
    if (!action || typeof action !== 'object') {
      throw new Error(`Action ${index + 1} must be an object.`);
    }

    if (!action.type || typeof action.type !== 'string') {
      throw new Error(`Action ${index + 1} is missing a valid type.`);
    }

    const requiredFields = ACTION_RULES[action.type];

    if (!requiredFields) {
      throw new Error(`Action ${index + 1} has unsupported type: ${action.type}`);
    }

    requiredFields.forEach((field) => {
      if (action[field] === undefined || action[field] === null || action[field] === '') {
        throw new Error(`Action ${index + 1} (${action.type}) is missing required field: ${field}`);
      }
    });
  });
}

/**
 *
 * @param actions
 * @param screenshotsDir
 */
function normalizeScreenshotActions(actions, screenshotsDir) {
  const screenshotArtifacts = [];

  const normalized = actions.map((action, index) => {
    if (action.type !== 'screenshot') {
      return action;
    }

    const fileName = safeScreenshotFileName(action.path, index);
    const filePath = join(screenshotsDir, fileName);
    const id = `shot-${screenshotArtifacts.length + 1}`;

    screenshotArtifacts.push({ id, fileName, filePath });

    return {
      ...action,
      path: filePath
    };
  });

  return {
    normalized,
    screenshotArtifacts
  };
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post(
  '/api/run',
  upload.fields([
    { name: 'htmlFile', maxCount: 1 },
    { name: 'actionsFile', maxCount: 1 }
  ]),
  async (req, res) => {
    const htmlUpload = req.files?.htmlFile?.[0];
    const actionsUpload = req.files?.actionsFile?.[0];

    if (!htmlUpload || !actionsUpload) {
      return res.status(400).json({
        error: 'Please upload exactly one HTML file and one JSON actions file.'
      });
    }

    if (!isHtmlFile(htmlUpload.originalname)) {
      return res.status(400).json({
        error: 'The uploaded story file must be .html or .htm.'
      });
    }

    if (!isJsonFile(actionsUpload.originalname)) {
      return res.status(400).json({
        error: 'The uploaded actions file must be .json.'
      });
    }

    let actions;

    try {
      actions = parseActionsJson(actionsUpload.buffer);
      validateActions(actions);
    } catch (error) {
      return res.status(400).json({
        error: error.message
      });
    }

    const runId = randomUUID();
    const logs = [];

    try {
      const runDir = await mkdtemp(join(tmpdir(), 'passage-shell-web-'));
      const storyPath = join(runDir, basename(htmlUpload.originalname));
      const screenshotsDir = join(runDir, 'screenshots');

      await mkdir(screenshotsDir, { recursive: true });
      await writeFile(storyPath, htmlUpload.buffer);

      const { normalized, screenshotArtifacts } = normalizeScreenshotActions(actions, screenshotsDir);

      const runResult = await runActionsDetailed(storyPath, normalized, {
        headless: toBool(req.body?.headless, true),
        slowMo: toInt(req.body?.slowMo, 0),
        verbose: toBool(req.body?.verbose, false),
        onEvent: (event) => logs.push(event)
      });

      const availableScreenshots = screenshotArtifacts
        .filter((artifact) => existsSync(artifact.filePath))
        .map((artifact) => ({
          id: artifact.id,
          fileName: artifact.fileName,
          filePath: artifact.filePath,
          url: `/api/runs/${runId}/screenshots/${artifact.id}`
        }));

      runStore.set(runId, {
        screenshots: availableScreenshots,
        createdAt: Date.now()
      });

      return res.json({
        runId,
        status: runResult.error ? 'failed' : 'completed',
        results: runResult.results,
        error: runResult.error || null,
        logs,
        screenshots: availableScreenshots.map((shot) => ({
          id: shot.id,
          fileName: shot.fileName,
          url: shot.url
        }))
      });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : String(error),
        logs
      });
    }
  }
);

app.get('/api/runs/:runId/screenshots/:shotId', (req, res) => {
  const { runId, shotId } = req.params;
  const run = runStore.get(runId);

  if (!run) {
    return res.status(404).json({ error: 'Run not found.' });
  }

  const screenshot = run.screenshots.find((item) => item.id === shotId);

  if (!screenshot || !existsSync(screenshot.filePath)) {
    return res.status(404).json({ error: 'Screenshot not found.' });
  }

  return res.download(screenshot.filePath, screenshot.fileName);
});

if (existsSync(webDistDir)) {
  app.use(express.static(webDistDir));

  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }

    if (req.method !== 'GET') {
      return next();
    }

    return res.sendFile(join(webDistDir, 'index.html'));
  });
}

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`passage-shell web server running at http://localhost:${port}`);
});
