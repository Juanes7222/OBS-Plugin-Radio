import { CONFIG } from './config.js';

export class ApiError extends Error {
    constructor(message, { status = 0, cause = null } = {}) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.cause = cause;
    }
}

/** AbortSignal.timeout needs Chromium 103+, which not every OBS build ships. */
function timeoutSignal(ms) {
    if (typeof AbortSignal.timeout === 'function') return AbortSignal.timeout(ms);

    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
}

async function request(path, { method = 'GET', body = null, timeoutMs = CONFIG.STATUS_TIMEOUT_MS } = {}) {
    let response;
    try {
        response = await fetch(`${CONFIG.AGENT_BASE_URL}${path}`, {
            method,
            headers: body ? { 'Content-Type': 'application/json' } : undefined,
            body: body ? JSON.stringify(body) : undefined,
            signal: timeoutSignal(timeoutMs),
        });
    } catch (error) {
        const timedOut = error?.name === 'AbortError' || error?.name === 'TimeoutError';
        throw new ApiError(
            timedOut ? 'el agente no respondió a tiempo' : 'no se pudo conectar con el agente',
            { cause: error },
        );
    }

    const data = await response.json().catch(() => null);
    if (!response.ok) {
        throw new ApiError(data?.error ?? `el agente respondió ${response.status}`, { status: response.status });
    }
    return data ?? {};
}

const action = (path, body = null) =>
    request(path, { method: 'POST', body, timeoutMs: CONFIG.ACTION_TIMEOUT_MS });

/** { engine, state, active, live, detail, configured } */
export const fetchStatus = () =>
    request('/stream/status', { timeoutMs: CONFIG.STATUS_TIMEOUT_MS });

export const startStream = () => action('/stream/start');
export const stopStream = () => action('/stream/stop');

export const fetchSettings = () =>
    request('/stream/settings', { timeoutMs: CONFIG.ACTION_TIMEOUT_MS });

export const saveSettings = settings =>
    request('/stream/settings', {
        method: 'PUT',
        body: settings,
        timeoutMs: CONFIG.ACTION_TIMEOUT_MS,
    });

/** { engine, ffmpegPath, buttExePath, source, backend, file } */
export const fetchAgentConfig = () =>
    request('/config', { timeoutMs: CONFIG.ACTION_TIMEOUT_MS });

export const saveAgentConfig = config =>
    request('/config', {
        method: 'PUT',
        body: config,
        timeoutMs: CONFIG.ACTION_TIMEOUT_MS,
    });

export const fetchDevices = (refresh = false) =>
    request(`/stream/devices${refresh ? '?refresh=1' : ''}`, { timeoutMs: CONFIG.ACTION_TIMEOUT_MS });

export const sendMetadata = (title, artist) =>
    action('/butt/metadata', { title, artist });

/** The agent forwards this to the backend, so the panel never sees the secret. */
export const notifyFacebookLive = (status, permalinkUrl) =>
    action('/facebook/notify', { status, permalink_url: permalinkUrl });
