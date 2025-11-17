# Passage Shell 2.0 - Quick Start Guide

## Try It Now

The `examples/` folder contains a working example to get you started immediately.

### 1. Install Dependencies

```bash
npm install
npx playwright install chromium
```

### 2. Run the Example

```bash
node cli.js run examples/sample-story.html examples/story-walkthrough.json -v
```

This will:
- Load the sample interactive story
- Execute 9 automated actions
- Show you the results in real-time
- Take a screenshot and save it to `examples/forest-screenshot.png`

### 3. Watch It Happen

To see the browser in action (not headless):

```bash
node cli.js run examples/sample-story.html examples/story-walkthrough.json -v --headless false
```

### 4. Slow It Down

To watch each action slowly:

```bash
node cli.js run examples/sample-story.html examples/story-walkthrough.json -v --headless false --slow-mo 1000
```

## Create Your Own Tests

### 1. Generate a Template

```bash
node cli.js example -o my-actions.json
```

### 2. Edit the Actions File

Open `my-actions.json` and modify the actions to match your HTML file:

```json
[
  {
    "type": "getText",
    "selector": "#story",
    "description": "Get story text"
  },
  {
    "type": "click",
    "selector": "text=Start Game",
    "description": "Begin"
  }
]
```

### 3. Run Your Tests

```bash
node cli.js run your-story.html my-actions.json -v
```

## Common Use Cases

### Test a Twine Story

```json
[
  {
    "type": "waitForSelector",
    "selector": "tw-story",
    "description": "Wait for Twine to load"
  },
  {
    "type": "click",
    "selector": "tw-link >> nth=0",
    "description": "Click first link"
  }
]
```

### Test Form Input

```json
[
  {
    "type": "type",
    "selector": "#player-name",
    "text": "Hero",
    "description": "Enter name"
  },
  {
    "type": "click",
    "selector": "button[type=submit]",
    "description": "Submit form"
  }
]
```

### Capture Screenshots at Key Moments

```json
[
  {
    "type": "click",
    "selector": "text=Continue",
    "description": "Advance story"
  },
  {
    "type": "screenshot",
    "path": "checkpoint-1.png",
    "description": "Save progress"
  }
]
```

## Tips

1. **Find the Right Selector**: Inspect your HTML file to find CSS selectors, IDs, or use text-based selectors
2. **Add Waits**: If content loads dynamically, add `wait` or `waitForSelector` actions
3. **Use Verbose Mode**: The `-v` flag shows you what's happening at each step
4. **Save Results**: Use `-o results.json` to save structured output for analysis

## Next Steps

- Read the full [README.md](README.md) for all action types
- Look at `examples/story-walkthrough.json` for more examples
- Create your own test suites for regression testing
- Integrate with CI/CD pipelines
