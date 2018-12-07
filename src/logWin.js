const { ipcRenderer } = require('electron');

ipcRenderer.on('received-data', (e, mainLog, iterations, misseds, extraFiles) => {
    const logLines = mainLog.split(/\r\n|\r|\n/).length - 1;
    document.querySelector('.mainLog-title').innerHTML = `Main Log (${logLines})`;
    document.querySelector('.mainLog').value = `Number of Lines: ${logLines}\n${mainLog}`;

    document.querySelector('.iterations-title').innerHTML = `Iterations (${iterations.length - 1})`;
    document.querySelector('.iterations').value = `Total Iterations: ${iterations.length - 1}\n${iterations.join('\n')}`;

    document.querySelector('.misseds-title').innerHTML = `Blank Answers / Missed (${misseds.length})`;
    document.querySelector('.misseds').value = `Total Blank Ansers: ${misseds.length}\n${misseds.sort(function(a, b){return a - b}).join('\n')}`;

    document.querySelector('.extraFiles-title').innerHTML = `Answers with Questions (${extraFiles.length})`;
    document.querySelector('.extraFiles').value = `Total Answers with Questions: ${extraFiles.length}\n${extraFiles.sort(function(a, b){return a - b}).join('\n')}`;

})

function openTab(id, btn) {
    const tabs = document.querySelectorAll('.logTab');
    for (let i = 0; i < tabs.length; i ++) {
        tabs[i].classList.remove('open');
    }
    document.getElementById(id).classList.add('open');
    
    const btns = document.querySelectorAll('.tabBtn');
    for(let i = 0; i < btns.length; i ++) {
        btns[i].classList.remove('selected-tab');
    }
    btn.classList.add('selected-tab');

}

const copyBtns = document.querySelectorAll('.copy');
for (let i = 0; i < copyBtns.length; i ++) {
    copyBtns[i].addEventListener('click', (e) => {
        e.target.previousElementSibling.select();
        document.execCommand('copy');
        e.target.previousElementSibling.blur();
        e.target.innerHTML = 'Copied!'
    });
}

ipcRenderer.send('ready-for-data')

