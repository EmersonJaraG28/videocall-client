declare module 'videocall-client-socket' {

    export function setUrl(url: string): void;

    export function on(event: string, callback: (data: any) => void): void;
    export function off(event: string, callback: (data: any) => void): void;

    export function isCameraOn(): boolean;
    export function toggleCamera(boolean: boolean): void;
    export function isAudioOn(): boolean;
    export function toggleAudio(boolean: boolean): void;

    export function createMediaStream(): Promise<MediaStream>;

    export function playVideoTrack(localVideoId: string): void;

    export function joinChannel(userId: string, channelName: string): void;
    export function leaveChannel(): void;
}