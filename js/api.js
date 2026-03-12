import { CONFIG } from './config.js';

async function backendRequest(path, method = 'GET') {
    const res = await fetch(`${CONFIG.BACKEND_URL}${path}`, {
        method,
        headers: { 'x-panel-secret': CONFIG.PANEL_SECRET },
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
    }
    return res.json();
}

async function agentRequest(path, method = 'GET') {
    const res = await fetch(`${CONFIG.AGENT_URL}${path}`, {
        method,
        headers: { 'x-agent-secret': CONFIG.AGENT_SECRET },
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
    }
    return res.json();
}

export const fetchStatus    = ()  => backendRequest('/panel-api/status');
export const stopAutoDJ     = ()  => backendRequest('/panel-api/autodj/stop',  'POST');
export const startAutoDJ    = ()  => backendRequest('/panel-api/autodj/start', 'POST');

export const agentIsOnline  = ()  => agentRequest('/status');
export const startStream    = ()  => agentRequest('/stream/start', 'POST');
export const stopStream     = ()  => agentRequest('/stream/stop',  'POST');