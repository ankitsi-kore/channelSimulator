const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const asyncTesting = require('../automationTesting/asyncTesting');

var activeConnections = {};
// var currentTestDetails = {};
var testBotDetails = {};



function AsyncExec(command) {
    return new Promise((resolve, reject) => {
        exec(command, { encoding: 'utf-8' }, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            }
            else {
                resolve({ stdout, stderr });
            }
        });
    });
}

const fetchTestCases = async (req, res) => {
    console.log('Complete Req obj for testcases:', req.body);

    let testDetails = {
        'botId': req.body.botId,
        'environment': req.body.environment,
        'channel': req.body.channel,
        'identity': req.body.identity
    };

    const testDetailsFilePath = path.join(__dirname, '../', '/testcases', 'testdetails.json');

    fs.writeFileSync(testDetailsFilePath, JSON.stringify(testDetails));

    const testResultFile = path.join(__dirname, '../', 'test_results.txt');
    fs.writeFileSync(testResultFile, '');

    let ws = activeConnections?.get('fileBased-connection');
    console.log('testing will start');
    console.log('Bot test:', testBotDetails);

    if(req.body.channel === 'slack'){
        asyncTesting.startAsyncTesting(req.body.channel)
        .then(() => {
            fs.readFile(testResultFile, (err, data) => {
                if (err) {
                    console.log(err);
                }
                else {
                    let payload = {
                        fileData: data.toString('base64'),
                        isFile: true
                    };

                    ws.send(JSON.stringify(payload), (err) => {
                        if (err) {
                            console.log('Error sending testcases file');
                        }
                        else {
                            console.log('Successfully sent the testcases file');
                        }
                    });
                }
            });
        })
    }
    else {
        AsyncExec('npm test')
        .then(result => {
            console.log('Output was new format:', result);
            
            fs.writeFileSync(testResultFile, result.stdout + result.stderr);

            fs.readFile(testResultFile, (err, data) => {
                if (err) {
                    console.log(err);
                }
                else {
                    let payload = {
                        fileData: data.toString('base64'),
                        isFile: true
                    };

                    ws.send(JSON.stringify(payload), (err) => {
                        if (err) {
                            console.log('Error sending testcases file');
                        }
                        else {
                            console.log('Successfully sent the testcases file');
                        }
                    });
                }
            });
        })
        .catch(err => {
            let ws = activeConnections?.get('fileBased-connection');
            console.log('Some error occurred while initiating testing');
            fs.writeFileSync(testResultFile, err.toString());

            fs.readFile(testResultFile, (err, data) => {
                if (err) {
                    console.log(err);
                }
                else {
                    let payload = {
                        fileData: data.toString('base64'),
                        isFile: true
                    };

                    ws.send(JSON.stringify(payload), (err) => {
                        if (err) {
                            console.log('Error sending testcases file');
                        }
                        else {
                            console.log(data);
                            console.log('Successfully sent the testcases file');
                        }
                    });
                }
            });
        });
    }

    res.status(200).json({
        success: true,
        message: 'Testing Has Been Initiated',
        err: {}
    });

}

const asyncBotResponse = (req, res) => {
    console.log('New callback route is triggered --------------->');

    //console.log(req.url);
    let callbackId = req.url.split('/')[2];
    let botId = callbackId.split('_')[1];
    let channel = callbackId.split('_')[2];

    if (channel === 'webhook') {
        // Send a message to the WebSocket client
        if (req.body.hasOwnProperty('data')) {
            // ws.send(JSON.stringify(req.body.data[0]));
            console.log('Request body is made ------------------------------->');
            console.log("async webhook response:", req.body);
            console.log(" keys of async webhook response:", Object.keys(req.body));
            let message = req.body.data[0];
            let type = 'text';

            if (message.type === 'template') {
                message = JSON.stringify(message);
                type = 'template';
            }

            let responseObj = {
                'message': message,
                'botId': botId,
                'channel': channel,
                'type': type
            };
            let ws = activeConnections.get(callbackId);
            console.log(responseObj);
            ws.send(JSON.stringify(responseObj));
        }
    }
    else if(channel === 'slack'){
        console.log('Its slack channel');
        console.log(req.body);
        if(req.body.isAssertion){
            delete req.body.isAssertion;
            const assertionResponsesFile = path.join(__dirname, '../', '/testcases', 'assertionResponse.json')
            fs.writeFileSync(assertionResponsesFile, JSON.stringify(req.body));
            res.status(201).json({
                'message': 'Response Received'
            });
            return;
        }
        let responseObj = {
            'message': {
                type: 'text',
                val: req.body.text
            },
            'botId': botId,
            'channel': channel,
            'type': 'text',
        };
        let ws = activeConnections.get(callbackId);
        ws.send(JSON.stringify(responseObj));
    }
    else {
        console.error('Channel not found');
    }
    res.status(201).json({
        'message': 'Response Received'
    });
};

function websocketConnections(updatedactiveConnections) {
    activeConnections = updatedactiveConnections;
}

module.exports = {
    fetchTestCases,
    asyncBotResponse,
    websocketConnections
};
