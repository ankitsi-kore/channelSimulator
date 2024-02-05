const socket = new WebSocket('ws://localhost:5005/ws');

var currentChannel = ''; //For fetching current thread
var currentBotId = '';//For fetching current thread

var pendingResponseChannel = ''; //For Fetching pending response thread
var pendingResponseBotId = ''; //For Fetching pending response thread


var fileDataReceived = '';

// Connection opened
socket.addEventListener('open', (event) => {
    console.log('WebSocket connection opened');
    socket.send(JSON.stringify({
        "message": "temp mssg",
        "channel": "oblivion channel",
        "botId": "st-123",
        "type": "file"
    }));
});

//Listen for messages
socket.addEventListener('message', (event) => {
    //console.log(event);
    console.log('Message came');
    let receivedResponse = '';//JSON.parse(event.data);
    if (event.data instanceof Blob) {
        receivedResponse = event.data;
    }
    else {
        receivedResponse = JSON.parse(event.data);
    }

    console.log('Received Response:', receivedResponse);

    if (receivedResponse.hasOwnProperty('isFile') || receivedResponse.hasOwnProperty('fileData')) {
        console.log('Received response file Data:', receivedResponse);
        showResults();

        const fileData = receivedResponse.fileData;
        //const additionalData = receivedResponse.additionalData;

        // Convert base64-encoded file data to a Blob

        console.log('File data:', fileData);

        fileDataReceived = fileData;

    }
    else {
        if (receivedResponse.channel === 'amfb') {
            if (receivedResponse.message.type === 'text') {
                console.log('AMFB response:', receivedResponse.message);
                const threadState = getThreadState(receivedResponse.channel, receivedResponse.botId);

                threadState.messages.push({ type: 'message received', content: receivedResponse.message.val, timestamp: getCurrentTimestamp() });

                saveThread(receivedResponse.channel, receivedResponse.botId, threadState);
                //displayReceivedMessage(receivedMessage.val);
                initializeCurrentThread(currentChannel, currentBotId);
            }
            else {
                console.log('AMFB response:', receivedResponse.message);
                const threadState = getThreadState(receivedResponse.channel, receivedResponse.botId);

                threadState.messages.push({ type: 'message received', content: JSON.stringify(receivedResponse.message), timestamp: getCurrentTimestamp()  });

                saveThread(receivedResponse.channel, receivedResponse.botId, threadState);
                //displayReceivedMessage(receivedMessage.val);
                initializeCurrentThread(currentChannel, currentBotId);
            }
        }
        else if (receivedResponse.hasOwnProperty('message') && receivedResponse.type === 'template') {
            const receivedMessage = receivedResponse.message;
            console.log('Payload Message:', receivedMessage);
            const threadState = getThreadState(receivedResponse.channel, receivedResponse.botId);

            threadState.messages.push({ type: 'message received', content: receivedMessage, timestamp: getCurrentTimestamp() });

            saveThread(receivedResponse.channel, receivedResponse.botId, threadState);
            //displayReceivedMessage(receivedMessage.val);
            initializeCurrentThread(currentChannel, currentBotId);

        }
        else if (receivedResponse.hasOwnProperty('message')) {
            // = receivedResponse.message;
            console.log('Received message from server:', receivedResponse);

            //  var decodedURL = decodeURIComponent(receivedResponse.message.val);
            //  var doc = new DOMParser().parseFromString(decodedURL, 'text/html');
            //  const receivedMessage = doc.body.textContent;

            const regex = /&quot;([^"]*)&quot;/g;

            if (regex.test(receivedResponse.message.val)) {
                console.log('It was decoded');
                const encodedString = receivedResponse.message.val;
                const decodedString = encodedString.replace(/&quot;/g, '\"');
                //console
                receivedResponse.message.val = decodedString;
            }

            let receivedMessage = receivedResponse.message;

            //if(receivedMessage !== '' && )
            if (receivedMessage !== '' && receivedResponse.message.type === 'text') {
                console.log('Its not a template');
                const threadState = getThreadState(receivedResponse.channel, receivedResponse.botId);

                threadState.messages.push({ type: 'message received', content: receivedMessage.val, timestamp: getCurrentTimestamp() });

                saveThread(receivedResponse.channel, receivedResponse.botId, threadState);
                //displayReceivedMessage(receivedMessage.val);
                initializeCurrentThread(currentChannel, currentBotId);
            }
            else if (receivedMessage.val !== '' && receivedMessage.type === 'template') {
                const threadState = getThreadState(receivedResponse.channel, receivedResponse.botId);
                console.log('It came here');

                threadState.messages.push({ type: 'message received', content: JSON.stringify(receivedMessage), timestamp: getCurrentTimestamp() });

                saveThread(receivedResponse.channel, receivedResponse.botId, threadState);
                //displayReceivedMessage(receivedMessage.val);
                initializeCurrentThread(currentChannel, currentBotId);

            }

        }
    }

});

// Connection closed
socket.addEventListener('close', (event) => {
    console.log('WebSocket connection closed');
});

function getThreadState(channel, BotId) {
    const key = `${BotId}-${channel}`;
    const storedState = localStorage.getItem(key);

    return storedState ? JSON.parse(storedState) : { messages: [] };

}

function saveThread(channel, BotId, state) {
    const key = `${BotId}-${channel}`;

    localStorage.setItem(key, JSON.stringify(state));
}



function displayThreadPopup() {
    let popupWindow = document.getElementById('popup-container');
    let overlay = document.getElementById('overlay-thread');
    popupWindow.style.display = 'block';
    overlay.style.display = 'block';
}

function displayChannelPopup() {
    let popupWindow = document.getElementById('channelPopup');
    let overlay = document.getElementById('overlay-channel');
    popupWindow.style.display = 'block';
    overlay.style.display = 'block';
}

function closePopupThread() {
    let popupWindow = document.getElementById('popup-container');
    let overlay = document.getElementById('overlay-thread');
    popupWindow.style.display = 'none';
    overlay.style.display = 'none';
}

function closePopupChannel() {
    let popupWindow = document.getElementById('channelPopup');
    let overlay = document.getElementById('overlay-channel');
    popupWindow.style.display = 'none';
    overlay.style.display = 'none';
}

function displayTestCasesPopup() {
    let popupWindow = document.getElementById('jsonPopup');
    let overlay = document.getElementById('overlay-popup');
    popupWindow.style.display = 'block';
    overlay.style.display = 'block';
}

function closeTestCasesPopup() {
    let popupWindow = document.getElementById('jsonPopup');
    let overlay = document.getElementById('overlay-popup');
    popupWindow.style.display = 'none';
    overlay.style.display = 'none';
}

function createChannel() {

    var params = document.getElementById('channel_name').value;
    var obj = {
        "channel_name": params
    };

    var xhrGet = new XMLHttpRequest();
    var urlGet = "https://658175963dfdd1b11c435308.mockapi.io/channels";

    xhrGet.open("GET", urlGet, true);
    xhrGet.onreadystatechange = function () {
        if (xhrGet.readyState == 4) {
            if (xhrGet.status == 200) {
                var existingChannels = JSON.parse(xhrGet.responseText);

                var isObjectAlreadyExists = checkIfObjectExists(existingChannels, obj);

                if (!isObjectAlreadyExists) {
                    createNewChannel();
                } else {
                    alert("channel already exists!!!");
                    params = "";
                    closePopupChannel();
                }
            } else {
                console.error("Error occurred while fetching existing channels");
            }
        }
    };
    xhrGet.send();
}

function checkIfObjectExists(existingChannels, newObj) {

    return existingChannels.some(channel => channel.channel_name === newObj.channel_name);
}

function createNewChannel() {
    var params = document.getElementById('channel_name').value;
    var obj = {
        "channel_name": params
    };

    console.log("...............creating channel");

    var xhrPost = new XMLHttpRequest();
    var urlPost = "https://658175963dfdd1b11c435308.mockapi.io/channels";

    xhrPost.open("POST", urlPost, true);
    xhrPost.setRequestHeader("Content-type", "application/json");
    xhrPost.onreadystatechange = function () {
        if (xhrPost.readyState == 4) {
            if (xhrPost.status == 201) {
                console.log(xhrPost.responseText);
                getChannels();
                closePopupChannel();
                alert('New channel is Added !!!');
                document.getElementById('channel_name').value = '';
            } else {
                console.error("Error occurred while creating a new channel");
            }
        }
    };
    xhrPost.send(JSON.stringify(obj));

    closePopupChannel();
}

function setChannels(data) {

    var responseData = data;

    var channelOptionsThreads = document.getElementById("channel-option");
    channelOptionsThreads.innerHTML = '';

    var channelOptionsTestcase = document.getElementById("channel-testcase");
    channelOptionsTestcase.innerHTML = '';

    var defaultOption = document.createElement("option");
    defaultOption.value = "webhook";
    defaultOption.text = "WebHook";

    var defaultOptionTestcase = document.createElement("option");
    defaultOptionTestcase.value = "webhook";
    defaultOptionTestcase.text = "WebHook";

    channelOptionsThreads.appendChild(defaultOption);
    channelOptionsTestcase.appendChild(defaultOptionTestcase);

    for (var i = 0; i < responseData.length; i++) {
        var channel = responseData[i].channel_name;
        channel = channel.toLowerCase();

        var option = document.createElement("option");
        var optionTestcase = document.createElement("option");

        if (channel === 'apple') {
            option.value = 'amfb';
            optionTestcase.value = 'amfb';
        }
        else {
            option.value = channel;
            optionTestcase.value = channel;
        }
        option.text = channel;
        optionTestcase.text = channel;

        channelOptionsThreads.appendChild(option);
        channelOptionsTestcase.appendChild(optionTestcase);
    }

}

function getChannels() {

    var xhr = new XMLHttpRequest();
    var url = "https://658175963dfdd1b11c435308.mockapi.io/channels";
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                var responseData = JSON.parse(xhr.responseText);
                setChannels(responseData);
                // console.log(responseData);
                // console.log(responseData.length);
            } else {
                console.error("Error occurred");
            }
        }
    };
    xhr.send();

}

