
import { io } from 'socket.io-client';

var peers = {};

var socket = null;
var mediastream = null;
var localVideoId = "";

var url = 'http://localhost:3000';

let events = {};

export var on = (_event, listener) => {
    if (!events[_event]) {
        events[_event] = [];
    }
    events[_event].push(listener);
}

export var off = (_event, listener) => {
    if (events[_event]) {
        events[_event] = events[_event].filter((existingListener) => {
            return existingListener !== listener;
        });
    }
}

let emit = (_event, data) => {
    if (events[_event]) {
        events[_event].forEach((listener) => {
            listener(data);
        });
    }
}

export function setUrl(_url) {
    url = _url;
}

export function createMediaStream() {
    return new Promise((resolve, reject) => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
            mediastream = stream;
            resolve(stream);
        });
    });
}

export function playVideoTrack(_localVideoId) {
    localVideoId = _localVideoId;
    const localVideo = document.getElementById(localVideoId);
    if (localVideo && mediastream) {
        localVideo.srcObject = mediastream;
    }

}

export function joinChannel(userId, channelName) {

    socket = io(url, {
        query: { room: channelName, userId }
    });

    socket.on('all-users', users => {
        users.forEach(({ userId: remoteUserId, socketId }) => {
            const peer = createPeer(socket, mediastream, socketId, remoteUserId, true);
            peers[remoteUserId] = peer;
        });
    });

    socket.on('user-joined', ({ userId: newUserId, socketId: newSocketId }) => {
        console.log("newUserId", newUserId);

        const peer = createPeer(socket, mediastream, newSocketId, newUserId, false);
        peers[newUserId] = peer;
    });

    socket.on('signal', ({ fromUserId, signal }) => {
        console.log("signal", signal);

        const peer = peers[fromUserId];
        if (peer) {
            peer.signal(signal);
        }
    });

    socket.on('user-left', ({ userId: leftUserId }) => {
        if (peers[leftUserId]) {
            peers[leftUserId].destroy();
            delete peers[leftUserId];
            console.log(`Usuario ${leftUserId} se fue`);
        }

        var data = {
            user: {
                uuid: leftUserId,
                // videotrack: stream
            },
            mediaType: "video"
        };
        emit("user-unpublished", data);
    });
}

export function leaveChannel() {
    for (const peerId in peers) {
        peers[peerId].destroy();
        delete peers[peerId];

        const video = document.getElementById(`${peerId}`);
        if (video) video.remove();
    }

    if (socket) {
        socket.disconnect();
        socket = null;
    }

    if (mediastream) {
        mediastream.getTracks().forEach(track => track.stop());
        mediastream = null;
    }

    const localVideo = document.getElementById(localVideoId);
    localVideo.srcObject = null;
}


function createPeer(socket, localStream, targetSocketId, remoteUserId, initiator) {
    const peer = new SimplePeer({
        initiator,
        trickle: false,
        stream: localStream
    });

    peer.on('signal', signal => {
        socket.emit('signal', {
            targetId: targetSocketId,
            signal
        });
    });

    peer.on('stream', stream => {
        console.log('📺 Recibí stream de', remoteUserId);

        var data = {
            user: {
                uuid: remoteUserId,
                videotrack: stream
            },
            mediaType: "video"
        };
        emit("user-published", data);
    });

    peer.on('error', err => {
        console.error('Error en peer', remoteUserId, err);
    });

    return peer;
}


export function toggleCamera(on) {
    if (!mediastream) return;
    mediastream.getVideoTracks().forEach(track => {
        track.enabled = on;
    });
}

export function isCameraOn() {
    if (!mediastream) return false;
    return mediastream.getVideoTracks().some(track => track.enabled);
}

export function toggleAudio(on) {
    if (!mediastream) return;
    mediastream.getAudioTracks().forEach(track => {
        track.enabled = on;
    });
}

export function isAudioOn() {
    if (!mediastream) return false;
    return mediastream.getAudioTracks().some(track => track.enabled);
}