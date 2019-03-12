// Load the app, BrowserWindow, and ipcMain modules
const {app, BrowserWindow, ipcMain, dialog} = require('electron');
const fs = require('fs');

// Load up a webserver API
const express = require('express');
const webApp = express();

// Reference to httpServer returned by Express' listen()
// This is needed so we can close the server remotely
let httpServer;

// Set the default values
let textContents = "";
let htmlContents = "";
let linksContents = [];
let statusContents = {};
let undoContents = false;
let redoContents = false;
let errorContents = "";

// Default values
let settings = {
  port: null,
  loader: null,
  serverIsReady: false
};

// Keep a global reference of the window object. If not, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow;
var webContents;
var settingsWindow;
var settingsWebContents;

// Create (or re-create) the background window
function createBackgroundWindow() {

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    },
    show: false
  });

  // Save a reference to webContents
  webContents = mainWindow.webContents;

  // Open the DevTools for testing purposes
  // Remove this later
  //mainWindow.webContents.openDevTools();

  // Do a sanity check
  // Does the loader have a folder in the current directory?
  // Is the loader an empty string?
  if(fs.existsSync("./" + settings.loader) && settings.loader != null) {
    // Load the interface in the background
    mainWindow.loadFile(settings.loader + '/index.html');
  } else {
    console.log("Loader not found!");
    dialog.showErrorBox('Error', 'The selected loader is not found!');
  }

}

function createWindow() {
  
  settingsWindow = new BrowserWindow({
    width: 400,
    height: 400,
    webPreferences: {
      nodeIntegration: true
    }
  });

  // With the windows loading, load the settings
  loadSettings();

  // Check if settings directory exists before loading index.html
  if(fs.existsSync('settings/index.html') ) {

    // Load the settings window
    settingsWindow.loadFile('settings/index.html');

  } else {

    console.log("Settings directory missing!");
    dialog.showErrorBox('Error', 'Settings directory missing!');

  }

  // Save a reference to the settings window contents
  settingsWebContents = settingsWindow.webContents;

  // Emitted when the window is closed. 
  settingsWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    settingsWindow = null;
    // If the settings window is closed, close the other window
    mainWindow = null;
  });

  // Wait for the settings window to load
  settingsWebContents.on('dom-ready', () => {

    // Load the background window
    createBackgroundWindow();

    // Send the loaded settings to the loader window
    settingsWebContents.send('async-remote-settings', settings);

    // Start the server
    startServer();

  });  

}

function loadSettings() {

  // Sanity check
  // Does the settings file exist?
  if(fs.existsSync("settings.json") ) {

    // Load the settings.json file
    let contents = fs.readFileSync("settings.json");

    // Check for JSON parsing errors
    let wasError = false;

    try {
      
      // File exists, try to parse it
      settings = JSON.parse(contents);

    } catch (event) {

      // File was malformed or some other error occured
      wasError = true;
      console.log("Malformed JSON!");
      dialog.showErrorBox('Error', 'Malformed or missing JSON in settings.json file!');

    }

    // There weren't any JSON parsing errors
    if(wasError == false) {

      // Test if 'port' is a number
      if(Number.isNaN(settings.port)) {

        // For whatever reason, the value of 'port' is not a number
        settings.port = null;
        settings.serverIsReady = false;

      } else {

        // Probably things are now safe
        settings.serverIsReady = true;

      }
    }

  } else {

    // File doesn't exist!
    console.log("settings.json not found!");
    dialog.showErrorBox('Error', 'The settings.json file is missing!');

  }

}

function startServer() {

  webApp.get('/', (req, res) => {
    res.json(statusContents);
  });

  webApp.get('/text', (req, res) => {
    res.json({"text": textContents});
  });

  webApp.get('/html', (req, res) => {
    res.json({"html": htmlContents});
  });

  webApp.get('/links', (req, res) => {
    res.json({"links": linksContents});
  });

  webApp.get('/undo', (req, res) => {
    res.json({"undo": undoContents});
    // Tell the rendered to 'undo'
    webContents.send('async-remote-undo', true);
  });

  webApp.get('/redo', (req, res) => {
    res.json({"redo": redoContents});
    // Tell the rendered to 'redo'
    webContents.send('async-remote-redo', true);
  });

  webApp.get('/error', (req, res) => {
    res.json({"error": errorContents});
  });

  webApp.get('/reset', (req, res) => {
    res.json({"reset": true});
    // Reload the file based on the loader name
    //webContents.reload();
    createBackgroundWindow();
    
  });

  webApp.get('/click/:id', (req, res) => {

    // Convert to number with a radix of 10
    // This prevents people passing hexidecimal numbers.
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
      webContents.send('async-remote-click', id);
    }

  });

  // Catch-all for trying routes that don't exist
  webApp.use((req, res, next) => {
    res.status(404).json({"error": "Not a valid route!"});
  });


  if(settings.port != null) {

    httpServer = webApp.listen(settings.port, () => {
      console.log('Server running!');
    });

  } else {

    console.log("Invalid or missing port number!");
    dialog.showErrorBox('Error', 'Invalid or missing port number!');

  }


}

// Electron is ready to load windows
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null && settingsWindow == null) {
    createWindow();
  }
});


// Listen for the 'main' events
// 'html': HTML content
// 'text': text content
// 'links': links content
// 'status': status content
// 'server': switching webserver on and off
// 'undo': is undoing possible?
// 'redo': is redoing possible?
// 'error': error channel

// Listen on the "async" channel for events
ipcMain.on('async-main-html', (event, arg) => {
  htmlContents = arg;
});

ipcMain.on('async-main-text', (event, arg) => {
  textContents = arg;
});

ipcMain.on('async-main-links', (event, arg) => {
  linksContents = arg;
});

ipcMain.on('async-main-status', (event, arg) => {
  statusContents = arg;
});

ipcMain.on('async-main-undo', (event, arg) => {
  undoContents = arg;
});

ipcMain.on('async-main-redo', (event, arg) => {
  redoContents = arg;
});

ipcMain.on('async-main-error', (event, arg) => {
  errorContents = arg;
});

ipcMain.on('async-main-server', (event, arg) => {

  if(arg == "run") {

    if(settings.port != null) {

      httpServer = webApp.listen(settings.port, () => {
        console.log('Server running!');
      });

    } else {

      console.log("Invalid or missing port number!");
      dialog.showErrorBox('Error', 'Invalid or missing port number!');

    }

  }

  if(arg == "stop") {

    httpServer.close(() => {
      console.log('Server shutting down!');
    });

  }

})

