import { io } from 'socket.io-client';
import SimplePeer from 'simple-peer';

var peers = {};
var socket = null;
var mediastream = null;
var localVideoId = "";
var userId = "";
var url = 'http://localhost:3000';
let events = {};

/**
 * Registers a custom event listener.
 * @param {string} _event - Event name.
 * @param {(data: any) => void} listener - Callback to execute when event occurs.
 */
export var on = (_event, listener) => {
    if (!events[_event]) {
        events[_event] = [];
    }
    events[_event].push(listener);
};

/**
 * Removes a listener for a specific custom event.
 * @param {string} _event - Event name.
 * @param {(data: any) => void} listener - Callback to remove.
 */
export var off = (_event, listener) => {
    if (events[_event]) {
        events[_event] = events[_event].filter((existingListener) => existingListener !== listener);
    }
};

let emit = (_event, data) => {
    if (events[_event]) {
        events[_event].forEach((listener) => listener(data));
    }
};

/**
 * Sets the signaling server URL.
 * @param {string} _url - Server URL (e.g. "http://localhost:3000").
 */
export function setServerURL(_url) {
    url = _url;
}

/**
 * Requests access to the user's camera and microphone.
 * @returns {Promise<MediaStream>} - Resolves with a MediaStream containing audio and video.
 */
export function createMediaStream() {
    return navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
        mediastream = stream;
        return stream;
    });
}

/**
 * Plays the local video stream into a specified <video> element.
 * @param {string} _localVideoId - The ID of the <video> element in the DOM.
 */
export function playVideoTrack(_localVideoId) {
    localVideoId = _localVideoId;
    const localVideo = document.getElementById(localVideoId);
    if (localVideo && mediastream) {
        localVideo.srcObject = mediastream;
    }
}

/**
 * Connects to the signaling server and joins a room.
 * @param {string} _userId - Unique identifier for the user.
 * @param {string} channelName - The name of the room to join.
 */
export function joinChannel(_userId, channelName) {
    userId = _userId;

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
        const peer = createPeer(socket, mediastream, newSocketId, newUserId, false);
        peers[newUserId] = peer;
    });

    socket.on('signal', ({ fromUserId, signal }) => {
        const peer = peers[fromUserId];
        if (peer) {
            peer.signal(signal);
        }
    });

    socket.on('user-left', ({ userId: leftUserId }) => {
        if (peers[leftUserId]) {
            peers[leftUserId].destroy();
            delete peers[leftUserId];
        }

        emit("user-unpublished", {
            user: { uuid: leftUserId },
            mediaType: "video"
        });
    });

    socket.on('user-media-toggled', ({ userId, type, enabled }) => {
        emit('user-media-toggled', {
            user: { uuid: userId },
            type,
            enabled
        });
    });
}

/**
 * Leaves the current room and disconnects all peers.
 * Also releases camera/mic resources and clears video streams.
 */
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
    if (localVideo) {
        localVideo.srcObject = null;
    }
}

/**
 * Creates a WebRTC peer connection with another user.
 * @param {import('socket.io-client').Socket} socket - The local user's socket.
 * @param {MediaStream} localStream - The local media stream.
 * @param {string} targetSocketId - The socket ID of the remote user.
 * @param {string} remoteUserId - The ID of the remote user.
 * @param {boolean} initiator - Whether this peer initiates the connection.
 * @returns {SimplePeer.Instance} - The created peer.
 */
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
        emit("user-published", {
            user: {
                uuid: remoteUserId,
                videotrack: stream
            },
            mediaType: "video"
        });
    });

    peer.on('error', err => {
        console.error('Peer error', remoteUserId, err);
    });

    return peer;
}

/**
 * Enables or disables the local video track and notifies the server.
 * @param {boolean} on - `true` to turn on the camera, `false` to turn it off.
 */
export function toggleCamera(on) {
    if (!mediastream) return;
    mediastream.getVideoTracks().forEach(track => {
        track.enabled = on;
    });
    if (socket) {
        socket.emit('media-toggle', { userId, type: 'video', enabled: on });
    }
}

/**
 * Checks if the local video track is currently enabled.
 * @returns {boolean} - `true` if the camera is on.
 */
export function isCameraOn() {
    if (!mediastream) return false;
    return mediastream.getVideoTracks().some(track => track.enabled);
}

/**
 * Enables or disables the local audio track and notifies the server.
 * @param {boolean} on - `true` to unmute the mic, `false` to mute.
 */
export function toggleAudio(on) {
    if (!mediastream) return;
    mediastream.getAudioTracks().forEach(track => {
        track.enabled = on;
    });
    if (socket) {
        socket.emit('media-toggle', { userId, type: 'audio', enabled: on });
    }
}

/**
 * Checks if the local audio track is currently enabled.
 * @returns {boolean} - `true` if the microphone is on.
 */
export function isAudioOn() {
    if (!mediastream) return false;
    return mediastream.getAudioTracks().some(track => track.enabled);
}
