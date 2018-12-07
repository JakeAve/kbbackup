const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');

//the two windows
let win;
let logWin


//Listen for app to be ready
function createWindow() {
    //create widnow
    win = new BrowserWindow({height: 800, frame: false});
    //load html
    win.loadFile('src/index.html');

    win.on('closed', () => {
        win = null
    });
    //render menu from template
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    //insert menu
    Menu.setApplicationMenu(mainMenu);
};

function createLogWin() {
    //create widnow
    logWin = new BrowserWindow({height: 800});
    //load html
    logWin.loadFile('src/logWin.html');

    logWin.on('closed', () => {
        logWin = null
    });
    logWin.setMenu(null)
}

//Promted after user clicks 'Get Logs' on index.html
ipcMain.on('open-log-win', () => {
    createLogWin()
})

//Received when the DOM is ready at logWin
ipcMain.on('ready-for-data', () => {
    win.webContents.send('ready-for-log')
})

//Forwards information to logWin.js
ipcMain.on('received-data', (e, mainLog, iterations, misseds, extraFiles) => {
    logWin.webContents.send('received-data', mainLog, iterations, misseds, extraFiles);
})

app.on('ready', createWindow);


//menu template. Is mainly for keyboard shortcuts 
const mainMenuTemplate = [
    {
        label: 'File',
        submenu: [
            {
                label: 'Settings'
            },
            {
                role: 'reload',
                accelerator: 'CmdOrCtrl+R', 
            },
            {
                role: 'toggleDevTools',
                accelerator: 'CmdOrCtrl+I', 
            },
            {
                label: 'Exit',
                accelerator: 'CmdOrCtrl+Q', 
                click(){
                    app.quit();
                }
            }
        ]
    }
];

//Allows user to choose a file from their native file explorer
ipcMain.on('open-file-dialog', (e) => {
    dialog.showOpenDialog({
        properties: ['openFile', 'openDirectory']
    }, (files) => {
        if (files) {
            e.sender.send('selected-directory', files);
        }
    });
});

ipcMain.on('close-app', () => {
    app.quit();
});

ipcMain.on('max-win', () => {
    win.maximize();
});

ipcMain.on('half-max', () => {
    win.unmaximize();
});

ipcMain.on('min-win', () => {
    win.minimize();
});

app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit()
    }
  });

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow()
    }
  });
