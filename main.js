// Load the app, BrowserWindow, and ipcMain modules
const {app, BrowserWindow, ipcMain} = require('electron');

// Load up a webserver as the API
const express = require('express');
const webApp = express();
const port = 3000;

let textContents;
let htmlContents;
let linksContents;
let statusContents;

webApp.get('/', function(req, res) {
  res.json({"status": 'The file is loaded. Visit /text for the current text and /html for the html'});
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
  res.json({"click" : req.params.id});
  // Send to the renderer to click the number
  webContents.send('async-remote-click', req.params.id);
});

webApp.listen(port, function() {
  console.log(`Server loaded!`);
});

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let webContents;

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }//,
    //show: false
  })

  // and load the index.html of the app.
  mainWindow.loadFile('included.html');

  // Save a reference to webContents
  webContents = mainWindow.webContents;

  // Open the DevTools for testing purposes
  // Remove this later
  mainWindow.webContents.openDevTools()

  // Emitted when the window is closed. 
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
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
  if (mainWindow === null) {
    createWindow();
  }
});


// Listen for the 'main' events
// 'html': The HTML content
// 'text': The text content
// 'links': The links content
// 'status': The status content

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

