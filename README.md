# 📞 videocall-client-socket

A simple WebRTC client library for peer-to-peer video calls using [simple-peer](https://www.npmjs.com/package/simple-peer) and [socket.io-client](https://www.npmjs.com/package/socket.io-client).

> ✅ Designed to work with [videocall-server](https://github.com/EmersonJaraG28/videocall-server)

---

## 📦 Installation

```bash
npm install videocall-client-socket
```

---

## 🚀 Quick Start

```js
import * as VideoClient from "videocall-client-socket";
import { v4 as uuidv4 } from "uuid";

const userId = uuidv4();
const roomName = "roomABC";

// Step 1: Subscribe to events before anything else
VideoClient.on("user-published", handleUserPublished);
VideoClient.on("user-unpublished", handleUserUnpublished);
VideoClient.on("user-media-toggled", (data) => {
  console.log(data.user.uuid, data.type, data.enabled);
});

// Step 2: Create media stream
await VideoClient.createMediaStream();

// Step 3: Play local stream in <video> tag
VideoClient.playVideoTrack("localVideo");

// Step 4: Join the signaling channel
VideoClient.setServerURL("http://localhost:3000");
VideoClient.joinChannel(userId, roomName);
```

---

## 📋 Execution Order

> To use this library correctly, follow this sequence of steps:

| Step | Function                         | Why?                                                           |
| ---- | -------------------------------- | -------------------------------------------------------------- |
| 1️⃣   | `on(...)`                        | You must subscribe to events **before** joining the channel.   |
| 2️⃣   | `createMediaStream()`            | This requests access to camera and microphone.                 |
| 3️⃣   | `playVideoTrack(videoElementId)` | This shows your local stream in a `<video>` tag.               |
| 4️⃣   | `joinChannel(userId, room)`      | Finally, join the signaling server and start peer connections. |

> 🧠 Skipping or reordering these steps may cause video/audio to not work properly or event listeners to be missed.

---

## 📘 API Reference

### 🔌 Connection

- `setServerURL(url: string): void`
- `joinChannel(userId: string, room: string): void`
- `leaveChannel(): void`

### 🎥 Media Controls

- `createMediaStream(): Promise<MediaStream>`
- `playVideoTrack(localVideoId: string): void`
- `toggleCamera(on: boolean): void`
- `isCameraOn(): boolean`
- `toggleAudio(on: boolean): void`
- `isAudioOn(): boolean`

### 📡 Events System

Use `on(event, callback)` and `off(event, callback)`.

- `user-published`: `{ user: { uuid, videotrack }, mediaType }`
- `user-unpublished`: `{ user: { uuid }, mediaType }`
- `user-media-toggled`: `{ user: { uuid }, type, enabled }`

#### Example:

```js
VideoClient.on("user-published", ({ user }) => {
  const video = document.createElement("video");
  video.srcObject = user.videotrack;
  video.autoplay = true;
  video.id = user.uuid;
  document.body.appendChild(video);
});
```

---

## 🧩 Backend Integration

This library is designed to work with the following signaling server:

🔗 [`videocall-server`](https://github.com/EmersonJaraG28/videocall-server)

```bash
git clone https://github.com/EmersonJaraG28/videocall-server.git
cd videocall-server
npm install
npm run dev
```

---

## 📚 Related Libraries

- [simple-peer](https://www.npmjs.com/package/simple-peer)
- [socket.io-client](https://www.npmjs.com/package/socket.io-client)

---

## 🧾 License

ISC © [Jara](https://github.com/EmersonJaraG28)
