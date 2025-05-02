import { app, BrowserWindow, ipcMain, dialog } from 'electron';

export class ElectronServer {

    // The main window of the Electron app
    mainWindow: BrowserWindow | null = null;

    // Default values
    webContents = null;
    settingsWindow = null;
    settingsWebContents = null;

    constructor() {
        // Create the main window
        this.mainWindow = new BrowserWindow({
            width: 800,
            height: 600,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
    }
}