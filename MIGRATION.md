# Migration Guide: v1.x to v2.0

## What Changed

Passage Shell 2.0 is a **complete rewrite** focused on simplicity and modern tooling.

### Architecture Changes

| v1.x (Old) | v2.0 (New) |
|------------|------------|
| Electron + Express server | Playwright (headless Chrome) |
| IPC channels between processes | Direct browser automation |
| GUI settings window | Command-line interface |
| HTTP API endpoints | JSON action files |
| settings.json configuration | CLI arguments |
| ~500 lines of code | ~200 lines of code |

### Removed

- ❌ Electron dependency (~150MB)
- ❌ Express web server
- ❌ Settings GUI window
- ❌ IPC communication layer
- ❌ settings.json file
- ❌ HTTP routes (/click, /links, etc.)
- ❌ twine2/ loader directory
- ❌ settings/ GUI directory

### Added

- ✅ Playwright automation (~50MB)
- ✅ CLI interface (Commander.js)
- ✅ JSON-based action files
- ✅ 15+ action types
- ✅ Verbose mode
- ✅ Screenshot capability
- ✅ Example files
- ✅ Modern ES modules

## Installation Size Comparison

```
v1.x: ~180MB (node_modules + Electron)
v2.0: ~80MB (node_modules + Playwright binaries)

Reduction: 55% smaller
```

## Code Complexity Comparison

```
v1.x: 
- main.js: ~500 lines
- Test files: 3 files, ~600 lines
- Total: ~1100 lines

v2.0:
- cli.js: ~90 lines
- src/runner.js: ~150 lines
- test/runner.test.js: ~100 lines
- Total: ~340 lines

Reduction: 70% less code
```

## Usage Comparison

### v1.x (Old Way)

1. Create settings.json:
```json
{
  "port": 3000,
  "file": "/absolute/path/to/story.html"
}
```

2. Start Electron app:
```bash
npm start
```

3. Make HTTP requests:
```bash
curl http://localhost:3000/links
curl http://localhost:3000/click/0
curl http://localhost:3000/text
```

### v2.0 (New Way)

1. Create actions.json:
```json
[
  {"type": "getLinks"},
  {"type": "click", "selector": "text=Start"},
  {"type": "getText", "selector": "body"}
]
```

2. Run CLI:
```bash
node cli.js run story.html actions.json -v
```

Done! Results are displayed immediately.

## Migration Steps

If you have existing v1.x tests, here's how to migrate:

### 1. Convert HTTP calls to JSON actions

**Old (v1.x HTTP):**
```bash
curl http://localhost:3000/links
curl http://localhost:3000/click/0
curl http://localhost:3000/text
```

**New (v2.0 JSON):**
```json
[
  {"type": "getLinks", "description": "Get all links"},
  {"type": "click", "selector": "a >> nth=0", "description": "Click first link"},
  {"type": "getText", "selector": "body", "description": "Get page text"}
]
```

### 2. Update selectors

**Old (v1.x):** Links were numbered (0, 1, 2...)
```
/click/0  → Click first link
/click/1  → Click second link
```

**New (v2.0):** Use CSS/text selectors
```json
{"type": "click", "selector": "a >> nth=0"}  // First link
{"type": "click", "selector": "text=Start"}  // Link with text "Start"
{"type": "click", "selector": "#next-btn"}   // Link with ID
```

### 3. Remove polling logic

**Old (v1.x):** Had to poll endpoints every 10ms

**New (v2.0):** Actions run sequentially, no polling needed

### 4. Install new dependencies

```bash
npm install
npx playwright install chromium
```

## Benefits of v2.0

1. **Simpler**: No server, no IPC, no GUI
2. **Faster**: Direct automation without HTTP overhead
3. **Smaller**: 55% reduction in installation size
4. **Modern**: ES modules, Playwright, current best practices
5. **Flexible**: Works with any HTML, not just Twine
6. **Better DX**: Verbose mode, examples, clear output
7. **Maintainable**: 70% less code to maintain

## Support

v1.x is considered legacy and will not receive updates. All future development will focus on v2.0.

For questions or issues, please file a GitHub issue.
