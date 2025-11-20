import { runActions } from '../src/runner.js';
import { existsSync } from 'fs';
import { writeFile, unlink, readFile } from 'fs/promises';
import { join } from 'path';

// Mock HTML file for testing
const testHtml = `
<!DOCTYPE html>
<html>
<head><title>Test Story</title></head>
<body>
  <div id="story" data-state="initial">
    <p>Welcome to the test story.</p>
    <a href="#" id="link1">First Link</a>
    <a href="#" id="link2">Second Link</a>
    <input type="text" id="nameInput" placeholder="Enter name" />
    <input type="checkbox" id="agreeCheckbox" />
    <select id="choiceSelect">
      <option value="option1">Option 1</option>
      <option value="option2">Option 2</option>
      <option value="option3">Option 3</option>
    </select>
  </div>
  <script>
    document.getElementById('link1').addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('story').innerHTML = '<p>You clicked the first link!</p><a href="#" id="backLink">Go back</a>';
      setupBackLink();
    });
    
    function setupBackLink() {
      const backLink = document.getElementById('backLink');
      if (backLink) {
        backLink.addEventListener('click', (e) => {
          e.preventDefault();
          window.history.back();
        });
      }
    }
  </script>
</body>
</html>
`;

describe('Action Runner', () => {
  let testHtmlPath;
  
  beforeAll(async () => {
    testHtmlPath = join(process.cwd(), 'test-story.html');
    await writeFile(testHtmlPath, testHtml);
  });
  
  afterAll(async () => {
    if (existsSync(testHtmlPath)) {
      await unlink(testHtmlPath);
    }
  });
  
  test('should execute getText action', async () => {
    const actions = [
      { type: 'getText', selector: '#story', description: 'Get story text' }
    ];
    
    const results = await runActions(testHtmlPath, actions);
    
    expect(results).toHaveLength(1);
    expect(results[0].action).toBe('getText');
    expect(results[0].result.text).toContain('Welcome to the test story');
  });
  
  test('should execute click action', async () => {
    const actions = [
      { type: 'click', selector: '#link1', description: 'Click first link' },
      { type: 'wait', ms: 100 },
      { type: 'getText', selector: '#story', description: 'Get updated text' }
    ];
    
    const results = await runActions(testHtmlPath, actions);
    
    expect(results).toHaveLength(3);
    expect(results[2].result.text).toContain('You clicked the first link');
  });
  
  test('should execute getLinks action', async () => {
    const actions = [
      { type: 'getLinks', description: 'Get all links' }
    ];
    
    const results = await runActions(testHtmlPath, actions);
    
    expect(results).toHaveLength(1);
    expect(results[0].result.links).toHaveLength(2);
    expect(results[0].result.links[0].text).toBe('First Link');
  });
  
  test('should handle multiple actions in sequence', async () => {
    const actions = [
      { type: 'getText', selector: '#story' },
      { type: 'getLinks' },
      { type: 'click', selector: '#link1' },
      { type: 'wait', ms: 50 },
      { type: 'getText', selector: '#story' }
    ];
    
    const results = await runActions(testHtmlPath, actions);
    
    expect(results).toHaveLength(5);
    expect(results[0].action).toBe('getText');
    expect(results[1].action).toBe('getLinks');
    expect(results[2].action).toBe('click');
  });
  
  test('should throw error for non-existent file', async () => {
    const actions = [{ type: 'getText', selector: 'body' }];
    
    await expect(
      runActions('/non/existent/file.html', actions)
    ).rejects.toThrow('HTML file not found');
  });
  
  test('should handle wait action', async () => {
    const actions = [
      { type: 'wait', ms: 100, description: 'Wait 100ms' }
    ];
    
    const results = await runActions(testHtmlPath, actions);
    
    expect(results).toHaveLength(1);
    expect(results[0].result.waited).toBe(100);
  });

  test('should execute getHTML action', async () => {
    const actions = [
      { type: 'getHTML', selector: '#story', description: 'Get story HTML' }
    ];
    
    const results = await runActions(testHtmlPath, actions);
    
    expect(results).toHaveLength(1);
    expect(results[0].action).toBe('getHTML');
    expect(results[0].result.html).toContain('Welcome to the test story');
    expect(results[0].result.html).toContain('<a');
  });

  test('should execute type action', async () => {
    const actions = [
      { type: 'type', selector: '#nameInput', text: 'John Doe', description: 'Enter name' },
      { type: 'evaluate', script: 'document.querySelector("#nameInput").value' }
    ];
    
    const results = await runActions(testHtmlPath, actions);
    
    expect(results).toHaveLength(2);
    expect(results[0].action).toBe('type');
    expect(results[0].result.typed).toBe('John Doe');
    expect(results[1].result.evaluated).toBe('John Doe');
  });

  test('should execute getAttribute action', async () => {
    const actions = [
      { type: 'getAttribute', selector: '#story', attribute: 'data-state', description: 'Get state' }
    ];
    
    const results = await runActions(testHtmlPath, actions);
    
    expect(results).toHaveLength(1);
    expect(results[0].action).toBe('getAttribute');
    expect(results[0].result.attribute).toBe('data-state');
    expect(results[0].result.value).toBe('initial');
  });

  test('should execute hover action', async () => {
    const actions = [
      { type: 'hover', selector: '#link1', description: 'Hover over link' }
    ];
    
    const results = await runActions(testHtmlPath, actions);
    
    expect(results).toHaveLength(1);
    expect(results[0].action).toBe('hover');
    expect(results[0].result.hovered).toBe('#link1');
  });

  test('should execute select action', async () => {
    const actions = [
      { type: 'select', selector: '#choiceSelect', value: 'option2', description: 'Select option' },
      { type: 'evaluate', script: 'document.querySelector("#choiceSelect").value' }
    ];
    
    const results = await runActions(testHtmlPath, actions);
    
    expect(results).toHaveLength(2);
    expect(results[0].action).toBe('select');
    expect(results[0].result.selected).toBe('option2');
    expect(results[1].result.evaluated).toBe('option2');
  });

  test('should execute check action', async () => {
    const actions = [
      { type: 'check', selector: '#agreeCheckbox', description: 'Check checkbox' }
    ];
    
    const results = await runActions(testHtmlPath, actions);
    
    expect(results).toHaveLength(1);
    expect(results[0].action).toBe('check');
    expect(results[0].result.checked).toBe('#agreeCheckbox');
  });

  test('should execute uncheck action', async () => {
    const actions = [
      { type: 'check', selector: '#agreeCheckbox' },
      { type: 'uncheck', selector: '#agreeCheckbox', description: 'Uncheck checkbox' }
    ];
    
    const results = await runActions(testHtmlPath, actions);
    
    expect(results).toHaveLength(2);
    expect(results[1].action).toBe('uncheck');
    expect(results[1].result.unchecked).toBe('#agreeCheckbox');
  });

  test('should execute evaluate action', async () => {
    const actions = [
      { type: 'evaluate', script: 'document.title', description: 'Get page title' }
    ];
    
    const results = await runActions(testHtmlPath, actions);
    
    expect(results).toHaveLength(1);
    expect(results[0].action).toBe('evaluate');
    expect(results[0].result.evaluated).toBe('Test Story');
  });

  test('should execute screenshot action', async () => {
    const screenshotPath = join(process.cwd(), 'test-screenshot.png');
    const actions = [
      { type: 'screenshot', path: screenshotPath, description: 'Take screenshot' }
    ];
    
    const results = await runActions(testHtmlPath, actions);
    
    expect(results).toHaveLength(1);
    expect(results[0].action).toBe('screenshot');
    expect(results[0].result.screenshot).toBe(screenshotPath);
    expect(existsSync(screenshotPath)).toBe(true);
    
    // Clean up
    await unlink(screenshotPath);
  });

  test('should execute waitForSelector action', async () => {
    const actions = [
      { type: 'waitForSelector', selector: '#story', timeout: 5000, description: 'Wait for story' }
    ];
    
    const results = await runActions(testHtmlPath, actions);
    
    expect(results).toHaveLength(1);
    expect(results[0].action).toBe('waitForSelector');
    expect(results[0].result.found).toBe('#story');
  });

  test('should execute goBack and goForward actions', async () => {
    const actions = [
      { type: 'click', selector: '#link1' },
      { type: 'wait', ms: 100 },
      { type: 'goBack', description: 'Navigate back' },
      { type: 'wait', ms: 100 },
      { type: 'goForward', description: 'Navigate forward' }
    ];
    
    const results = await runActions(testHtmlPath, actions);
    
    expect(results).toHaveLength(5);
    expect(results[2].action).toBe('goBack');
    expect(results[2].result.action).toBe('goBack');
    expect(results[4].action).toBe('goForward');
    expect(results[4].result.action).toBe('goForward');
  });

  test('should execute reload action', async () => {
    const actions = [
      { type: 'click', selector: '#link1' },
      { type: 'wait', ms: 100 },
      { type: 'reload', description: 'Reload page' },
      { type: 'wait', ms: 100 },
      { type: 'getText', selector: '#story' }
    ];
    
    const results = await runActions(testHtmlPath, actions);
    
    expect(results).toHaveLength(5);
    expect(results[2].action).toBe('reload');
    expect(results[2].result.action).toBe('reload');
    // After reload, should see original content
    expect(results[4].result.text).toContain('Welcome to the test story');
  });

  test('should handle verbose mode', async () => {
    const originalLog = console.log;
    const logCalls = [];
    console.log = (...args) => logCalls.push(args);
    
    const actions = [
      { type: 'getText', selector: '#story', description: 'Get text with verbose' },
      { type: 'getLinks', description: 'Get links with verbose' }
    ];
    
    await runActions(testHtmlPath, actions, { verbose: true });
    
    expect(logCalls.length).toBeGreaterThan(0);
    expect(logCalls.some(call => 
      call[0].includes('Get text with verbose')
    )).toBe(true);
    
    console.log = originalLog;
  });

  test('should handle headless and slowMo options', async () => {
    const actions = [
      { type: 'getText', selector: '#story' }
    ];
    
    const results = await runActions(testHtmlPath, actions, { 
      headless: true, 
      slowMo: 10 
    });
    
    expect(results).toHaveLength(1);
    expect(results[0].action).toBe('getText');
  });

  test('should throw error for unknown action type', async () => {
    const actions = [
      { type: 'unknownAction', selector: '#story' }
    ];
    
    await expect(
      runActions(testHtmlPath, actions)
    ).rejects.toThrow('Unknown action type: unknownAction');
  });

  test('should work with sample-story.html', async () => {
    const sampleStoryPath = join(process.cwd(), 'test', 'sample-story.html');
    
    if (!existsSync(sampleStoryPath)) {
      // Skip if file doesn't exist
      return;
    }
    
    const actions = [
      { type: 'getText', selector: '#story' },
      { type: 'getLinks' }
    ];
    
    const results = await runActions(sampleStoryPath, actions);
    
    expect(results).toHaveLength(2);
    expect(results[0].result.text).toContain('crossroads');
  });

  test('should work with story-walkthrough.json actions', async () => {
    const sampleStoryPath = join(process.cwd(), 'test', 'sample-story.html');
    const walkthroughPath = join(process.cwd(), 'test', 'story-walkthrough.json');
    
    if (!existsSync(sampleStoryPath) || !existsSync(walkthroughPath)) {
      // Skip if files don't exist
      return;
    }
    
    const walkthroughData = await readFile(walkthroughPath, 'utf-8');
    const actions = JSON.parse(walkthroughData);
    
    const results = await runActions(sampleStoryPath, actions.slice(0, 5));
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].action).toBe('getText');
  });
}, 30000); // Increase timeout for browser operations
