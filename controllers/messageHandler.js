const axios = require('axios');
const config = require('../config/serverConfig');

const sendMessageToXO = async function (messageReceived, botId, mssgType, channel) {
    if (channel === 'webhook') {
        console.log('Received message:', messageReceived);
        //console.log('Received Obj:', JSON.parse(message));
        const apiUrl = `http://localhost/chatbot/v2/webhook/${botId}`;
       

        let reqObj;
        console.log('This is client req webhook ---------->');
        //console.log(JSON.parse(messageReceived));
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
            //activeConnections.set(callbackId, ws);
            console.log('response from bot sync webhook:', responseFromBot);
            // const responseToSend = responseFromBot.data.data;
            const responseToSend = responseFromBot;
            //console.log('response to send', responseToSend);
            //console.log(responseToSend);
            //ws.send(JSON.stringify({'val': ''}));
            if (responseToSend) {
                //ws.send(JSON.stringify(responseToSend[0]));
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
    
        const apiUrl = `http://localhost/adapter/hooks/amfb/${botId}`;

        let reqObj;
        // console.log('This is client req AMFB---------->');
        // console.log(messageReceived);
        // console.log(mssgType);
        // console.log(channel);
        // console.log(botId);
        if (mssgType === 'json') {
            //mssgType = 'text';
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
            "callbackUrl": `https://1cc3-115-114-88-222.ngrok-free.app/callback/${callbackId}`
        };

        try {
            
            const responseFromBot = await callToXo(apiUrl, reqObj, headers, channel);
            //activeConnections.set(callbackId, ws);
            // console.log('response from bot amfb:', responseFromBot.data);
            // console.log('response Keys from bot amfb:', Object.keys(responseFromBot.data));
            let responseToSend;
            let responseType = responseFromBot.type;
            if (responseFromBot.type === 'text' && responseFromBot.hasOwnProperty('body')) {
                //responseToSend = responseFromBot.data[0].body;
                responseToSend = responseFromBot.body;
            }
            else {
                responseToSend = responseFromBot;
            }
            

            if (responseToSend) {
                //ws.send(JSON.stringify(responseToSend[0]));
                let responseObj = {
                    'message': {
                        'type': `${responseType}`,
                        'val': responseToSend
                    },
                    'botId': botId,
                    'channel': channel
                };
                // console.log(responseObj);
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
}

async function callToXo(apiUrl, reqObj, headers, channel){
    let responseFromBot = await axios.post(apiUrl, reqObj, { headers });

    if(channel === 'webhook'){
       return responseFromBot.data.data;
    }
    else if(channel === 'amfb'){
        responseFromBot = responseFromBot.data[0]; 
    }

    console.log('call to xo response:::::', responseFromBot);
    return responseFromBot;
} 

module.exports = {
    sendMessageToXO,
    callToXo
};