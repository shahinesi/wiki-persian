import { io } from 'socket.io-client';
import { makeSocketUrl } from './lib/socketUrl.js';

let socket = null;
export function initSocket() {
	const host = window.location.hostname;
	const siteName = window.site_name;
	const socketIoPort = window.frappe?.boot?.socketio_port ?? window.socketio_port ?? '9000';
	const url = makeSocketUrl({
		hostname: host,
		locationPort: window.location.port,
		siteName,
		socketIoPort,
	});

	socket = io(url, {
		withCredentials: true,
		reconnectionAttempts: 5,
	});
	return socket;
}

export function useSocket() {
	return socket;
}
