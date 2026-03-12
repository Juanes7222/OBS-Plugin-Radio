import { STATE, DOM } from './state.js';
import { CONFIG } from './config.js';
import { fetchStatus, stopAutoDJ, startAutoDJ, agentIsOnline, startStream, stopStream } from './api.js';
import { updateRadioStatus, updateButtonUI, updateNowPlaying, updateStatusMessage, detectTheme } from './ui.js';
import { startTimer, stopTimer } from './timer.js';

async function poll() {
    try {
        const [status, agentUp] = await Promise.allSettled([
            fetchStatus(),
            agentIsOnline(),
        ]);

        if (status.status === 'rejected') {
            updateStatusMessage(`Sin conexión con el backend: ${status.reason.message}`, 'error');
            return;
        }

        const data         = status.value;
        const agentOnline  = agentUp.status === 'fulfilled';
        const wasLive      = STATE.isLive;
        STATE.isLive       = data.isLive;
        STATE.agentOnline  = agentOnline;

        updateRadioStatus(data.isLive, data.streamerName);
        updateNowPlaying(data);

        if (data.isLive && !wasLive) startTimer();
        else if (!data.isLive && wasLive) stopTimer();

        if (!STATE.isProcessing) {
            if (!agentOnline) {
                updateButtonUI('no-agent');
                updateStatusMessage('Agente local no disponible — inicia radio-agent', 'error');
            } else if (data.isLive) {
                updateButtonUI('active');
                updateStatusMessage('AL AIRE — emitiendo a la radio');
            } else {
                updateButtonUI('idle');
                updateStatusMessage('Listo para salir al aire');
            }
        }
    } catch (err) {
        updateStatusMessage(`Error: ${err.message}`, 'error');
    }
}

async function onMainButtonClick() {
    if (STATE.isProcessing) return;

    STATE.isProcessing = true;
    updateButtonUI('processing');

    try {
        if (STATE.isLive) {
            await Promise.all([stopStream(), startAutoDJ()]);
            updateStatusMessage('Emisión detenida — AutoDJ reactivado');
        } else {
            await Promise.all([startStream(), stopAutoDJ()]);
            updateStatusMessage('Emisión iniciada — AutoDJ pausado');
        }
        await poll();
    } catch (err) {
        updateStatusMessage(`Error: ${err.message}`, 'error');
    } finally {
        STATE.isProcessing = false;
    }
}

function init() {
    detectTheme();
    setInterval(detectTheme, 10000);

    DOM.mainButton.addEventListener('click', onMainButtonClick);
    DOM.mainButton.addEventListener('dblclick', e => e.preventDefault());

    poll();
    STATE.pollInterval = setInterval(poll, CONFIG.POLL_INTERVAL_MS);
}

init();