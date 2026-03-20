import { STATE, DOM } from './state.js';
import { CONFIG } from './config.js';
import { fetchButtStatus, startStream, stopStream, setMute, sendMetadata } from './butt.js';
import { launchButt } from './agent.js';
import { updateIndicator, updateMainButton, updateMuteButton, showMetaStatus, detectTheme } from './ui.js';
import { startTimer, stopTimer } from './timer.js';

async function onMainButtonClick() {
    if (STATE.isProcessing) return;

    STATE.isProcessing = true;
    updateMainButton();

    try {
        if (STATE.isStreaming) {
            await stopStream();
            STATE.isStreaming = false;
            stopTimer();
        } else {
            await ensureButtReachable();
            await startStream();
            STATE.isStreaming = true;
            startTimer();
        }
    } catch (error) {
        console.error('[App] Stream toggle error:', error);
        showMetaStatus(`Error: ${error.message}`, 'error');
        await syncState();
    } finally {
        STATE.isProcessing = false;
        updateMainButton();
        updateMuteButton();
    }
}

async function onMuteButtonClick() {
    if (!STATE.isStreaming || STATE.isProcessing) return;

    try {
        const next = !STATE.isMuted;
        await setMute(next);
        STATE.isMuted = next;
        updateMuteButton();
    } catch (error) {
        showMetaStatus(`Error al silenciar: ${error.message}`, 'error');
    }
}

async function onSendMetaClick() {
    const title  = DOM.titleInput.value.trim();
    const artist = DOM.artistInput.value.trim();

    if (!title && !artist) {
        showMetaStatus('Ingresa título o artista', 'error');
        return;
    }

    try {
        await sendMetadata(title, artist);
        showMetaStatus('Metadatos enviados', 'success');
    } catch (error) {
        showMetaStatus(`Error: ${error.message}`, 'error');
    }
}

async function ensureButtReachable() {
    try {
        await fetchButtStatus();
    } catch {
        if (!CONFIG.AGENT_BASE_URL) throw new Error('butt no está ejecutándose');
        updateIndicator('connecting');
        await launchButt();
        await waitForButt();
    }
}

async function waitForButt(attempts = 10, intervalMs = 600) {
    for (let i = 0; i < attempts; i++) {
        await new Promise(r => setTimeout(r, intervalMs));
        try { await fetchButtStatus(); return; } catch { /* still starting */ }
    }
    throw new Error('butt no respondió tras iniciarse');
}

async function syncState() {
    try {
        const status = await fetchButtStatus();
        const wasStreaming = STATE.isStreaming;

        STATE.buttReachable = true;
        STATE.isStreaming    = status.connected ?? false;
        STATE.isMuted        = status.muted     ?? false;

        updateIndicator('connected');

        if (STATE.isStreaming && !wasStreaming) startTimer();
        else if (!STATE.isStreaming && wasStreaming) stopTimer();
    } catch {
        STATE.buttReachable = false;
        STATE.isStreaming    = false;
        STATE.isMuted        = false;
        updateIndicator('disconnected');
        stopTimer();
    }

    updateMainButton();
    updateMuteButton();
}

function init() {
    detectTheme();
    setInterval(detectTheme, 10000);

    DOM.mainButton.addEventListener('click', onMainButtonClick);
    DOM.mainButton.addEventListener('dblclick', e => e.preventDefault());
    DOM.muteButton.addEventListener('click', onMuteButtonClick);
    DOM.sendMetaButton.addEventListener('click', onSendMetaClick);

    const sendOnEnter = e => { if (e.key === 'Enter') onSendMetaClick(); };
    DOM.titleInput.addEventListener('keydown', sendOnEnter);
    DOM.artistInput.addEventListener('keydown', sendOnEnter);

    syncState();
    setInterval(syncState, CONFIG.POLL_INTERVAL_MS);
}

init();