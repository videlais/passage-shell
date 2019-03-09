// Load the app, BrowserWindow, and ipcMain modules
const {app, BrowserWindow, ipcMain} = require('electron');
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

// If JSON in settings.json is well-formed, this will be overwritten.
//  If not, it will be populated with defaults.
let settings = {}

// Global reference to writeStream
let writeStream;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let webContents;
let settingsWindow;
let settingsWebContents;

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    },
    show: false
  })

  settingsWindow = new BrowserWindow({
    width: 400,
    height: 400,
    webPreferences: {
      nodeIntegration: true
    }
  })

  // With the windows loading, load the settings
  loadSettings();

  // Load the loader file
  settingsWindow.loadFile('loader/index.html');

  // Do a sanity check
  // Does the loader have a folder in the current directory?
  if(fs.existsSync("./" + settings.loader)) {
    // Load the interface in the background
    mainWindow.loadFile(settings.loader + '/index.html');
  } else {
    console.log("Loader not found");
  }

  // Save a reference to webContents
  webContents = mainWindow.webContents;

  // Save a reference to the settings window contents
  settingsWebContents = settingsWindow.webContents;

  // Open the DevTools for testing purposes
  // Remove this later
  //mainWindow.webContents.openDevTools();

  // Emitted when the window is closed. 
  settingsWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    settingsWindow = null;
    // If the settings window is closed, close the other window
    mainWindow = null;
    // Close the log session stream
    writeStream.end();
  });

  // Wait for the settings window to load
  settingsWebContents.on('did-finish-load', () => {
    
    // Electron is loaded
    // SettingsWindow is loaded
    // MainWindow is loading
    // Time to load the express server
    startServer();

  });  

}

function loadSettings() {

  // Sanity check
  // Does the settings file exist?
  if(fs.existsSync("settings.json") ) {

    // Load the settings.json file
    var contents = fs.readFileSync("settings.json");

    try {
      
      // File exists, try to parse it
      settings = JSON.parse(contents);

    } catch (event) {

      // File was malformed or some other error occured
      console.log("Malformed JSON!");

      // Populate the settings object with the defaults
      settings.port = 3000;
      settings.loader = "twine";
      settings.log = "session.log";

    }

  } else {

    // File doesn't exist!
    console.log("settings.json not found!")

    // Populate the settings object with the defaults
    settings.port = 3000;
    settings.loader = "Twine";
    settings.log = "session.log";

  }

}

function startServer() {

  // Send the loaded settings to the loader window
  settingsWebContents.send('async-remote-settings', settings);

  // Set the writeStream
  writeStream = fs.createWriteStream(settings.log);


  webApp.get('/', function(req, res) {
    res.json(statusContents);
  });

  webApp.get('/text', function(req, res) {
    res.json({"text": textContents});
  });

  webApp.get('/html', function(req, res) {
    res.json({"html": htmlContents});
  });

  webApp.get('/links', function(req, res) {
    res.json({"links": linksContents});
  });

  webApp.get('/click/:id', function(req, res) {

    // Convert to number with a radix of 10
    // This prevents people passing hexidecimal numbers.
    // It will also round float-pointing numbers
    var id = Number.parseInt(req.params.id, 10);

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
  webApp.use(function (req, res, next) {
    res.status(404).json({"error": "Not a valid route!"});
  })

  httpServer = webApp.listen(settings.port, function() {
    console.log('Server running!');
  });


}

// Electron is ready to load windows
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
})

app.on('activate', function () {
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
// 'restart': reload the file

// Listen on the "async" channel for events
ipcMain.on('async-main-html', function(event, arg) {
  htmlContents = arg;
});

ipcMain.on('async-main-text', function(event, arg) {
  textContents = arg;
});

ipcMain.on('async-main-links', function(event, arg) {
  linksContents = arg;
});

ipcMain.on('async-main-status', function(event, arg) {
  statusContents = arg;
});

ipcMain.on('async-main-server', function(event, arg) {
  if(arg == "run") {

    httpServer = webApp.listen(settings.port, function() {
      console.log('Server running!');
    
    });

  } else {

    httpServer.close(function() {
      console.log('Server shutting down!');
    });

  }
})

