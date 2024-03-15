# Welcome to Channel Simulator

## Project Setup

- Create a `.env` file in the root directory of the project.
- In `.env` file assign the following variables with appropriate values.
```
    PORT = "Enter PORT Number"
    TOKEN = "Enter Token"
    XO_API_KEY = "Enter API Key"
    apiUrlWebhook = "Enter API URL For Webhook channel"
    apiUrlAMFB = "Enter API URL For AMFB channel"
```
- For Asynchronous channels functionality the callback url should be of the following format
  `https://ngrok-url/api/v1/callback/callback_your-bot-id_channel-name`. For example, in case of Webhook channel the callback url would be `https://ngrok-url/api/v1/callback/callback_your-bot-id_webhook`
- Create a folder by the name `testcases` in the root directory of the project.
- Create a file by the name `test_results.txt` which will contain the results of the testcases as part of the Assertion Functionality.
- Do `npm install`.
- To start the server do, `npm start`.



