const fs = require('fs');
const path = require('path');
const axios = require('axios');
const config = require('../config/serverConfig');

const testBot = require('../controllers/handler');
const testDetailsFilePath = path.join(__dirname, '../', '/testcases', '/testdetails.json');
const testDetailsFile = JSON.parse(fs.readFileSync(testDetailsFilePath, 'utf-8'));
const testFilePath = path.join(__dirname, '../', '/testcases', 'tests.json');

const testCases = JSON.parse(fs.readFileSync(testFilePath, 'utf-8'));
console.log('test bot:', testBot);


test.each(testCases)('Test Case: %s', async (testCase) => {
    let { apiUrl, reqObj, headers } = generatePayload(
        testCase.inputMessage,
        testCase.botId,
        'text',
        testDetailsFile.channel
    );

    if (testDetailsFile.channel === 'amfb') {
        let result = await callToXoTest(apiUrl, reqObj, headers, testDetailsFile.channel);

        // Create modified objects with "id" set to a fixed value
        let modifiedResult = { ...result, id: 'fixedIdValue' };

        console.log('Test details data:', testDetailsFile);

        //Replacing numerical data with placeholders
        let placeholder = '10';
        let expectedWithoutNumbers = JSON.stringify(testCase.expectedObject).replace(/\d+(\.\d+)?/g, placeholder);
        let resultWithoutNumbers = JSON.stringify(modifiedResult).replace(/\d+(\.\d+)?/g, placeholder);

        // Normalize strings by removing extra whitespaces, including newlines
        let normalizedExpectedObject = expectedWithoutNumbers.replace(/[+\s]/g, '');
        let normalizedResult = resultWithoutNumbers.replace(/[+\s]/g, '');

        console.log('Expected Result:', normalizedExpectedObject);
        console.log('Actual Result:', normalizedResult);

        // Use normalized strings for comparison
        expect(normalizedResult).toEqual(normalizedExpectedObject);
    }
    else if(testDetailsFile.channel === 'slack') {
        let result = await callToXoTest(apiUrl, reqObj, headers, testDetailsFile.channel);
        setTimeout(performSlackAssertion, 1000, testCase);

        // Create modified objects with "id" set to a fixed value
        
    }
}, 5000);

function performSlackAssertion(testCase){
    let assertionResponseSlackFile = path.join(__dirname, '../', '/testcases', '/assertionResponseSlack.json');
        let assertionResponseSlack = JSON.parse(fs.readFileSync(assertionResponseSlackFile, 'utf-8'));
        let modifiedResult = { ...assertionResponseSlack };

        // console.log('modifiedResult:', modifiedResult);

        //Replacing numerical data with placeholders
        let placeholder = '10';
        // console.log('Expected object:', testCase.expectedObject);
        let expectedWithoutNumbers = JSON.stringify(testCase.expectedObject).replace(/\d+(\.\d+)?/g, placeholder);
        let resultWithoutNumbers = JSON.stringify(modifiedResult).replace(/\d+(\.\d+)?/g, placeholder);

        // Normalize strings by removing extra whitespaces, including newlines
        let normalizedExpectedObject = expectedWithoutNumbers.replace(/[+\s]/g, '');
        let normalizedResult = resultWithoutNumbers.replace(/[+\s]/g, '');

        // console.log('Expected Result:', normalizedExpectedObject);
        // console.log('Actual Result:', normalizedResult);

        // Use normalized strings for comparison
        expect(normalizedResult).toEqual(normalizedExpectedObject);
}


