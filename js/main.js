import { STATE, DOM } from './state.js';
import { CONFIG } from './config.js';
import { fetchButtStatus, startStream, stopStream, sendMetadata } from './butt.js';
import { launchButt } from './agent.js';
import { updateIndicator, updateMainButton, updateMuteButton, showMetaStatus, showFbStatus, detectTheme } from './ui.js';
import { startTimer, stopTimer } from './timer.js';
import { applicationLogger } from './logger.js';

async function onMainButtonClick() {
    applicationLogger.info('Main button clicked', { isProcessing: STATE.isProcessing, isStreaming: STATE.isStreaming });
    if (STATE.isProcessing) return;

    STATE.isProcessing = true;
    updateMainButton();

    try {
        if (STATE.isStreaming) {
            applicationLogger.info('Stopping stream...');
            await stopStream();
            STATE.isStreaming = false;
            stopTimer();
            applicationLogger.info('Stream stopped.');
        } else {
            applicationLogger.info('Starting stream...');
            await ensureButtReachable();
            await startStream();
            STATE.isStreaming = true;
            startTimer();
            applicationLogger.info('Stream started successfully.');
        }
    } catch (error) {
        applicationLogger.error('Stream toggle error', error);
        showMetaStatus(`Error: ${error.message}`, 'error');
        await syncState();
    } finally {
        STATE.isProcessing = false;
        updateMainButton();
        updateMuteButton();
    }
}

async function onMuteButtonClick() {
    applicationLogger.info('Mute button clicked', { isStreaming: STATE.isStreaming, isMuted: STATE.isMuted });
    if (!STATE.isStreaming || STATE.isProcessing) return;
    try {
        const { isMuted } = await toggleMute();
        STATE.isMuted = isMuted;
        updateMuteButton();
        applicationLogger.info(`Mute state toggled. New state: ${isMuted}`);
    } catch (error) {
        applicationLogger.error('Error toggling mute', error);
        showMetaStatus(`Error al silenciar: ${error.message}`, 'error');
    }
}

async function onSendMetaClick() {
    applicationLogger.info('Send metadata button clicked');
    const title  = DOM.titleInput.value.trim();
    const artist = DOM.artistInput.value.trim();

    if (!title && !artist) {
        applicationLogger.warn('Attempted to send empty metadata');
        showMetaStatus('Ingresa título o artista', 'error');
        return;
    }

    try {
        applicationLogger.debug('Sending metadata payload', { title, artist });
        await sendMetadata(title, artist);
        showMetaStatus('Metadatos enviados', 'success');
        applicationLogger.info('Metadata sent successfully');
    } catch (error) {
        applicationLogger.error('Error sending metadata', error);
        showMetaStatus(`Error: ${error.message}`, 'error');
    }
}

async function sendFacebookWebhook(status) {
    applicationLogger.info(`Sending Facebook webhook: ${status}`);
    const url = DOM.fbUrlInput?.value.trim() ?? '';
    if (!url) {
        applicationLogger.warn('Attempted to send Facebook webhook without URL');
        showFbStatus('Ingresa la URL de Facebook', 'error');
        return;
    }

    const webhookSecret = CONFIG.WEBHOOK_SECRET;
    if (!webhookSecret) {
        applicationLogger.error('WEBHOOK_SECRET is not configured');
        showFbStatus('Error de configuración', 'error');
        return;
    }

    try {
        const payload = {
            "object": "page",
            "entry": [{
                "changes": [{
                    "field": "live_videos",
                    "value": {
                        "status": status,
                        "permalink_url": url
                    }
                }]
            }]
        };

        const response = await fetch('https://lavozverdad.com/webhook/facebook', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-webhook-secret': webhookSecret
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Status ${response.status}`);
        }

        applicationLogger.info(`Facebook webhook ${status} sent successfully`);
        showFbStatus('Notificación enviada', 'success');
    } catch (error) {
        applicationLogger.error('Error sending Facebook webhook', error);
        showFbStatus(`Error al notificar`, 'error');
    }
}

async function ensureButtReachable() {
    applicationLogger.debug('Ensuring butt is reachable...');
    try {
        await fetchButtStatus();
        applicationLogger.debug('butt is already reachable.');
    } catch {
        if (!CONFIG.AGENT_BASE_URL) {
            applicationLogger.error('butt is not reachable and AGENT_BASE_URL is not configured.');
            throw new Error('butt no está ejecutándose');
        }
        
        applicationLogger.info('butt is not reachable. Attempting to start agent...');
        updateIndicator('connecting');
        await launchButt();
        await waitForButt();
        applicationLogger.info('Agent started and butt is reachable.');
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
        applicationLogger.debug('syncState fetched status', status);
        const wasStreaming = STATE.isStreaming;

        STATE.buttReachable = true;
        STATE.isStreaming = status.isStreaming ?? status.connected ?? status.running ?? false;
        STATE.isMuted     = status.muted     ?? false;

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

    if (DOM.fbStartBtn) {
        DOM.fbStartBtn.addEventListener('click', () => sendFacebookWebhook('live'));
    }
    if (DOM.fbStopBtn) {
        DOM.fbStopBtn.addEventListener('click', () => sendFacebookWebhook('live_stopped'));
    }

    const sendOnEnter = e => { if (e.key === 'Enter') onSendMetaClick(); };
    DOM.titleInput.addEventListener('keydown', sendOnEnter);
    DOM.artistInput.addEventListener('keydown', sendOnEnter);

    syncState();
    setInterval(syncState, CONFIG.POLL_INTERVAL_MS);
}

init();