function initializeThreads() {
    console.log(`for thread ${currentChannel}-${currentBotId}`);
    if (localStorage.getItem('threads')) {
        // displaylistThreads();
        getThreads();
    }
    else {
        // let url = "https://658175963dfdd1b11c435308.mockapi.io/channel_simulator";
        // let xhttp = new XMLHttpRequest();
        // xhttp.onreadystatechange = function () {
        // if (this.readyState === 4 && this.status === 200) {

        // localStorage.setItem('threads', this.responseText);
        // displaylistThreads();
        // }
        // };
        // xhttp.open("GET", url, true);
        // xhttp.send();
        localStorage.setItem('threads', JSON.stringify([]));
        // displaylistThreads();
        getThreads();
    }
}


function getThreads() {
    var threads = JSON.parse(localStorage.getItem('threads'));
    // console.log(threads);
    displaylistThreads(threads);
    //filterThreads(JSON.stringify(threads));
}

let previousSearchQuery = ' ';

function filterThreads() {
    const threadList = document.getElementById('thread-list');
    threadList.innerHTML = '';

    const threads = JSON.parse(localStorage.getItem('threads'));

    const searchInput = document.getElementById("searchThreads");
    searchInput.addEventListener("input", function () {
        const searchQuery = searchInput.value.toLowerCase();

        // Check if the search query has changed
        if (searchQuery !== previousSearchQuery || searchQuery.length === 1 || searchQuery.length === 0) {
            previousSearchQuery = searchQuery;

            const filteredItems = threads.filter(item => item.identity.toLowerCase().includes(searchQuery));

            displaylistThreads(filteredItems);
        }
    });
}

