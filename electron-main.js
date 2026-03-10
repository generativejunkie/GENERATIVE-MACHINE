const { app, BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
let projectorWindow;

function createProjectorWindow() {
    if (projectorWindow) {
        projectorWindow.focus();
        return;
    }

    const displays = screen.getAllDisplays();
    const primaryDisplay = screen.getPrimaryDisplay();
    // 外部ディスプレイを探すロジック
    const externalDisplay = displays.find((display) => {
        return display.id !== primaryDisplay.id;
    });

    let displayToUse = externalDisplay;
    let isFullscreen = true;

    if (!displayToUse) {
        console.log('No external display detected. Falling back to primary display.');
        displayToUse = primaryDisplay;
        isFullscreen = false; // メイン画面しかないのでフルスクリーンにしない（操作できなくなるため）
    }

    const windowOptions = {
        width: isFullscreen ? displayToUse.bounds.width : 1280,
        height: isFullscreen ? displayToUse.bounds.height : 720,
        x: displayToUse.bounds.x + (isFullscreen ? 0 : 100),
        y: displayToUse.bounds.y + (isFullscreen ? 0 : 100),
        fullscreen: isFullscreen,
        frame: !isFullscreen,
        alwaysOnTop: isFullscreen,
        backgroundColor: '#000000',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false,
            backgroundThrottling: false
        }
    };

    projectorWindow = new BrowserWindow(windowOptions);
    projectorWindow.loadFile('index.html', { query: { "projector": "true" } });
    projectorWindow.on('closed', () => { projectorWindow = null; });
}

function createWindow() {
    const primaryDisplay = screen.getPrimaryDisplay();

    // 1. MAIN WINDOW (Control Panel)
    mainWindow = new BrowserWindow({
        x: primaryDisplay.bounds.x,
        y: primaryDisplay.bounds.y,
        width: 1280,
        height: 800,
        autoHideMenuBar: true,
        backgroundColor: '#0a0a0a',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false,
            backgroundThrottling: false,
            experimentalFeatures: true
        }
    });

    mainWindow.loadFile('index.html');
    mainWindow.maximize();

    mainWindow.on('closed', function () {
        mainWindow = null;
        if (projectorWindow) projectorWindow.close();
    });

    // 起動時の自動検知
    createProjectorWindow();
}

ipcMain.on('open-projector', () => {
    createProjectorWindow();
});

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});
