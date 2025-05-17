
import { v4 as uuidv4 } from 'uuid';
import * as SocketClient from '../src/index.js';


// var videotrack = null;

function regiterEvents() {

    var userId = uuidv4();
    console.log("userId", userId);

    const startBtn = document.getElementById('startBtn');
    const leaveBtn = document.getElementById('leaveBtn');

    SocketClient.setUrl("https://node-videocall-server.onrender.com");



    startBtn.addEventListener('click', () => {
        console.log("start call");

        var channelNameInput = document.getElementById('channelName');
        var channelName = channelNameInput.value;
        console.log(channelName);

        initDevices(userId, channelName);
    });

    leaveBtn.addEventListener('click', () => {
        leaveChannel();

    });

    const toggleCameraBtn = document.getElementById('toggleCameraBtn');

    toggleCameraBtn.addEventListener('click', () => {
        const isOn = SocketClient.isCameraOn();
        SocketClient.toggleCamera(!isOn);

        toggleCameraBtn.textContent = isOn ? 'turn on camera' : 'turn off camera';
    });

    const toggleMicBtn = document.getElementById('toggleMicBtn');

    toggleMicBtn.addEventListener('click', () => {
        const isOn = SocketClient.isAudioOn();
        SocketClient.toggleAudio(!isOn);

        toggleMicBtn.textContent = isOn ? 'turn on mic' : 'turn off mic';
    });
}


async function initDevices(userId, channelName) {

    SocketClient.on("user-published", handleUserPublished);
    SocketClient.on("user-unpublished", handleUserUnpublished);

    await SocketClient.createMediaStream();
    SocketClient.playVideoTrack('localVideo');

    SocketClient.joinChannel(userId, channelName);

}


function leaveChannel() {
    SocketClient.off("user-published", handleUserPublished);
    SocketClient.off("user-unpublished", handleUserUnpublished);
    SocketClient.leaveChannel();
}

function handleUserPublished(data) {
    const { user, mediaType } = data;
    if (mediaType === 'video') {
        const video = document.createElement('video');
        video.srcObject = user.videotrack;
        video.autoplay = true;
        video.id = `${user.uuid}`;
        video.style.width = '200px';
        video.style.height = '200px';
        var container = document.getElementById('video-container');
        if (container) {
            container.appendChild(video);
        }
    }
    console.log("handleUserPublished", data);

}

function handleUserUnpublished(data) {
    const { user, mediaType } = data;
    if (mediaType === 'video') {
        const video = document.getElementById(`${user.uuid}`);
        if (video) {
            video.remove();
        }
    }
    console.log("handleUserUnpublished", data);

}

regiterEvents();