function displaylistThreads(threads) {
    const threadList = document.getElementById('thread-list');
    threadList.innerHTML = '';

    if (threads.length > 0) {
        updateCurrentThreadDetails(threads[threads.length - 1].channel, threads[threads.length - 1].bot_id);
        initializeCurrentThread(threads[threads.length - 1].channel, threads[threads.length - 1].bot_id);
    }

    for (let i = threads.length - 1; i >= 0; i--) {
        let currentThread = threads[i];


        let threadItem = document.createElement('div');
        threadItem.className = 'thread-list-item';
        threadItem.id = `${currentThread.bot_id}-${currentThread.channel}`;
        threadItem.onclick = () => initializeCurrentThread(currentThread.channel, currentThread.bot_id);

        threadItem.innerHTML = `
            <span class="thread-name">${currentThread.identity}-${currentThread.channel}</span><br>
          `;

        threadList.appendChild(threadItem);
    }

}

function submitForm() {
    let botId = document.getElementById('bot_id').value;


    //let name = 'Thread ABC';
    let environment = document.getElementById('environment-option').value;
    let channel = document.getElementById('channel-option').value;
    let identity = document.getElementById('identity').value;

    let reqObj = {
        'bot_id': botId,
        'identity': identity,
        'environment': environment,
        'channel': channel
    };

    if (localStorage.getItem(`${botId}-${channel}`)) {
        alert('A thread with same Bot-Id and channel Already Exists !!!');
    }
    else {
        if (botId && environment && channel && identity) {
            console.log(reqObj);
            let threads = JSON.parse(localStorage.getItem('threads'));

            threads.push(reqObj);
            console.log('Threads in local storage');
            console.log(threads);
            //localStorage.removeItem('threads');
            localStorage.setItem('threads', JSON.stringify(threads));
            localStorage.setItem(`${botId}-${channel}`, JSON.stringify({ messages: [] }));

            document.getElementsByClassName('send-button').disabled = true;
            updateCurrentThreadDetails(channel, botId);
            alert('Sucessfully added the thread');
            window.location.reload();
        }
        else {
            alert('Fill All the Details !!!');
        }
    }
}


