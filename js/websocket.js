import { STATE } from './state.js';
import { CONFIG } from './config.js';
import { generateAuthString } from './crypto.js';
import { sendRaw, resolveRequest, resolveBatchRequest } from './request.js';
import { handleEvent } from './events.js';
import { resetBroadcastState, queryInitialState } from './broadcast.js';
import { updateConnectionUI, updateStatusText } from './ui.js';

export function connect() {
    if (STATE.ws) {
        STATE.ws.onclose = null;
        STATE.ws.close();
        STATE.ws = null;
    }

    updateConnectionUI('connecting');

    try {
        STATE.ws = new WebSocket(`ws://${CONFIG.WS_HOST}:${CONFIG.WS_PORT}`);
    } catch {
        updateConnectionUI('disconnected');
        scheduleReconnect();
        return;
    }

    STATE.ws.onmessage = ({ data }) => dispatchMessage(data);
    STATE.ws.onerror   = (e) => console.error('[WS] Error:', e);
    STATE.ws.onclose   = ({ code }) => onConnectionClosed(code);
}

function onConnectionClosed(code) {
    STATE.wsConnected  = false;
    STATE.wsIdentified = false;

    STATE.pendingRequests.forEach(pending => {
        clearTimeout(pending.timeout);
        pending.reject(new Error('WebSocket closed'));
    });
    STATE.pendingRequests.clear();

    updateConnectionUI('disconnected');
    resetBroadcastState();

    // 4011 = kicked by OBS (auth failure or server shutdown), do not retry
    if (code !== 4011) scheduleReconnect();
}

function scheduleReconnect() {
    if (STATE.reconnectTimer) return;

    const maxAttempts = CONFIG.MAX_RECONNECT_ATTEMPTS;
    if (maxAttempts > 0 && STATE.reconnectAttempts >= maxAttempts) {
        updateStatusText('Reconexión fallida. Recarga el panel.', 'error');
        return;
    }

    STATE.reconnectAttempts++;
    const delaySecs = CONFIG.RECONNECT_INTERVAL_MS / 1000;
    updateStatusText(`Reconectando en ${delaySecs}s... (intento ${STATE.reconnectAttempts})`);

    STATE.reconnectTimer = setTimeout(() => {
        STATE.reconnectTimer = null;
        connect();
    }, CONFIG.RECONNECT_INTERVAL_MS);
}

function dispatchMessage(rawData) {
    let msg;
    try { msg = JSON.parse(rawData); } catch { return; }

    switch (msg.op) {
        case 0: onHello(msg.d);            break;
        case 2: onIdentified(msg.d);       break;
        case 5: handleEvent(msg.d);        break;
        case 7: resolveRequest(msg.d);     break;
        case 9: resolveBatchRequest(msg.d); break;
    }
}

async function onHello(data) {
    // eventSubscriptions: General(1) + Outputs(64) + Vendors(512) = 577
    const identifyPayload = { rpcVersion: 1, eventSubscriptions: 577 };

    if (data.authentication && !CONFIG.WS_PASSWORD) {
        updateStatusText('Se requiere contraseña de WebSocket', 'error');
        return;
    }

    if (data.authentication) {
        try {
            identifyPayload.authentication = await generateAuthString(
                CONFIG.WS_PASSWORD,
                data.authentication.salt,
                data.authentication.challenge
            );
        } catch {
            updateStatusText('Error de autenticación', 'error');
            return;
        }
    }

    sendRaw({ op: 1, d: identifyPayload });
}

function onIdentified() {
    STATE.wsConnected      = true;
    STATE.wsIdentified     = true;
    STATE.reconnectAttempts = 0;

    updateConnectionUI('connected');
    updateStatusText('Conectado — Consultando estado...');
    queryInitialState();
}
