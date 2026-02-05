import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // App info
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    getAppPath: () => ipcRenderer.invoke('get-app-path'),
    getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),

    // Window controls
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    maximizeWindow: () => ipcRenderer.send('maximize-window'),
    closeWindow: () => ipcRenderer.send('close-window'),

    // Platform info
    platform: process.platform,
});

// Type declaration for the exposed API
declare global {
    interface Window {
        electronAPI: {
            getAppVersion: () => Promise<string>;
            getAppPath: () => Promise<string>;
            getUserDataPath: () => Promise<string>;
            minimizeWindow: () => void;
            maximizeWindow: () => void;
            closeWindow: () => void;
            platform: NodeJS.Platform;
        };
    }
}
