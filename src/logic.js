const https = require('https');
const fs = require('fs');
const { ipcRenderer } = require('electron');
const { dialog, shell } = require('electron').remote;

//mainLog stores logging information.
//The data can be seen in logWin
//The data is also saved to a txt when a directory is created
let mainLog;

//Sends a process to main.js to open a file explorer
const selectDirBtn = document.getElementById('selectDirBtn');
selectDirBtn.addEventListener('click', (event) => {
    dialog.showOpenDialog({
        properties: ['openFile', 'openDirectory']
    }, (files) => {
        if (files) {
            document.getElementById('selected-folder').value = files;
            mainLog += `${logTime()}Selected directory as "${files}"`;
            selectDirBtn.blur();
        }
    });
    mainLog += `${logTime()}Opened folder dialog`;
});

//triggers a warning if a path for the folder is not specified 
function noPath() {
    output.innerHTML = 'You need to specify a valid path!';
    alert(document.getElementById('folderdiv'));
    mainLog += `${logTime()}Prompted "No Path" error`;
};

//Runst the backup
document.getElementById('backupBtn').addEventListener('click', startBackup);

//Returns the authorization for the HTTPS request
function getKey() {
    const username = document.querySelector('#username').value;
    const password = document.querySelector('#pass').value;
    const key = `Basic ${btoa(username + ':' + password)}`;
    mainLog += `${logTime()}Username: "${username}"`;
    return key;
};

//resets the progress bar, gets the auth, determines if the path is valid etc.
function startBackup(event) {
    mainLog += `${logTime()}Submitted backup request`;
    event.preventDefault();
    
    output.innerHTML = '';
    const x = document.getElementById('progress');
    x.innerHTML = '0%';
    x.style.width = '0%';
    //gets the authorization
    const key = getKey();

    //determines if the path for the directory is valid. Prompts an error if invalid
    const path = document.getElementById('selected-folder').value;
    if (path == '' || fs.existsSync(path) == false) {
        noPath();
        return
    } else {
    //if the path is good, will start the backup and indicate the app is working
        beginBackup(key, path);
        mainLog += `${logTime()}Starting backup in "${path}"`;
        document.getElementById('pass').value = '';
        changeColors();
        output.innerHTML = 'Preparing backup...';
    }
    setTimeout(checkBackup, 5000);
};

//makes a red box around the affected div area. Will normally change the "output"
function alert(id) {
    id.classList.add('alert');
    setTimeout(() => {
        id.classList.remove('alert');
    }, 3000);
    stopColors();
    mainLog += `${logTime()}Created alert`;
};

//indicated the app is working on a request
function changeColors() {
    const arr = document.getElementsByClassName('colorchange');
    for (let i = 0; i < arr.length; i++) {
        arr[i].classList.add('gradient');
    }
};

//indicates the app is not working
function stopColors() {
    const arr = document.getElementsByClassName('colorchange');
    for (let i = 0; i < arr.length; i++) {
        arr[i].classList.remove('gradient');
    }
};

//If the backup does not start, it sends an error and resets
function checkBackup() {
    if (document.getElementById('progress').innerHTML == '0%' && output.innerHTML == 'Preparing backup...') {
        output.innerHTML = 'There was a problem. Make sure you are connected to the right network and your credentials are correct. Try refreshing the app (Ctrl+R)';
        alert(document.getElementById('progressdiv'));
    }
    mainLog += `${logTime()}Checked that the backup has started`;
};

//Window controls 
const xout = document.getElementById('xout');
xout.addEventListener('click', (event) => {
    ipcRenderer.send('close-app');
});

//const max = document.getElementById('max');
//max.addEventListener('click', maxWin);

function maxWin() {
    max.removeEventListener('click', maxWin);
    max.addEventListener('click', halfMaxWin);
    ipcRenderer.send('max-win');
    mainLog += `${logTime()}Maximized window`;
};

function halfMaxWin() {
    max.removeEventListener('click', halfMaxWin);
    max.addEventListener('click', maxWin);
    ipcRenderer.send('half-max');
};

const min = document.getElementById('min');
min.addEventListener('click', (event) => {
    ipcRenderer.send('min-win');
    mainLog += `${logTime()}Minimized window`;
});

//The next section allows the user to quit by right clicking
const {remote} = require('electron')
const {Menu, MenuItem} = remote

const menu = new Menu()
menu.append(new MenuItem({label: 'Quit', accelerator: 'CmdOrCtrl+Q', click(){ipcRenderer.send('close-app');}}))

window.addEventListener('contextmenu', (e) => {
e.preventDefault()
menu.popup({window: remote.getCurrentWindow()})
}, false);

//This variable is used a lot to send errors, info and other things to the user
var output = document.getElementById('log');

//Shows a complete dialog and then saves all the logs 
//This also stops the color changer
function completeDialog() {
    return new Promise((resolve) => {
        stopColors();
        fs.readdir(a_id, (err, files) => {
            const runs = activeIds + extraFiles.length;
            const savedFiles = files.length;
            const missing = runs - savedFiles;
            dialog.showMessageBox({type: 'info', alwaysOnTop: true, message: `The backup has finished running. \n${missing == 0 ? `There are no missing files!` : missing == 1 ? `There is 1 missing file` : `There are ${missing} missing files`}`});
            const completeLog = `${logTime()}Displayed complete dialog with ${runs} Runs, ${savedFiles} savedFiles and ${missing} Missing File(s), ${iterations[0]}`;
            mainLog += completeLog;
            resolve(completeLog);
        });
    }).then(()=> {
        const arr = [mainLog, iterations, misseds, extraFiles];
        saveLogs(arr);
        showBackupedFiles();
    });
};

//opens the log win and saves the logs when the button is pressed
function openLogWin() {
    ipcRenderer.send('open-log-win');
    mainLog += `${logTime()}Requested logs`;
    if (folderName) {
        const arr = [mainLog, iterations, misseds, extraFiles];
        saveLogs(arr);
    }
};

//When received from main.js, will send the logs over
ipcRenderer.on('ready-for-log', () => {
    ipcRenderer.send('received-data', mainLog, iterations, misseds, extraFiles);
});

//If a directory was created, it will save the logs before closing
window.onbeforeunload = () => {
    if (folderName) {
        const arr = [mainLog, iterations, misseds, extraFiles];
        saveLogs(arr);
    }
};

//will prompt the logWin to open
document.querySelector('.logsDiv BUTTON').addEventListener('click', openLogWin);

//Returns the time stamp on very line of the mainLog
function logTime() {
    const d = new Date();
    const date = d.getDate();
    const m = d.getMonth();
    const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']
    const y = d.getFullYear();
    const h = d.getHours();
    const min = d.getMinutes();
    const s = d.getSeconds();
    const mil = d.getMilliseconds();
    return `\r\n${date}-${months[m]}-${y} at ${h}:${min < 10 ? '0' + min : min}:${s < 10 ? '0' + s : s}:${mil < 10 ? '00' + mil : mil < 100 ? '0' + mil : mil} | `
};

//Shows the folder that was just backed up.
function showBackupedFiles() {
    shell.showItemInFolder(a_id)
};

//Shows that the DOM is basically loaded
mainLog = `${logTime()}DOM Loaded`;