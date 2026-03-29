import { CONFIG } from './config.js';

async function agentPost(path, body) {
    const res = await fetch(`${CONFIG.AGENT_BASE_URL}${path}`, {
        method:  'POST',
        headers: body ? { 'Content-Type': 'application/json; charset=utf-8' } : {},
        body:    body ? JSON.stringify(body) : undefined,
        signal:  AbortSignal.timeout(CONFIG.REQUEST_TIMEOUT_MS),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? `Agent ${path} → ${res.status}`);
    return data;
}

export async function fetchButtStatus() {
    const res = await fetch(`${CONFIG.AGENT_BASE_URL}/butt/status`, {
        signal: AbortSignal.timeout(CONFIG.REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`Agent /butt/status → ${res.status}`);
    return res.json(); // { running, isStreaming, isMuted }
}

export const startStream  = ()              => agentPost('/butt/start');
export const stopStream   = ()              => agentPost('/butt/stop');
export const toggleMute   = ()              => agentPost('/butt/mute');
export const sendMetadata = (title, artist) => agentPost('/butt/metadata', { title, artist });