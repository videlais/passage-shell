import { chromium } from '@playwright/test';
import { existsSync } from 'fs';

/**
 * Execute a series of actions on an HTML file using Playwright
 * @param {string} htmlPath - Absolute path to the HTML file
 * @param {Array} actions - Array of action objects
 * @param {Object} options - Configuration options
 * @returns {Promise<Array>} Results from each action
 */
export async function runActions(htmlPath, actions, options = {}) {
  const { headless = true, slowMo = 0, verbose = false } = options;
  
  if (!existsSync(htmlPath)) {
    throw new Error(`HTML file not found: ${htmlPath}`);
  }
  
  const browser = await chromium.launch({ 
    headless,
    slowMo 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Navigate to the HTML file
  await page.goto(`file://${htmlPath}`);
  
  const results = [];
  
  try {
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      
      if (verbose) {
        console.log(`[${i + 1}/${actions.length}] ${action.description || action.type}`);
      }
      
      const result = await executeAction(page, action, verbose);
      results.push({
        action: action.type,
        description: action.description,
        result
      });
    }
  } finally {
    await browser.close();
  }
  
  return results;
}

/**
 * Execute a single action on a page
 * @param {Page} page - Playwright page object
 * @param {Object} action - Action to execute
 * @param {boolean} verbose - Whether to log details
 * @returns {Promise<any>} Result of the action
 */
async function executeAction(page, action, verbose = false) {
  switch (action.type) {
    case 'click':
      await page.click(action.selector);
      return { clicked: action.selector };
      
    case 'getText':
      const text = await page.textContent(action.selector);
      if (verbose) {
        console.log(`  → Text: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
      }
      return { text };
      
    case 'getHTML':
      const html = await page.innerHTML(action.selector);
      return { html };
      
    case 'getLinks':
      const links = await page.$$eval('a', (elements) => 
        elements.map(el => ({
          text: el.textContent.trim(),
          href: el.getAttribute('href')
        }))
      );
      if (verbose) {
        console.log(`  → Found ${links.length} link(s)`);
      }
      return { links };
      
    case 'wait':
      await page.waitForTimeout(action.ms || 1000);
      return { waited: action.ms || 1000 };
      
    case 'waitForSelector':
      await page.waitForSelector(action.selector, { 
        timeout: action.timeout || 30000 
      });
      return { found: action.selector };
      
    case 'type':
      await page.fill(action.selector, action.text);
      return { typed: action.text };
      
    case 'screenshot':
      await page.screenshot({ path: action.path });
      return { screenshot: action.path };
      
    case 'evaluate':
      const evalResult = await page.evaluate(action.script);
      return { evaluated: evalResult };
      
    case 'getAttribute':
      const attr = await page.getAttribute(action.selector, action.attribute);
      return { attribute: action.attribute, value: attr };
      
    case 'hover':
      await page.hover(action.selector);
      return { hovered: action.selector };
      
    case 'select':
      await page.selectOption(action.selector, action.value);
      return { selected: action.value };
      
    case 'check':
      await page.check(action.selector);
      return { checked: action.selector };
      
    case 'uncheck':
      await page.uncheck(action.selector);
      return { unchecked: action.selector };
      
    case 'goBack':
      await page.goBack();
      return { action: 'goBack' };
      
    case 'goForward':
      await page.goForward();
      return { action: 'goForward' };
      
    case 'reload':
      await page.reload();
      return { action: 'reload' };
      
    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
}
