import { BrowserWindow, WebContents } from 'electron';

export class SettingsServer {
  
  // The settings window of the Electron app
  settingsWindow: BrowserWindow | null = null;
  
  // The web contents of the settings window
  settingsWebContents: WebContents | null = null;
  
  // Default values
  webContents = null;
  
  constructor() {
    // Create the settings window
    this.settingsWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });
  }
}