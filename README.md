# Welcome to Channel Simulator

## Project Setup

- Create a `.env` file in the root directory of the project.
- In `.env` file assign the following variables with appropriate values.
```
    PORT = 'Enter Port Number'
    TOKEN =  'Enter JWT Token'
    XO_API_KEY = 'Enter XO_API_KEY'
    channelSimulatorCallbackUrl = 'your-ngrok-url/api/v1/callback/callback'
    asyncTestingCallbackUrl = 'your-ngrok-url/api/v1/asynctesting/callback/callback'
    apiUrlSlack = 'Platform Slack Hook Url'
    apiUrlAMFB = 'Platform AMFB Hook Url'
    apiUrlWebhook = 'Platform Webhook Url'
```
- For Asynchronous channels functionality the callback url for the XO platform should be of the following format
  `https://ngrok-url/api/v1/callback/callback_your-bot-id_channel-name`. For example, in case of Webhook channel the callback url would be `https://ngrok-url/api/v1/callback/callback_your-bot-id_webhook`
- To conduct automation testing for the webhook channel, ensure that the callback URL adheres to the specified format: `https://ngrok-url/api/v1/asynctesting/callback/callback_your-bot-id_webhook`. This URL should be configured within the XO platform to receive responses at the designated callback URL for automation testing.
- Create a folder by the name `testcases` in the root directory of the project.
- Create a file by the name `test_results.txt` which will contain the results of the testcases as part of the Assertion Functionality.
- Do `npm install`.
- To start the server do, `npm start`.