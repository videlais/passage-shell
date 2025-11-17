#!/usr/bin/env node

import { Command } from 'commander';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { runActions } from './src/runner.js';

const program = new Command();

program
  .name('passage-shell')
  .description('CLI tool for automated testing of HTML-based interactive fiction')
  .version('2.0.0');

program
  .command('run <html-file> <actions-file>')
  .description('Run automated actions on an HTML file')
  .option('-h, --headless', 'Run in headless mode', true)
  .option('-s, --slow-mo <ms>', 'Slow down operations by specified milliseconds', '0')
  .option('-o, --output <file>', 'Save results to JSON file')
  .option('-v, --verbose', 'Show detailed output')
  .action(async (htmlFile, actionsFile, options) => {
    try {
      const htmlPath = resolve(htmlFile);
      const actionsPath = resolve(actionsFile);
      
      // Read actions file
      const actionsContent = await readFile(actionsPath, 'utf-8');
      const actions = JSON.parse(actionsContent);
      
      if (options.verbose) {
        console.log(`Running ${actions.length} action(s) on ${htmlFile}...`);
      }
      
      // Run the actions
      const results = await runActions(htmlPath, actions, {
        headless: options.headless,
        slowMo: parseInt(options.slowMo),
        verbose: options.verbose
      });
      
      // Output results
      if (options.output) {
        const { writeFile } = await import('fs/promises');
        await writeFile(options.output, JSON.stringify(results, null, 2));
        console.log(`Results saved to ${options.output}`);
      } else if (options.verbose) {
        console.log('\nResults:');
        console.log(JSON.stringify(results, null, 2));
      }
      
      console.log(`\n✓ Completed ${results.length} action(s)`);
      
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('example')
  .description('Generate an example actions file')
  .option('-o, --output <file>', 'Output file path', 'actions.json')
  .action(async (options) => {
    const exampleActions = [
      {
        "type": "getText",
        "selector": "body",
        "description": "Get initial page text"
      },
      {
        "type": "click",
        "selector": "text=Start",
        "description": "Click the 'Start' link"
      },
      {
        "type": "wait",
        "ms": 500,
        "description": "Wait for transition"
      },
      {
        "type": "getText",
        "selector": ".passage",
        "description": "Get passage text after clicking"
      },
      {
        "type": "getLinks",
        "description": "Get all available links"
      },
      {
        "type": "screenshot",
        "path": "screenshot.png",
        "description": "Take a screenshot"
      }
    ];
    
    const { writeFile } = await import('fs/promises');
    await writeFile(options.output, JSON.stringify(exampleActions, null, 2));
    console.log(`Example actions file created: ${options.output}`);
  });

program.parse();
