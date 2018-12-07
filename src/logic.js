const electron = require('electron');
const os = require('os');
const https = require('https');
const fs = require('fs');
const { ipcRenderer } = require('electron');
const { dialog } = require('electron').remote;

let mainLog;

const selectDirBtn = document.getElementById('selectDirBtn');
selectDirBtn.addEventListener('click', (event) => {
    ipcRenderer.send('open-file-dialog');
    mainLog += `${logTime()}Opened folder dialog`;
});

ipcRenderer.on('selected-directory', (event, path) => {
    document.getElementById('selected-folder').value = path;
    mainLog += `${logTime()}Selected directory as "${path}"`;
});

function noPath() {
    output.innerHTML = 'You need to specify a valid path!';
    alert(document.getElementById('folderdiv'));
    mainLog += `${logTime()}Prompted "No Path" error`;
};

const backupBtn = document.getElementById('backupBtn');
backupBtn.addEventListener('click', startBackup);

function getKey() {
    const username = document.querySelector('#username').value;
    const password = document.querySelector('#pass').value;
    const key = `Basic ${btoa(username + ':' + password)}`;
    mainLog += `${logTime()}Username: "${username}"`;
    return key;
};

const passBox = document.getElementById('pass');

function startBackup(event) {
    mainLog += `${logTime()}Submitted backup request`;
    event.preventDefault();
    output.innerHTML = '';
    const x = document.getElementById('progress');
    x.innerHTML = '0%';
    x.style.width = '0%';
    const key = getKey();
    const path = document.getElementById('selected-folder').value;
    if (path == '' || fs.existsSync(path) == false) {
        noPath();
        return
    } else {
        //ipcRenderer.send('back-up', key, path);
        beginBackup(key, path);
        mainLog += `${logTime()}Starting backup in "${path}"`;
        passBox.value = '';
        changeColors();
        output.innerHTML = 'Preparing backup...';
    }
    setTimeout(checkBackup, 5000);
};


function alert(id) {
    id.classList.add('alert');
    setTimeout(() => {
        id.classList.remove('alert');
    }, 3000);
    stopColors();
    mainLog += `${logTime()}Created alert`;
};

function changeColors() {
    const arr = document.getElementsByClassName('colorchange');
    for (let i = 0; i < arr.length; i++) {
        arr[i].classList.add('gradient');
    }
};

function stopColors() {
    const arr = document.getElementsByClassName('colorchange');
    for (let i = 0; i < arr.length; i++) {
        arr[i].classList.remove('gradient');
    }
};

function checkBackup() {
    if (document.getElementById('progress').innerHTML == '0%' && output.innerHTML == 'Preparing backup...') {
        output.innerHTML = 'There was a problem. Make sure you are connected to the right network and your credentials are correct. Try refreshing the app (Ctrl+R)';
        alert(document.getElementById('progressdiv'));
    }
    mainLog += `${logTime()}Checked that the backup has started`;
};

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

  const {remote} = require('electron')
  const {Menu, MenuItem} = remote
  
  const menu = new Menu()
  menu.append(new MenuItem({label: 'Quit', accelerator: 'CmdOrCtrl+Q', click(){ipcRenderer.send('close-app');}}))
  
  window.addEventListener('contextmenu', (e) => {
    e.preventDefault()
    menu.popup({window: remote.getCurrentWindow()})
  }, false);


var output = document.getElementById('log');

function completeDialog() {
    return new Promise((resolve) => {
        stopColors();
        fs.readdir(a_id, (err, files) => {
            const runs = activeIds + extraFiles.length;
            const savedFiles = files.length;
            const missing = runs - savedFiles;
            dialog.showMessageBox({type: 'info', alwaysOnTop: true, message: `The backup has finished running. \n${missing == 0 ? `There are no missing files!` : missing == 1 ? `There is 1 missing file` : `There are ${missing} missing files`}`});
            const completeLog = `${logTime()}Displayed complete dialog with ${runs} Runs, ${savedFiles} savedFiles and ${missing} Missing File(s)`;
            mainLog += completeLog;
            resolve(completeLog);
        });
    }).then(()=> {
        const arr = [mainLog, iterations, misseds, extraFiles];
        saveLogs(arr);
    });
}

function openLogWin() {
    ipcRenderer.send('open-log-win');
    mainLog += `${logTime()}Requested logs`;
    const arr = [mainLog, iterations, misseds, extraFiles];
    saveLogs(arr);
}

ipcRenderer.on('ready-for-log', () => {
    ipcRenderer.send('received-data', mainLog, iterations, misseds, extraFiles);
})

window.onbeforeunload = () => {
    if (folderName) {
        const arr = [mainLog, iterations, misseds, extraFiles];
        saveLogs(arr);
    }
}

document.querySelector('.logsDiv BUTTON').addEventListener('click', openLogWin);

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
}

mainLog = `${logTime()}DOM Loaded`;