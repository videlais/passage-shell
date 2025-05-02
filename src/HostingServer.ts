// Import Express
import { Link } from './Link';
import { Status } from './Status';
import { Settings } from './Settings';
import express from 'express';
import { WebContents } from 'electron';

export class HostingServer {

    // Text content of the current passage.
    textContents:String = "";
    
    // Rendered HTML content of the current passage.
    htmlContents:String = "";
    
    // Original HTML content of the current passage.
    sourceHTMLContents:String = "";
    
    // Current links in the passage.
    linksContents:Array<Link> = [];
    
    // Current mouseover links in the passage.
    mouseOverLinksContents:Array<Link> = [];
    
    // Status of the server.
    statusContents:Status = {
      code: 0,
      message: "",
      description: ""
    };

    // Can the passage be undone?
    undoContents:Boolean = false;
    
    // Can the passage be redone?
    redoContents:Boolean = false;
    
    // Error message (if any)
    errorContents:String = "";
    
    // The passage contents
    passageContents = {};

    // Create a reference to the web app
    webApp:express.Application | null = null;

    // Server settings
    settings: Settings = {
      port: null,
      file: null
    };

    // WebContents for the background window receiving IPC messages
    electronWebWindow: WebContents | null = null;

    // Is the server ready?
    isReady:Boolean = false;

  /**
   * Constructor for the HostingServer class.
   */  
  constructor() {
    // Internal Express server
    this.webApp = express();

    if(this.settings.port != null) {
  
      this.webApp.listen(this.settings.port, (error) => {
        // Was there an error?
        if(error) {
          console.log(`Error starting server: ${error}`);
          
          // Set the status contents
          this.statusContents = {
            code: 500,
            message: "Error",
            description: `Error starting server: ${error}`
          };

          this.isReady = false;
        } else {
          // Show a message
          console.log(`Server started on port ${this.settings.port}`);
          console.log(`Server URL: http://localhost:${this.settings.port}`);

          // Set the status contents
          this.statusContents = {
            code: 200,
            message: "OK",
            description: "Server started"
          };
          
          // Set the server to ready
          this.isReady = true;
        }
      });
  
    } else {
      // Show an error message
      console.log("Server not started. Port is null!");
      
      // Set the status contents
      this.statusContents = {
        code: 500,
        message: "Error",
        description: "Server not started. Port is null!"
      };
    }

  }

  /**
   * Prepare the routes for the server.
   * This is called after the server is started.
   * @returns 
   */
  prepareRoutes() {
    // Test for null
    if(this.webApp == null) {
      console.log("Web app is null!");
      return;
    }

    this.webApp.get('/', (_req, res) => {
      res.json(this.statusContents);
    });

    this.webApp.get('/file', (_req, res, next) => {
      // Send the file
      if(this.settings.file != null) {
        // Send the file
        res.sendFile(this.settings.file, {}, (err) => {

          if (err) {
            console.log(err);
            next(err);
          }

        });

      }

    });

    this.webApp.get('/text', (_req, res) => {
      res.json({"text": this.textContents});
    });
  
    this.webApp.get('/html', (_req, res) => {
      res.json({"html": this.htmlContents});
    });
  
    this.webApp.get('/source', (_req, res) => {
      res.json({"source": this.sourceHTMLContents});
    });

    this.webApp.get('/links', (_req, res) => {
      res.json({"links": this.linksContents});
    });
  
    this.webApp.get('/mouseover-links', (_req, res) => {
      res.json({"mouseover-links": this.mouseOverLinksContents});
    });

    this.webApp.get('/error', (_req, res) => {
      res.json({"error": this.errorContents});
    });
  
    this.webApp.get('/passage', (_req, res) => {
      res.json({"passage": this.passageContents});
    });

    // Listen for click routes
    this.webApp.get('/click/:id', (req, res) => {
  
      // Just in case the server was started without
      //  loading the background window somehow
      if(this.electronWebWindow != null) {
  
        // Convert to number with a radix of 10
        // This prevents people passing hexadecimal numbers.
        // It will also round float-pointing numbers
        let id = Number.parseInt(req.params.id, 10);
  
        // Quick sanity check
        // Input should ONLY be numbers
        if(Number.isNaN(id)) {
          // Send an error message
          res.json({"error" : "Input not a number!"});
  
        } else {
          // Post the response
          res.json({"click" : id});
  
          // Send to the renderer to click the number
          this.electronWebWindow.send('async-remote-click', id);
        }
      }
  
    });
  
    // Listen for mouseover routes
    this.webApp.get('/mouseover/:id', (req, res) => {
  
      // Just in case the server was started without
      //  loading the background window somehow
      if(this.electronWebWindow != null) {
  
        // Convert to number with a radix of 10
        // This prevents people passing hexadecimal numbers.
        // It will also round float-pointing numbers
        let id = Number.parseInt(req.params.id, 10);
  
        // Quick sanity check
        // Input should ONLY be numbers
        if(Number.isNaN(id)) {
          // Send an error message
          res.json({"error" : "Input not a number!"});
  
        } else {
          // Post the response
          res.json({"mouseover" : id});
  
          // Send to the renderer to click the number
          this.electronWebWindow.send('async-remote-mouseover', id);
        }
      }
  
    });

    this.webApp.get('/undo', (_req, res) => {
      res.json({"undo": this.undoContents});
      // Tell the rendered to 'undo'
  
      // Just in case the server was started without
      //  loading the background window somehow
      if(this.electronWebWindow != null) {
        this.electronWebWindow.send('async-remote-undo', true);
      }
    });

    this.webApp.get('/redo', (_req, res) => {
      res.json({"redo": this.redoContents});
      // Tell the rendered to 'redo'
  
      // Just in case the server was started without
      //  loading the background window somehow
      if(this.electronWebWindow != null) {
        this.electronWebWindow.send('async-remote-redo', true);
      }
  
    });

    this.webApp.get('/reset', (_req, res) => {
      res.json({"reset": true});
      // Check if 
      if(this.electronWebWindow != null) {
        this.electronWebWindow.send('async-remote-reset', true);
      }
    });
  
    // Catch-all for trying routes that don't exist
    this.webApp.use((_req, res, __next) => {
      res.status(404).json({"error": "Not a valid route!"});
    });

  }
}
