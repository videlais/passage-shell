import { runActions } from '../src/runner.js';
import { existsSync } from 'fs';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';

// Mock HTML file for testing
const testHtml = `
<!DOCTYPE html>
<html>
<head><title>Test Story</title></head>
<body>
  <div id="story">
    <p>Welcome to the test story.</p>
    <a href="#" id="link1">First Link</a>
    <a href="#" id="link2">Second Link</a>
  </div>
  <script>
    document.getElementById('link1').addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('story').innerHTML = '<p>You clicked the first link!</p>';
    });
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
}, 30000); // Increase timeout for browser operations
