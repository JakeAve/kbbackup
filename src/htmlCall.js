//const https = require('https');
//const fs = require('fs');

let options = {
    "method": "GET",
    "hostname": "youngliving.custhelp.com",
    "port": null,
    "path": "/services/rest/connect/v1.3/answers?limit=10000&totalResults=true",
    "headers": {
        "authorization": "",
        "cache-control": "no-cache"
    }
};

var totalAnswerIds;

function beginBackup (authorization, path) {
    options.headers.authorization = authorization;
    async function wait() {
        totalAnswerIds = await getTotalAnswerIds();
        a_id = await makeFolders(path);
        mainBackup();
    };
    wait();
};

var folderName;
var a_id;

function makeFolders(path) {
    const timeStamp = (new Date()).toJSON().slice(0, 19).replace(/:/, 'h').replace(/:/, 'm') + 's';
    const name = `${path}/KBaseBackup-${timeStamp}`;
    const a_idFolder = `${name}/a_ids`;

    fs.mkdirSync(name, (err) => {
        if (err) {
            output.innerHTML = `${err} Try refreshing (Ctrl+R)`;
            mainLog += `${logTime()}Error creating directory "${name}"`;        
            throw err;
        }
    });
    mainLog += `${logTime()}Created directory "KBaseBackup-${timeStamp}"`;
    
    fs.mkdirSync(a_idFolder, err => {
        if (err) {
            output.innerHTML = `${err} Try refreshing (Ctrl+R)`;
            mainLog += `${logTime()}Error creating directory "${a_idFolder}"`;        
            throw err;
        }
    })
    mainLog += `${logTime()}Created a_ids directory "KBaseBackup-${timeStamp}/a_ids"`;

    folderName = name;
    return a_idFolder;
};

function getTotalAnswerIds() {
    return new Promise((resolve) => {
        const req = https.request(options, (res) => {
            let response = "";
            res.setEncoding("utf8");
            res.on('data', (chunk) => {
                response += chunk;
                //console.log('chunk' + chunk);
            });
            res.once('data', () => {
                output.innerHTML = 'Connecting to the API... and thinking about things...';
                mainLog += `${logTime()}Sending HTTPS request`;
            })
            res.on('end', () => {
                const parsedBody = JSON.parse(response);
                mainLog += `${logTime()}Response status code : ${res.statusCode}`;
                if (res.statusCode === 200) {
                    const total = parsedBody.items[parsedBody.totalResults - 1].id;
                    activeIds = parsedBody.items.length;
                    document.querySelector('#backupBtn').style.visibility = 'hidden';
                    mainLog += `${logTime()}Number of answer IDs : ${parsedBody.items.length}`;
                    mainLog += `${logTime()}Last Answer ID : ${total}`;
                    if (total > 1) {
                        resolve(total);
                        mainLog += `${logTime()}Resolved number of answerIDs`;
                    } else {
                        //console.log('status 200, but data was not found');
                        output.innerHTML = 'There was a problem connecting. Check the network and your credentials';
                        alert(document.getElementById('progressdiv'));
                        mainLog += `${logTime()}Error with status code : ${res.statusCode}`;
                    }
                } else {
                    //console.log('still no status 200');
                    output.innerHTML = 'There was a problem connecting. Check the network and your credentials';
                    alert(document.getElementById('progressdiv'));
                    mainLog += `${logTime()}Error with status code : ${res.statusCode}`;
                }
            });
        });
        req.on('err', (err) => {
            console.log(`Error: ${err.message}`);
            output.innerHTML = "There was an unknown error in your request. We are sorry.";
            alert(document.getElementById('progressdiv'));
            mainLog += `${logTime()}Error with request : ${err.message}`;
        });
        req.end();
    });
};

