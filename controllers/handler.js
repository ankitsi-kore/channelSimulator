const fs = require('fs');
const path = require('path');

var activeConnections = {};
// var currentTestDetails = {};
var testBotDetails = {};

const { exec } = require('child_process');

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
    // testBotDetailsUpdate(req.body.botId);
    // testBotDetailsUpdate('st-21f69d7b-ffbf-567f-ba5f-fe31bf719c24');
    // const filePath = path.join(__dirname, '../', '/testcases', 'tests.json');

    // const fileData = fs.readFileSync(filePath, 'utf-8');
    // let testDetails = {};

    // testDetails.botId = req.body.botId;
    // testDetails.channel = req.body.channel;
    // testDetails.identity = req.body.identity;
    // testDetails.environment = req.body.environment;
    // testDetails.fileData = fileData;
    // testCaseDetails(testDetails);
    //console.log(fileData);
    let testDetails = {
        'botId': req.body.botId,
        'environment': req.body.environment,
        'channel': req.body.channel,
        'identity': req.body.identity

    }

    const testDetailsFilePath = path.join(__dirname, '../', '/testcases', 'testdetails.json')

    fs.writeFileSync(testDetailsFilePath, JSON.stringify(testDetails));

    const testResultFile = path.join(__dirname, '../', 'test_results.txt');

    let ws = activeConnections.get('fileBased-connection');
    console.log('testing will start');
    console.log('Bot test:', testBotDetails);

    AsyncExec('npm test')
        .then(result => {
            console.log('Output was new format:', result);
            //console.log('Output was:\n', output);
            //const testResultFile = path.join(__dirname, '../', 'test_results.txt');
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

            // res.setHeader('Content-Disposition', 'attachment; filename=test_results.txt');
            // res.setHeader('Content-Type', 'text/plain'); // Adjust the content type based on your file type


            // res.status(201).sendFile(testResultFile);
        })
        .catch(err => {
            let ws = activeConnections.get('fileBased-connection');
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

    let ws = activeConnections.get(callbackId);

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

            console.log(responseObj);
            ws.send(JSON.stringify(responseObj));

        }
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

// function testCaseDetails(testDetails) {
//     currentTestDetails = testDetails;
// }

// function testBotDetailsUpdate(botId){
//     testBotDetails.botId = botId
// }

module.exports = {
    fetchTestCases,
    asyncBotResponse,
    websocketConnections
};