function sendMessage() {

    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value;

    const mssgType = document.getElementById('mssg-type').innerText;
    console.log(message);


    // Send the message over the WebSocket connection
    socket.send(JSON.stringify({
        "message": message,
        "channel": currentChannel,
        "botId": currentBotId,
        "type": mssgType
    }));


    const threadState = getThreadState(currentChannel, currentBotId);

    threadState.messages.push({ type: 'message sent', content: message, timestamp: getCurrentTimestamp() });

    getPendingThreadDetails(currentChannel, currentBotId);

    saveThread(currentChannel, currentBotId, threadState);

    addMessage(message, getCurrentTimestamp());
    // Clear the input field
    messageInput.value = '';

}

function getCurrentTimestamp() {
    const options = {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true
    };
    const timestamp = new Date().toLocaleString('en-US', options);
    return timestamp;
}

function addMessage(messageText, time) {
    //var messageInput = document.getElementById('messageInput');
    var chatMessages = document.getElementById('chat-messages');

    if (messageText !== '') {
        var messageDiv = document.createElement('div');
        messageDiv.setAttribute('id', 'msg');
        messageDiv.classList.add('message', 'sent');

        var timestamp = document.createElement('div');
        timestamp.classList.add('timestamp');
        timestamp.innerText = time;

        var messageContent = document.createElement('span');
        messageContent.innerText = messageText;
        messageContent.appendChild(timestamp);

        messageDiv.appendChild(messageContent);
        chatMessages.appendChild(messageDiv);

        //messageInput.value = '';

        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    //sendMessage();
}

// function simulateReceivedMessage() {
// setInterval(function () {
// var receivedMessage = "Hello, this is a received message!Hello, this is a received message!This modification sets the background color for received messages to #fff to differentiate it from the container background. Feel free to adjust the colors as per your design preferences.This modification sets the background color for received messages to #fff to differentiate it from the container background. Feel free to adjust the colors as per your design preferences.This modification sets the background color for received messages to #fff to differentiate it from the container background. Feel free to adjust the colors as per your design preferences";
// displayReceivedMessage(receivedMessage);
// }, 3000);
// }

function displayReceivedMessage(messageText, time) {
    var chatMessages = document.getElementById('chat-messages');

    var messageDiv = document.createElement('div');
    messageDiv.setAttribute('id', 'msg');
    messageDiv.classList.add('message', 'received');

    var timestamp = document.createElement('div');
    timestamp.classList.add('timestamp');
    timestamp.innerText = time;

    var messageContent = document.createElement('span');

    messageContent.innerText = messageText;
    messageContent.appendChild(timestamp)


    messageDiv.appendChild(messageContent);

    chatMessages.appendChild(messageDiv);

    chatMessages.scrollTop = chatMessages.scrollHeight;

    // const threadState = getThreadState(currentBotId, currentIdentity);

    // threadState.messages.push({type: 'message received', content: messageText});

    // saveThread(currentBotId, currentIdentity, threadState);


}

//simulateReceivedMessage();

document.getElementById('messageInput').addEventListener('keyup', function (event) {
    if (event.key === 'Enter') {
        if (currentChannel !== '' && currentBotId !== '') {
            sendMessage();
        }
        else {
            alert('Please Select a Thread or create a new one !!!');
        }

        //sendMessage();
    }
});

function initializeCurrentThread(channel, BotId) {
    console.log('Thread was clicked')
    var chatMessages = document.getElementById('chat-messages');
    chatMessages.innerText = ``;
    document.getElementsByClassName('send-button')[0].disabled = false;
    updateCurrentThreadDetails(channel, BotId);
    const currentThreadState = getThreadState(channel, BotId);


    currentThreadState.messages.forEach(currentMssg => {
        if (currentMssg.type === 'message received') {
            displayReceivedMessage(currentMssg.content, currentMssg.timestamp);
        }
        else if (currentMssg.type === 'message sent') {
            addMessage(currentMssg.content, currentMssg.timestamp);
        }
    });
}

function updateCurrentThreadDetails(channel, BotId) {
    //return {botId, identity};

    currentChannel = channel;
    currentBotId = BotId;
}

function getPendingThreadDetails(channel, BotId) {
    pendingResponseChannel = channel;
    pendingResponseBotId = BotId;
}

function handleMessageType(type) {
    console.log('Type is:', type);
    let msgType = document.getElementById('mssg-type');
    msgType.innerText = type;
}

// function submitTestCases() {
//     let testcases = document.getElementById('testcases');
//     let botId = document.getElementById('bot_id-testcase').value;


//     //let name = 'Thread ABC';
//     let environment = document.getElementById('environment-testcase').value;
//     let channel = document.getElementById('channel-testcase').value;
//     let identity = document.getElementById('identity-testcase').value;

//     // let reqObj = {
//     //     'botId': botId,
//     //     'testcases': testcases.value,
//     //     'environment': environment,
//     //     'channel': channel,
//     //     'identity': identity
//     // };

//     let formData = new FormData();
//     formData.append('botId', botId);
//     formData.append('testcases', testcases.files[0]);
//     formData.append('environment', environment);
//     formData.append('channel', channel);
//     formData.append('identity', identity);


//     if (botId, testcases, environment, channel, identity) {
//         closeTestCasesPopup();
//         let url = "http://localhost:5005/api/v1/testcase";

//         fetch(url, {
//             method: 'POST',
//             body: formData
//         })
//             .then(response => {
//                 if (response.status === 201) {
//                     console.log(response);
//                     const blob = response.blob();
//                     const blobUrl = URL.createObjectURL(blob);

//                     // Create a link element
//                     const link = document.createElement("a");

//                     // Set link's href to point to the Blob URL
//                     link.href = blobUrl;
//                     link.download = 'test_results.txt';

//                     // Append link to the body
//                     document.body.appendChild(link);

//                     // Dispatch click event on the link
//                     // This is necessary as link.click() does not work on the latest firefox
//                     link.dispatchEvent(
//                       new MouseEvent('click', { 
//                         bubbles: true, 
//                         cancelable: true, 
//                         view: window 
//                       })
//                     );

//                     // Remove link from body
//                     document.body.removeChild(link);

//                     // window.location.reload();
//                     //closeTestCasesPopup();
//                 }
//             })
//             .catch(err => {
//                 throw err;
//             });
//     }
//     else {
//         alert("Please Fill All the Details !!!");
//     }
// }

function submitTestCases() {
    let testcases = document.getElementById('testcases');
    // let botId = document.getElementById('bot_id-testcase').value;
    let environment = document.getElementById('environment-testcase').value;
    let channel = document.getElementById('channel-testcase').value;
    let identity = document.getElementById('identity-testcase').value;

    let formData = new FormData();
    // formData.append('botId', botId);
    formData.append('testcases', testcases.files[0]);
    formData.append('environment', environment);
    formData.append('channel', channel);
    formData.append('identity', identity);

    if (testcases.files.length > 0 && environment && channel && identity) {
        closeTestCasesPopup();
        showLoadingSpinner();

        fetch("http://localhost:5005/api/v1/testcase", {
            method: 'POST',
            body: formData
        })
            .then(response => {
                if (response.status === 200) {
                    alert('Testing has been initiated');

                } else {
                    throw new Error("Failed to upload test cases");
                }
            })
            .catch(err => {
                console.error(err);
                hideLoadingSpinner();
                alert("Error downloading test results");
            });
    } else {
        alert("Please Fill All the Details !!!");
    }
}

function b64toBlob(b64Data, contentType = '', sliceSize = 512) {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);

        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
}


