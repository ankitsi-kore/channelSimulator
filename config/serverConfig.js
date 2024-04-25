const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    PORT : process.env.PORT,
    TOKEN: process.env.TOKEN,
    XO_API_KEY: process.env.XO_API_KEY,
    apiUrlWebhook: process.env.apiUrlWebhook,
    apiUrlAMFB: process.env.apiUrlAMFB,
    apiUrlSlack: process.env.apiUrlSlack,
    channelSimulatorCallbackUrl: process.env.channelSimulatorCallbackUrl,
    asyncTestingCallbackUrl: process.env.asyncTestingCallbackUrl
};
