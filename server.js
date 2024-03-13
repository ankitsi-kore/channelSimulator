const express = require('express');
const bodyParser = require('body-parser');
const { PORT } = require('./config/serverConfig');
const ApiRoutes = require('./routes/index');
const expressWS = require('express-ws');
const path = require('path');
const axios = require('axios');
const cors = require('cors');
const messageHandler = require('./controllers/messageHandler');
const handler = require('./controllers/handler');
const morgan = require('morgan');

const app = express();
expressWS(app);
const activeConnections = new Map();

app.use(morgan('dev'));

function InitializeSocket(ws, req) {
    console.log('WebSocket connection established');

    ws.on('message', async (message) => {
        const messageReceived = JSON.parse(message).message;
        const botId = JSON.parse(message).botId;
        // let mssgType = (JSON.parse(message).type === 'Text') ? 'text' : 'json';
        let mssgType = '';
        if (JSON.parse(message).type === 'file') {
            activeConnections.set('fileBased-connection', ws);
            handler.websocketConnections(activeConnections);
            console.log('file based connection is saved');
        }
        else {
            mssgType = (JSON.parse(message).type === 'Text') ? 'text' : 'json';
        }

        const channel = JSON.parse(message).channel;
        try {
            const callbackId = `callback_${botId}_${channel}`;
            activeConnections.set(callbackId, ws);
            handler.websocketConnections(activeConnections);
            const responseObj = await messageHandler.sendMessageToXO(messageReceived, botId, mssgType, channel);
            console.log('response for user:', responseObj);
            ws.send(responseObj);
        }
        catch (err) {

            let responseObj = {
                'message': {
                    'type': 'text',
                    'val': 'Some Error has occurred'
                },
                'botId': botId,
                'channel': channel,
                'type': mssgType
            };
            console.log(err);
            ws.send(responseObj);
        }

    });

    ws.on('close', () => {
        console.log('WebSocket connection closed');
        activeConnections.delete(ws);
    });
}

const SetupAndStartServer = async () => {
    // Creating express object
    app.use(cors());
    app.use(bodyParser.json({ limit: '50mb' }));

    app.use(bodyParser.urlencoded({ extended: true }));
    app.use('/api', ApiRoutes);
    app.use(express.static(path.join(__dirname, '/public')));

    app.ws('/ws', InitializeSocket);
    /**
        identity: yesu001
        botId: st-1234
        chanel: ivr (Webhook) 

        callbackId: callback_st-1234_ivr

        http://ngrok.com/callback/callback_st-1234_yesu001_ivr
     */
    app.listen(PORT, () => {
        console.log(`Server started at PORT:${PORT}`);
    });
};

SetupAndStartServer();


