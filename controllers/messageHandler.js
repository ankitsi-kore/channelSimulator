const axios = require('axios');
const config = require('../config/serverConfig');

const sendMessageToXO = async function (messageReceived, botId, mssgType, channel) {
    if (channel === 'webhook') {
        console.log('Received message:', messageReceived);
        //console.log('Received Obj:', JSON.parse(message));
        const apiUrl = `${config.apiUrlWebhook}/${botId}`;//`http://localhost/chatbot/v2/webhook/${botId}`;
        let reqObj;
        console.log('This is client req webhook ---------->');
        if (mssgType === 'json') {
            //mssgType = 'text';
            reqObj = messageReceived;
            console.log('json was updated');
            console.log(reqObj);
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

        try {
            const responseFromBot = await callToXo(apiUrl, reqObj, headers, channel);
            console.log('response from bot sync webhook:', responseFromBot);
            const responseToSend = responseFromBot;
            if (responseToSend) {
                let responseObj = {
                    'message': responseToSend[0],
                    'botId': botId,
                    'channel': channel,
                    'type': mssgType
                };
                return JSON.stringify(responseObj);
            }
            else {
                return JSON.stringify({ 'val': '' });
            }
        }
        catch (error) {
            console.log('Error in controller:', error);
            return error;
        }
    }
    else if (channel === 'amfb') {
        console.log('Received message:', messageReceived);

        const apiUrl = `${config.apiUrlAMFB}/${botId}`;//`http://localhost/adapter/hooks/amfb/${botId}`;
        let reqObj;
        if (mssgType === 'json') {
            reqObj = messageReceived;
            console.log('json was updated');
            console.log(reqObj);
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
            "callbackurl": `https://1cc3-115-114-88-222.ngrok-free.app/callback/${callbackId}`
        };
        try {
            const responseFromBot = await callToXo(apiUrl, reqObj, headers, channel);
            let responseToSend;
            let responseType = responseFromBot.type;
            if (responseFromBot.type === 'text' && responseFromBot.hasOwnProperty('body')) {
                responseToSend = responseFromBot.body;
            }
            else {
                responseToSend = responseFromBot;
            }
            if (responseToSend) {
                let responseObj = {
                    'message': {
                        'type': `${responseType}`,
                        'val': responseToSend
                    },
                    'botId': botId,
                    'channel': channel
                };

                return JSON.stringify(responseObj)
            }
            else {
                return JSON.stringify({ 'val': '' });
            }
        }
        catch (error) {
            return error;
        }
    }
    else if(channel === 'slack'){
        const apiUrl = `${config.apiUrlSlack}/${botId}`;
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
                    "channel": "channelSimulator",
                    "event_ts": "1712227419.090379",
                    "channel_type": "im"
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
            "Content-Type": "application/json",
            "simulatorcallbackurl": `${config.channelSimulatorCallbackUrl}_${botId}_slack`
        };
        
        try {
            const responseFromBot = await callToXo(apiUrl, reqObj, headers, channel);

            let responseToSend;
            let responseType = responseFromBot.type;
            if (responseFromBot.type === 'text' && responseFromBot.hasOwnProperty('body')) {
                responseToSend = responseFromBot.body;
            }
            else {
                responseToSend = responseFromBot;
            }
            
            return JSON.stringify({ 'val': '' });
        }
        catch (error) {
            return error;
        }
    }
}

const callToXo = async function (apiUrl, reqObj, headers, channel) {
    let responseFromBot = await axios.post(apiUrl, reqObj, { headers });

    if (channel === 'webhook') {
        return responseFromBot.data.data;
    }
    else if (channel === 'amfb') {
        responseFromBot = responseFromBot.data[0];
    }
    // console.log('call to xo response:::::', responseFromBot);
    return responseFromBot;
}


module.exports = {
    sendMessageToXO,
    callToXo,
    getCurrTestResponse: require('./handler')
};