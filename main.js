// Load the app, BrowserWindow, and ipcMain modules
const {app, BrowserWindow, ipcMain} = require('electron');

// Load up a webserver as the API
const express = require('express');
const webApp = express();
const port = 3000;

let textContents = "";

webApp.get('/', function(req, res) {
  res.send('Status');
});

webApp.get('/plaintext', function(req, res) {
  res.send(textContents);
});

webApp.get('/html', function(req, res) {
  res.send('HTML!');
});

webApp.get('/click/:id', function(req, res) {
  res.send('click ' + req.params.id);
});

webApp.listen(port, function() {
  console.log(`Server working!`);
});

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

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


// Listen on the "main" channel for events
ipcMain.on('async-message-main', function(event, arg) {
  console.log(arg); // prints "ping"
});

ipcMain.on('async-message-main-plain', function(event, arg) {
  textContents = arg;
  console.log(textContents);
});





