import { STATE } from './state.js';
import { CONFIG } from './config.js';
import { evaluateBroadcastState, queryRtmpState, resetBroadcastState } from './broadcast.js';
import { updateStatusText } from './ui.js';

export function handleEvent({ eventType, eventData = {} }) {
    switch (eventType) {
        case 'RecordStateChanged':
            onRecordStateChanged(eventData);
            break;
        case 'StreamStateChanged':
            if (CONFIG.USE_NATIVE_STREAMING) onStreamStateChanged(eventData);
            break;
        case 'VendorEvent':
            if (eventData.vendorName === CONFIG.VENDOR_NAME) onVendorEvent();
            break;
        case 'ExitStarted':
            resetBroadcastState();
            updateStatusText('OBS se está cerrando...');
            break;
    }
}

function onRecordStateChanged({ outputState }) {
    if (outputState === 'OBS_WEBSOCKET_OUTPUT_STARTED') {
        STATE.isRecording = true;
        evaluateBroadcastState();
    } else if (outputState === 'OBS_WEBSOCKET_OUTPUT_STOPPED') {
        STATE.isRecording = false;
        evaluateBroadcastState();
    }
}

function onStreamStateChanged({ outputState }) {
    if (outputState === 'OBS_WEBSOCKET_OUTPUT_STARTED') {
        STATE.isStreaming = true;
        evaluateBroadcastState();
    } else if (outputState === 'OBS_WEBSOCKET_OUTPUT_STOPPED') {
        STATE.isStreaming = false;
        evaluateBroadcastState();
    }
}

async function onVendorEvent() {
    await queryRtmpState();
    evaluateBroadcastState();
}
