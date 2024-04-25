const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const asyncTesting = require('../automationTesting/asyncTesting');

var activeConnections = {};
var testBotDetails = {};

const asyncExec = function (command) {
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

const fetchTestCases = async function (req, res) {
    try {
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

        if (req.body.channel === 'slack') {
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
            asyncExec('npm test')
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

        return res.status(200).json({
            success: true,
            message: 'Testing Has Been Initiated',
            err: {}
        });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message: 'Some Problem Occurred while testing initiation',
            err: {}
        });
    }
}

const asyncBotResponse = function (req, res) {
    try {
        console.log('New callback route is triggered --------------->');
        let callbackId = req.url.split('/')[2];
        let botId = callbackId.split('_')[1];
        let channel = callbackId.split('_')[2];
        if (channel === 'webhook') {
            if (req.body.hasOwnProperty('data')) {
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
        else if (channel === 'slack') {
            console.log('Its slack channel');
            console.log(req.body);
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

        return res.status(201).json({
            'message': 'Response Received'
        });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({
            'message': 'Some Problem Occured'
        });
    }
};

const isStringifiedJSON = function (value) {
    try {
        const parsedValue = JSON.parse(value);
        console.log('parsed value::', parsedValue);
        return parsedValue;
    } catch (error) {
        return false;
    }
}

const asyncTestingResponse = function (req, res) {
    try {
        console.log('request came in asyncTestingResponse')
        console.log(JSON.stringify(req.body));
        let currTestResponse = req.body;
        let parsedText = isStringifiedJSON(req.body.text);
        if(parsedText){
            currTestResponse.text = parsedText
        }
        asyncTesting.getCurrTestResponse(currTestResponse);
        return res.status(201).json({
            'message': 'Response Received'
        });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({
            'message': 'Some problem occurred'
        });
    }
}

const websocketConnections = function (updatedactiveConnections) {
    activeConnections = updatedactiveConnections;
}

const getChannels = function (req, res) {
    try {
        let channels = JSON.parse(fs.readFileSync(path.join(__dirname, '../', 'channels.json')));
        console.log('channels:', channels);
        return res.status(200).json({
            data: JSON.stringify(channels),
            success: true,
            message: 'Successfully fetched the channels',
            err: {}
        });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message: 'Some Problem Occurred while testing initiation',
            err: {}
        });
    }
}

const addChannel = function (req, res) {
    try {
        console.log('add channels request');
        let channels = JSON.parse(fs.readFileSync(path.join(__dirname, '../', 'channels.json')));
        let id = channels.length;
        let channelDetails = {
            'channel_name': req.body.channel_name,
            'id': id + 1
        };
        channels.push(channelDetails);
        fs.writeFileSync(path.join(__dirname, '../', 'channels.json'), JSON.stringify(channels));
        return res.status(201).json({
            data: JSON.stringify(channels),
            success: true,
            message: 'Successfully added the channel',
            err: {}
        });

    }
    catch (err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message: 'Some Problem Occurred while adding the channel',
            err: {}
        });
    }
}

module.exports = {
    fetchTestCases,
    asyncBotResponse,
    asyncTestingResponse,
    websocketConnections,
    getChannels,
    addChannel
};
