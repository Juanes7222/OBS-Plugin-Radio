import { STATE } from './state.js';
import { CONFIG } from './config.js';

export function sendRaw(obj) {
    if (STATE.ws?.readyState === WebSocket.OPEN) {
        STATE.ws.send(JSON.stringify(obj));
    }
}

export function sendRequest(requestType, requestData) {
    return new Promise((resolve, reject) => {
        if (!STATE.wsIdentified) {
            reject(new Error('Not identified with OBS'));
            return;
        }

        const requestId = generateRequestId();
        const msg = { op: 6, d: { requestType, requestId } };
        if (requestData) msg.d.requestData = requestData;

        const timeout = setTimeout(() => {
            STATE.pendingRequests.delete(requestId);
            reject(new Error(`Timeout waiting for ${requestType}`));
        }, CONFIG.REQUEST_TIMEOUT_MS);

        STATE.pendingRequests.set(requestId, { resolve, reject, timeout });
        sendRaw(msg);
    });
}

export function sendBatchRequest(requests) {
    return new Promise((resolve, reject) => {
        if (!STATE.wsIdentified) {
            reject(new Error('Not identified with OBS'));
            return;
        }

        const batchId = generateRequestId();
        const formattedRequests = requests.map(({ requestType, requestData }) => {
            const r = { requestType };
            if (requestData) r.requestData = requestData;
            return r;
        });

        const msg = {
            op: 8,
            d: {
                requestId: batchId,
                haltOnFailure: false,
                executionType: 2, // Parallel — minimizes delay between commands
                requests: formattedRequests,
            },
        };

        const timeout = setTimeout(() => {
            STATE.pendingRequests.delete(batchId);
            reject(new Error('Timeout in batch request'));
        }, CONFIG.REQUEST_TIMEOUT_MS);

        STATE.pendingRequests.set(batchId, { resolve, reject, timeout });
        sendRaw(msg);
    });
}

export function sendVendorRequest(vendorRequestType, vendorRequestData) {
    const requestData = { vendorName: CONFIG.VENDOR_NAME, requestType: vendorRequestType };
    if (vendorRequestData) requestData.requestData = vendorRequestData;
    return sendRequest('CallVendorRequest', requestData);
}

export function resolveRequest(data) {
    const pending = STATE.pendingRequests.get(data.requestId);
    if (!pending) return;

    clearTimeout(pending.timeout);
    STATE.pendingRequests.delete(data.requestId);

    if (data.requestStatus?.result) {
        pending.resolve(data.responseData ?? {});
    } else {
        const code    = data.requestStatus?.code ?? '?';
        const comment = data.requestStatus?.comment ?? `Request failed (code ${code})`;
        pending.reject(new Error(comment));
    }
}

export function resolveBatchRequest(data) {
    const pending = STATE.pendingRequests.get(data.requestId);
    if (!pending) return;

    clearTimeout(pending.timeout);
    STATE.pendingRequests.delete(data.requestId);

    const results      = data.results ?? [];
    const allSucceeded = results.every(r => r.requestStatus?.result);

    allSucceeded
        ? pending.resolve(results)
        : pending.reject(new Error('One or more batch commands failed'));
}

function generateRequestId() {
    STATE.requestCounter++;
    return `req_${Date.now()}_${STATE.requestCounter}`;
}
