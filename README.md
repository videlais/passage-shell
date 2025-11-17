# Passage Shell 2.0

A minimal CLI tool for automated testing of HTML-based interactive fiction projects (Twine, Ink, ChoiceScript, etc.).

## Features

- 🎯 **Simple CLI** - No GUI, no server, just actions
- 🚀 **Playwright-powered** - Modern browser automation
- 📝 **JSON-based actions** - Define tests in simple JSON files
- 🔍 **Multiple action types** - Click, type, screenshot, and more
- 🎭 **Headless or visual** - Run tests in background or watch them execute
- 📊 **JSON results** - Machine-readable output for CI/CD

## Installation

```bash
npm install
npx playwright install chromium
```

## Quick Start

1. **Generate an example actions file:**
```bash
node cli.js example
```

2. **Run actions on your HTML file:**
```bash
node cli.js run your-story.html actions.json
```

## Usage

```bash
node cli.js run <html-file> <actions-file> [options]

Options:
  -h, --headless       Run in headless mode (default: true)
  -s, --slow-mo <ms>   Slow down operations (default: 0)
  -o, --output <file>  Save results to JSON file
  -v, --verbose        Show detailed output
```

### Example Commands

```bash
# Run with visible browser
node cli.js run story.html actions.json --headless false

# Run slowly to watch actions
node cli.js run story.html actions.json --slow-mo 500 --headless false

# Save results to file
node cli.js run story.html actions.json -o results.json

# Verbose output
node cli.js run story.html actions.json -v
```

## Action Types

Create a JSON file with an array of actions:

```json
[
  {
    "type": "getText",
    "selector": "body",
    "description": "Get page text"
  },
  {
    "type": "click",
    "selector": "text=Start",
    "description": "Click start link"
  },
  {
    "type": "wait",
    "ms": 500,
    "description": "Wait for transition"
  },
  {
    "type": "getLinks",
    "description": "Get all links"
  },
  {
    "type": "screenshot",
    "path": "screenshot.png",
    "description": "Take screenshot"
  }
]
```

### Supported Actions

| Action | Description | Parameters |
|--------|-------------|------------|
| `click` | Click an element | `selector` |
| `getText` | Get text content | `selector` |
| `getHTML` | Get HTML content | `selector` |
| `getLinks` | Get all links | - |
| `type` | Type into input | `selector`, `text` |
| `wait` | Wait milliseconds | `ms` |
| `waitForSelector` | Wait for element | `selector`, `timeout?` |
| `screenshot` | Take screenshot | `path` |
| `hover` | Hover over element | `selector` |
| `getAttribute` | Get attribute value | `selector`, `attribute` |
| `evaluate` | Run JavaScript | `script` |
| `select` | Select dropdown option | `selector`, `value` |
| `check` | Check checkbox | `selector` |
| `uncheck` | Uncheck checkbox | `selector` |
| `goBack` | Browser back | - |
| `goForward` | Browser forward | - |
| `reload` | Reload page | - |

### Selectors

Playwright supports multiple selector types:
- **Text**: `text=Start` or `"text=Click me"`
- **CSS**: `.passage` or `#story`
- **XPath**: `//a[contains(text(), "Next")]`
- **Data attributes**: `[data-passage="intro"]`

## Examples

### Testing a Twine Story

```json
[
  {
    "type": "getText",
    "selector": "tw-story",
    "description": "Get initial passage"
  },
  {
    "type": "click",
    "selector": "text=Begin",
    "description": "Start the story"
  },
  {
    "type": "wait",
    "ms": 300
  },
  {
    "type": "getLinks",
    "description": "Get available choices"
  },
  {
    "type": "click",
    "selector": "tw-link >> nth=0",
    "description": "Click first choice"
  }
]
```

### Testing Any HTML Interactive Fiction

```json
[
  {
    "type": "waitForSelector",
    "selector": "#story",
    "description": "Wait for story to load"
  },
  {
    "type": "getText",
    "selector": "#story",
    "description": "Get current text"
  },
  {
    "type": "click",
    "selector": "a.choice",
    "description": "Click a choice link"
  },
  {
    "type": "screenshot",
    "path": "after-choice.png"
  }
]
```

## Output

With `--verbose` or `--output`, you get structured results:

```json
[
  {
    "action": "getText",
    "description": "Get page text",
    "result": {
      "text": "Welcome to the story..."
    }
  },
  {
    "action": "click",
    "description": "Click start",
    "result": {
      "clicked": "text=Start"
    }
  }
]
```

## Migrating from v1.x

Version 2.0 is a complete rewrite:
- ❌ No more Electron or Express server
- ❌ No more settings.json or GUI
- ✅ Simple CLI with JSON actions
- ✅ Playwright instead of Electron
- ✅ Direct file execution

## Requirements

- Node.js >= 18
- Playwright (auto-installed with npm install)

## License

[MIT](LICENSE.md)
