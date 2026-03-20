import { CONFIG } from './config.js';

/** Returns butt's current status: { connected, muted, ... } */
export async function fetchButtStatus() {
    const res = await timedFetch(`${CONFIG.BUTT_BASE_URL}/`);
    if (!res.ok) throw new Error(`butt status ${res.status}`);
    return res.json();
}

export async function startStream() {
    await buttPut('/stream', { action: 'start' });
}

export async function stopStream() {
    await buttPut('/stream', { action: 'stop' });
}

/** Sends mute or unmute command to butt. */
export async function setMute(muted) {
    await buttPut('/mute', { action: muted ? 'mute' : 'unmute' });
}

/** Sends ICY metadata to the active stream. */
export async function sendMetadata(title, artist) {
    await buttPut('/song', { title, artist });
}

async function buttPut(path, body) {
    const res = await timedFetch(`${CONFIG.BUTT_BASE_URL}${path}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`butt ${path} → ${res.status}`);
}

function timedFetch(url, options = {}) {
    return fetch(url, { ...options, signal: AbortSignal.timeout(CONFIG.REQUEST_TIMEOUT_MS) });
}