function showLoadingSpinner() {
    // Create and show a loading spinner with text
    const loaderContainer = document.createElement("div");
    loaderContainer.id = "loading-spinner";
    loaderContainer.className = "loader-container";
    loaderContainer.innerHTML = `
    <div class="loader"></div>
    <div class="loading-text">Testing is in Progress</div>
    `;
    document.body.appendChild(loaderContainer);
}

function hideLoadingSpinner() {
    // Hide and remove the loading spinner
    const loader = document.getElementById("loading-spinner");
    if (loader) {
        document.body.removeChild(loader);
    }
    //showResults();
}

// function showResults(fileData) {
//     //for test results popup
//     console.log('Show results:', fileData);
//     fileDataReceived = fileData;
//     let results_display = document.createElement("div");
//     results_display.id = "results-display";
//     results_display.className = "results-display";
//     results_display.innerHTML = `
//     <div class="results-display" id="results-display">
//     <span><button class="close-button" onclick="closeResults()">X</button></span>
//     <span class="green-tick">&#x2705;</span>
//     <span class="completion-text">Testing is Completed</span>
//     <span><button id="download-button" onclick="downloadResults()">Download Results</button></span>
//     </div>
//     `;
//     document.body.appendChild(results_display);
// }

function showResults() {
    //for test results popup
    const results_display = document.createElement("div");
    results_display.id = "results-display";
    results_display.className = "results-display";
    results_display.innerHTML = `
    <div class="btn_container">
    <div class="tick-mark">&#10003;</div>
    <div class="example-text">Testing is done</div>
    <button class="download-button" onclick="downloadResults()">Download</button>
    <button class="x-mark" onclick="closeResults()">&#10007;</button>
    </div>
    `;
    document.body.appendChild(results_display);
    hideLoadingSpinner();
}

function closeResults() {
    // Hide and remove the loading spinner
    const loader = document.getElementById("results-display");
    loader.style.display = 'none';
    if (loader) {
        document.body.removeChild(loader);
    }
    //closeResults();
}

function downloadResults() {
    // let download = document.getElementById('download-link');
    // console.log('New filr Data:', fileData);
    const blob = b64toBlob(fileDataReceived, 'application/octet-stream');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.id = 'download-link';

    // Set the suggested filename based on additional key-value pairs
    link.download = `test_results.txt`;

    // Trigger a click on the link to initiate the download


    link.click();

    closeResults();
    closeResults();
    // download.click();
}

window.onload = event => {
    document.getElementsByClassName('send-button').disabled = true;
    currentChannel = '';
    currentBotId = '';
    initializeThreads();
    getChannels();


}