function mainBackup() {
    mainLog += `${logTime()}Main sequence initiated`;
    iterationElapses.push(new Date());

    async function requestAndSave(fileNumber) {
        options.path = `/services/rest/connect/v1.3/answers/${fileNumber}`;
        const response = await httpRequest(fileNumber);
        await saveFiles(response, fileNumber);
        display(fileNumber);
    };

    for (let i = 1; i <= totalAnswerIds; i ++) {
        setTimeout(() => {

            requestAndSave(i);
            iterations.push(`${logTime()}Answer ID ${i}`);
            iterationElapses.push(new Date());
            
            if ((i % 1000 === 0)) {
                mainLog += `${logTime()}${timeSince(0)}Reached Answer ID ${i}`;
            }

            if (i === totalAnswerIds) {
                setTimeout(() => {
                    completeDialog();
                }, 5000);
            }

        }, i * 10);
    }

    /*setTimeout(() => {
        completeDialog();
    }, 1000);*/

};

var activeIds = 0;
var extraFiles = [];
extraFiles.name = `AnswerIDswithQuestions`;
var misseds = [];
misseds.name = `BlankOrMissedIDs`;
var iterations = ['Start Iterations'];
iterations.name = `FullIterations`;
var iterationElapses = [];

function timeSince(i) {
    return `${((iterationElapses[i] - new Date())/-1000).toFixed(3)}s `
};

function display(fileNumber) {
    fs.readdir(a_id, (err, files) => {
        const filesWritten = files.length;
        const progress = (filesWritten/(activeIds + extraFiles.length)) * 100;
        const progressRnd = Math.floor(progress);
        document.getElementById('progress').style.width = progress + '%';
        document.getElementById('progress').innerHTML = progressRnd + '%&nbsp;';
        output.innerHTML = `File:${fileNumber}, Files Written: ${filesWritten}, Blank Answers: ${misseds.length} `;
    });
};

function httpRequest(fileNumber) {
    return new Promise((resolve) => {
        const req = https.request(options, (res) => {
            iterations[fileNumber] += `${logTime()}${timeSince(fileNumber)}Request Status: ${res.statusCode}`;
            if (res.statusCode == 200) {
                let responseBody = '';
                //console.log(`Server Status: ${res.statusCode}`);            
                res.setEncoding('utf8');
                res.on('data', (chunk) => {
                    //console.log(`--chunk-- ${chunk.length}`);
                    responseBody += chunk;
                });
                /*res.on('uncaughtException', (err) => {
                    console.log('this is an ' + err);
                });*/
                res.on('end', () => {
                    resolve(responseBody);
                    iterations[fileNumber] += `${logTime()}${timeSince(fileNumber)}Ended response`;
                });
            } else {
                misseds.push(fileNumber);
            }
        });
        req.on('err', (err) => {
            console.log(`Error: ${err.message}`);
            mainLog += `${logTime()}Error on HTTPS request ${fileNumber} : ${err.message}`;
        });
        req.end();
    });
};

function saveFiles(content, fileNumber) {
    const parsedBody = JSON.parse(content);
    if (parsedBody.question != null) {
        fs.writeFileSync(`${a_id}/${fileNumber}-question.html`, parsedBody.question, (err) => {
            if (err) {
                mainLog += `${logTime()}Error saving ${fileNumber} question : ${err.message}`;
                throw err;
            }
        });
        extraFiles.push(fileNumber);
        iterations[fileNumber] += `${logTime()}${timeSince(fileNumber)}Saved question`;
    }
    fs.writeFileSync(`${a_id}/${fileNumber}.html`, parsedBody.solution, (err) => {
        if (err) {
            mainLog += `${logTime()}Error saving ${fileNumber} solution : ${err.message}`;
            throw err;
        }
    });
    iterations[fileNumber] += `${logTime()}${timeSince(fileNumber)}Saved solution`;
};

function saveLogs(arr) {
    mainLog += `${logTime()}Saving Logs`;
    arr.forEach((i, index) => {

        let fileName;
        let file;

        if (i.constructor === Array) {
            file = `${i.name} (${i.length})\r\n\r\n${i.join('\r\n')}`;
            fileName = i.name;

        } else {
            fileName = `Main Log${index > 0 ? index : ''}`;
            file = `${fileName} (${i.split(/\r\n|\r|\n/).length - 1})\r\n\r\n${i}`;
        }

        fs.writeFileSync(`${folderName}/${fileName}.txt`, file, (err) => {
            if (err) {
                mainLog += `${logTime()}Error saving ${fileName} solution : ${err.message}`;
                throw err;
            }
        });

    })
};
