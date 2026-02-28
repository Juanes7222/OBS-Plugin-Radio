import { STATE } from './state.js';
import { CONFIG } from './config.js';
import { sendRequest, sendBatchRequest, sendVendorRequest } from './request.js';
import { updateButtonUI, updateStatusText } from './ui.js';
import { startTimer, stopTimer } from './timer.js';

export async function startBroadcast() {
    updateStatusText('Iniciando grabación y emisión...');

    if (CONFIG.USE_NATIVE_STREAMING) {
        await sendBatchRequest([
            { requestType: 'StartRecord' },
            { requestType: 'StartStream' },
        ]);
        return;
    }

    const rtmpPromise = CONFIG.RTMP_TARGET_NAME
        ? sendVendorRequest('StartTarget', { name: CONFIG.RTMP_TARGET_NAME })
        : sendVendorRequest('StartAll');

    const [recordResult, rtmpResult] = await Promise.allSettled([
        sendRequest('StartRecord'),
        rtmpPromise,
    ]);

    const recordOk = recordResult.status === 'fulfilled';
    const rtmpOk   = rtmpResult.status === 'fulfilled';

    if (!recordOk && !rtmpOk) throw new Error('No se pudo iniciar grabación ni emisión');
    if (!recordOk) updateStatusText('Emisión activa, pero grabación falló', 'error');
    if (!rtmpOk)   updateStatusText('Grabación activa, pero emisión falló', 'error');

    STATE.isRecording = recordOk || STATE.isRecording;
    STATE.isRtmpActive = rtmpOk || STATE.isRtmpActive;
    evaluateBroadcastState();
}

export async function stopBroadcast() {
    updateStatusText('Deteniendo emisión y grabación...');

    if (CONFIG.USE_NATIVE_STREAMING) {
        await sendBatchRequest([
            { requestType: 'StopRecord' },
            { requestType: 'StopStream' },
        ]);
        return;
    }

    const rtmpPromise = CONFIG.RTMP_TARGET_NAME
        ? sendVendorRequest('StopTarget', { name: CONFIG.RTMP_TARGET_NAME })
        : sendVendorRequest('StopAll');

    const [recordResult, rtmpResult] = await Promise.allSettled([
        sendRequest('StopRecord'),
        rtmpPromise,
    ]);

    const recordOk = recordResult.status === 'fulfilled';
    const rtmpOk   = rtmpResult.status === 'fulfilled';

    if (!recordOk) updateStatusText('Emisión detenida, pero grabación sigue...', 'error');
    if (!rtmpOk)   updateStatusText('Grabación detenida, pero emisión sigue...', 'error');

    if (recordOk) STATE.isRecording  = false;
    if (rtmpOk)   STATE.isRtmpActive = false;
    evaluateBroadcastState();
}

export function evaluateBroadcastState() {
    const emissionActive = CONFIG.USE_NATIVE_STREAMING ? STATE.isStreaming : STATE.isRtmpActive;
    const wasBroadcasting = STATE.isBroadcasting;
    const anyActive  = STATE.isRecording || emissionActive;
    const bothActive = STATE.isRecording && emissionActive;

    STATE.isBroadcasting = anyActive;

    if (bothActive) {
        updateButtonUI('active');
        updateStatusText('AL AIRE — Grabando + Emitiendo', 'success');
    } else if (STATE.isRecording && !emissionActive) {
        updateButtonUI('active');
        updateStatusText('Solo grabando — Emisión inactiva', 'error');
    } else if (!STATE.isRecording && emissionActive) {
        updateButtonUI('active');
        updateStatusText('Solo emitiendo — Grabación inactiva', 'error');
    } else {
        updateButtonUI('idle');
        if (STATE.wsIdentified) updateStatusText('Listo para transmitir');
    }

    if (anyActive && !wasBroadcasting) startTimer();
    else if (!anyActive && wasBroadcasting) stopTimer();
}

export function resetBroadcastState() {
    STATE.isRecording  = false;
    STATE.isStreaming   = false;
    STATE.isRtmpActive = false;
    STATE.isBroadcasting = false;
    STATE.isProcessing   = false;
    stopTimer();
    updateButtonUI('disabled');
}

export async function queryInitialState() {
    try {
        const recordStatus = await sendRequest('GetRecordStatus');
        STATE.isRecording = recordStatus.outputActive ?? false;

        if (CONFIG.USE_NATIVE_STREAMING) {
            const streamStatus = await sendRequest('GetStreamStatus');
            STATE.isStreaming = streamStatus.outputActive ?? false;
        } else {
            await queryRtmpState();
        }

        evaluateBroadcastState();
    } catch {
        CONFIG.USE_NATIVE_STREAMING
            ? onFallbackFailed()
            : await tryFallbackToNativeStreaming();
    }
}

export async function queryRtmpState() {
    try {
        if (CONFIG.RTMP_TARGET_NAME) {
            const result = await sendVendorRequest('GetTargetState', { name: CONFIG.RTMP_TARGET_NAME });
            STATE.isRtmpActive = result.responseData?.state === 'running';
        } else {
            const result  = await sendVendorRequest('ListTargets');
            const targets = result.responseData?.targets ?? [];
            STATE.isRtmpActive = targets.some(t => t.state === 'running');
        }
    } catch {
        STATE.isRtmpActive = false;
    }
}

async function tryFallbackToNativeStreaming() {
    try {
        const streamStatus = await sendRequest('GetStreamStatus');
        STATE.isStreaming = streamStatus.outputActive ?? false;
        CONFIG.USE_NATIVE_STREAMING = true;
        evaluateBroadcastState();
        updateStatusText('Modo: Streaming nativo (Multi-RTMP no detectado)');
    } catch {
        onFallbackFailed();
    }
}

function onFallbackFailed() {
    updateStatusText('Conectado — Listo', 'success');
    evaluateBroadcastState();
}