function generatePayload(messageReceived, botId, mssgType, channel) {
    if (channel === 'webhook') {
        const apiUrl = `http://localhost/chatbot/v2/webhook/${botId}`;

        let reqObj;
        if (mssgType === 'json') {
            reqObj = messageReceived;
        }
        else {
            reqObj = {
                "message": {
                    "type": `${mssgType}`,
                    "val": `${messageReceived}`
                },
                "from": {
                    "id": "dadsfsfssfsff"
                }
            };
        }

        const headers = {
            "Authorization": config.TOKEN,
            "Content-Type": "application/json",
        };

        const callbackId = `callback_${botId}_${channel}`;

        return {
            'apiUrl': apiUrl,
            'reqObj': reqObj,
            'headers': headers
        };
    }
    else if (channel === 'amfb') {
        const apiUrl = `http://localhost/adapter/hooks/amfb/${botId}`;

        let reqObj;

        if (mssgType === 'json') {
            reqObj = messageReceived;
        }
        else {
            reqObj = {
                "body": `${messageReceived}`,
                "sourceId": "businessId",
                "locale": "en_US",
                "destinationId": "mspId",
                "v": 1,
                "type": "text",
                "id": "27167455-1f53-4ddc-a797-318ad85cb28e"
            };
        }

        const callbackId = `callback_${botId}_${channel}`;
        const headers = {
            "xo-api-key": config.XO_API_KEY,
            "Content-Type": "application/json",
            "callbackUrl": `https://1cc3-115-114-88-222.ngrok-free.app/callback/${callbackId}`
        };

        return {
            'apiUrl': apiUrl,
            'reqObj': reqObj,
            'headers': headers
        };
    }
    else if (channel === 'slack') {
        const apiUrl = `http://localhost/hooks/slack/${botId}`;
        console.log('apiUrl:', apiUrl);
        let reqObj;
        if (mssgType === 'json') {
            reqObj = messageReceived;
            console.log('json was updated');
            console.log(reqObj);
        }
        else {
            reqObj = {
                "token": "LRZc0xqBkjmXZpTImbd3p1xt",
                "team_id": "T06",
                "context_team_id": "T06",
                "context_enterprise_id": null,
                "api_app_id": "A",
                "event": {
                    "user": "U06",
                    "type": "message",
                    "ts": "1712",
                    "client_msg_id": "client_msg_id",
                    "text": `${messageReceived}`,
                    "team": "T06",
                    "blocks": [
                        {
                            "type": "rich_text",
                            "block_id": "bolnK",
                            "elements": [
                                {
                                    "type": "rich_text_section",
                                    "elements": [
                                        {
                                            "type": "text",
                                            "text": "Get City Weather"
                                        }
                                    ]
                                }
                            ]
                        }
                    ],
                    "channel": "D06",
                    "event_ts": "1712227419.090379",
                    "channel_type": "im",
                    "channelSimulatorCallbackUrl": `${config.channelSimulatorCallbackUrl}_slack`,
                    'isAssertion': true
                },
                "type": "event_callback",
                "event_id": "Ev06SBTHARJT",
                "event_time": 1712227419,
                "authorizations": [
                    {
                        "enterprise_id": null,
                        "team_id": "T06SMJQDZPE",
                        "user_id": "U06SCK2RSVC",
                        "is_bot": true,
                        "is_enterprise_install": false
                    }
                ],
                "is_ext_shared_channel": false,
                "event_context": "2UiLCJ0aWQiOiJUMDZTTUpRRFpQRSIsImFpZCI6IkEwNlQ4MDA0VTU2IiwiY2lkIjoiRDA2U1hUUlYyOUYifQ"
            };
        }

        const callbackId = `callback_${botId}_${channel}`;
        const headers = {
            "Content-Type": "application/json"
        };
        return {
            'apiUrl': apiUrl,
            'reqObj': reqObj,
            'headers': headers
        };
    }
}

async function callToXoTest(apiUrl, reqObj, headers, channel) {
    let responseFromBot = await axios.post(apiUrl, reqObj, { headers });
    if (channel === 'webhook') {
        return responseFromBot.data.data;
    }
    else if (channel === 'amfb') {
        responseFromBot = responseFromBot.data[0];

    }
    else if (channel === 'slack') {
        console.log('response from bot:', responseFromBot.data);
    }
    return responseFromBot;
} 