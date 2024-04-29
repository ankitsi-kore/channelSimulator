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
        "channel": "test channel",
        "botId": "st-123",
        "type": "file"
    }));
});

//Listen for messages
socket.addEventListener('message', (event) => {
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
                threadState.messages.push({ type: 'message received', content: JSON.stringify(receivedResponse.message), timestamp: getCurrentTimestamp() });
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
            console.log('Received message from server:', receivedResponse);
            const regex = /&quot;([^"]*)&quot;/g;
            if (regex.test(receivedResponse.message.val)) {
                console.log('It was decoded');
                const encodedString = receivedResponse.message.val;
                const decodedString = encodedString.replace(/&quot;/g, '\"');
                receivedResponse.message.val = decodedString;
            }
            let receivedMessage = receivedResponse.message;
            if (receivedMessage !== '' && receivedResponse.message.type === 'text') {
                console.log('Its not a template');
                const threadState = getThreadState(receivedResponse.channel, receivedResponse.botId);
                threadState.messages.push({ type: 'message received', content: receivedMessage.val, timestamp: getCurrentTimestamp() });
                saveThread(receivedResponse.channel, receivedResponse.botId, threadState);
                initializeCurrentThread(currentChannel, currentBotId);
            }
            else if (receivedMessage.val !== '' && receivedMessage.type === 'template') {
                const threadState = getThreadState(receivedResponse.channel, receivedResponse.botId);
                console.log('It came here');
                threadState.messages.push({ type: 'message received', content: JSON.stringify(receivedMessage), timestamp: getCurrentTimestamp() });
                saveThread(receivedResponse.channel, receivedResponse.botId, threadState);
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

    var existingChannels = JSON.parse(localStorage.getItem('channels'));
    var isObjectAlreadyExists = checkIfObjectExists(existingChannels, obj);
    if (!isObjectAlreadyExists) {
        createNewChannel();
    } else {
        alert("channel already exists!!!");
        params = "";
        closePopupChannel();
    }
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
    var urlPost = "http://localhost:5005/api/v1/channels";
    xhrPost.open("POST", urlPost, true);
    xhrPost.setRequestHeader("Content-type", "application/json");
    xhrPost.onreadystatechange = function () {
        if (xhrPost.readyState == 4) {
            if (xhrPost.status == 201) {
                console.log(xhrPost.responseText);
                let updatedChannels = JSON.parse(xhrPost.responseText);
                localStorage.setItem('channels', updatedChannels.data);
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

function setChannels() {
    let responseData = JSON.parse(localStorage.getItem('channels'));
    let channelOptionsThreads = document.getElementById("channel-option");
    channelOptionsThreads.innerHTML = '';
    let channelOptionsTestcase = document.getElementById("channel-testcase");
    channelOptionsTestcase.innerHTML = '';

    for (let currChannel = 0; currChannel < responseData.length; currChannel++) {
        let channel = responseData[currChannel].channel_name;
        channel = channel.toLowerCase();
        let option = document.createElement("option");
        let optionTestcase = document.createElement("option");
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
    if (!localStorage.getItem('channels')) {
        let xhr = new XMLHttpRequest();
        let url = "http://localhost:5005/api/v1/channels";
        xhr.open("GET", url, true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    var responseData = JSON.parse(xhr.responseText);
                    console.log('channelsData:', responseData);
                    localStorage.setItem('channels', responseData.data);
                    // setChannels(JSON.parse(responseData?.data));
                    setChannels();
                    // console.log(responseData);
                    // console.log(responseData.length);
                } else {
                    console.error("Error occurred");
                }
            }
        };
        xhr.send();
    }
    else {
        setChannels();
    }
}

function initializeThreads() {
    console.log(`for thread ${currentChannel}-${currentBotId}`);
    if (localStorage.getItem('threads')) {
        getThreads();
    }
    else {
        localStorage.setItem('threads', JSON.stringify([]));
        getThreads();
    }
}


function getThreads() {
    let threads = JSON.parse(localStorage.getItem('threads'));
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
            <div class='chat-icon'><img src='../chat-text.svg' style='width: 24px;'></div>
            <span class="thread-name">${currentThread.identity}-${currentThread.channel}</span><br>
          `;
        threadList.appendChild(threadItem);
    }
}

function submitForm() {
    let botId = document.getElementById('bot_id').value;
    let environment = document.getElementById('environment-option').value;
    let channel = document.getElementById('channel-option').value;
    let identity = document.getElementById('identity').value;

    let threadDetails = {
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
            console.log(threadDetails);
            let threads = JSON.parse(localStorage.getItem('threads'));

            threads.push(threadDetails);
            console.log('Threads in local storage');
            console.log(threads);
            localStorage.setItem('threads', JSON.stringify(threads));
            localStorage.setItem(`${botId}-${channel}`, JSON.stringify({ messages: [] }));

            document.getElementsByClassName('send-button').disabled = true;
            updateCurrentThreadDetails(channel, botId);
            alert('Successfully added the thread');

            let threadList = document.getElementById('thread-list');

            let threadItem = document.createElement('div');
            threadItem.className = 'thread-list-item';
            threadItem.id = `${botId}-${channel}`;
            threadItem.onclick = () => initializeCurrentThread(channel, botId);

            threadItem.innerHTML = `
            <div class='chat-icon'><img src='../chat-text.svg' style='width: 24px;'></div>
            <span class="thread-name">${identity}-${channel}</span><br>
            `;
            threadList.insertBefore(threadItem, threadList.firstChild);
            clearThreadForm();
            closePopupThread();
            // window.location.reload();
        }
        else {
            alert('Fill All the Details !!!');
        }
    }
}

function clearThreadForm() {
    document.getElementById('bot_id').value = '';
    document.getElementById('identity').value = '';
}

function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value;
    if(!message){
        alert('Please Enter a Message!');
        return;
    }
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
    let chatMessages = document.getElementById('chat-messages');

    if (messageText !== '') {
        let messageDiv = document.createElement('div');
        messageDiv.setAttribute('id', 'msg');
        messageDiv.classList.add('message', 'sent');

        let timestamp = document.createElement('div');
        timestamp.classList.add('timestamp');
        timestamp.innerText = time;

        let messageContent = document.createElement('span');
        messageContent.innerText = messageText;
        messageContent.appendChild(timestamp);

        messageDiv.appendChild(messageContent);
        chatMessages.appendChild(messageDiv);

        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    //sendMessage();
}

function displayReceivedMessage(messageText, time) {
    let chatMessages = document.getElementById('chat-messages');

    let messageDiv = document.createElement('div');
    messageDiv.setAttribute('id', 'msg');
    messageDiv.classList.add('message', 'received');

    let timestamp = document.createElement('div');
    timestamp.classList.add('timestamp');
    timestamp.innerText = time;

    let messageContent = document.createElement('span');
    messageContent.innerText = messageText;
    messageContent.appendChild(timestamp);
    messageDiv.appendChild(messageContent);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
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
    }
});

function initializeCurrentThread(channel, BotId) {
    console.log('Thread was clicked')
    let chatMessages = document.getElementById('chat-messages');
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

function submitTestCases() {
    let testcases = document.getElementById('testcases');
    // let botId = document.getElementById('bot_id-testcase').value;
    let environment = document.getElementById('environment-testcase');
    let channel = document.getElementById('channel-testcase');
    let identity = document.getElementById('identity-testcase');
    let formData = new FormData();
    // formData.append('botId', botId);
    formData.append('testcases', testcases.files[0]);
    formData.append('environment', environment.value);
    formData.append('channel', channel.value);
    formData.append('identity', identity.value);

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
                    testcases.value = '';
                    identity.value = '';
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
    link.download = `test_results.txt`;
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