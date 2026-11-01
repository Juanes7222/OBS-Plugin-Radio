import { CONFIG } from './config.js';
import { STATE, isActiveStream } from './state.js';
import { DOM } from './dom.js';
import { fetchStatus, startStream, stopStream, sendMetadata, notifyFacebookLive } from './api.js';
import { renderStatus, renderMainButton, showStatus } from './ui.js';
import { loadAgentConfigView, loadSettings, setConfigLocked, wireSettings } from './settings.js';
import { restoreDrafts, wireDraftPersistence } from './persist.js';
import { syncTimer } from './timer.js';

let pollTimer = null;
let pollInFlight = false;
let failures = 0;

/** Working inputs that must survive dock reloads and OBS restarts. */
const DRAFT_FIELDS = [
    { key: 'title', element: DOM.titleInput },
    { key: 'artist', element: DOM.artistInput },
    { key: 'fbUrl', element: DOM.fbUrlInput },
];

function applyStatus(status) {
    STATE.agentOnline = true;
    STATE.streamState = status.state ?? 'idle';
    STATE.streamDetail = status.detail ?? null;
    STATE.airing = typeof status.airing === 'boolean' ? status.airing : null;
    STATE.engine = status.engine ?? STATE.engine;
    STATE.configured = status.configured !== false;

    syncTimer(STATE.streamState === 'live');
    renderStatus();
    renderMainButton();
    setConfigLocked(isActiveStream());
}

function applyOffline() {
    STATE.agentOnline = false;
    STATE.streamState = 'idle';
    STATE.streamDetail = null;
    STATE.airing = null;

    syncTimer(false);
    renderStatus();
    renderMainButton();
    setConfigLocked(false);
}

function scheduleNextPoll() {
    clearTimeout(pollTimer);

    const delay = STATE.agentOnline
        ? CONFIG.POLL_INTERVAL_MS
        : Math.min(CONFIG.POLL_INTERVAL_MS * 2 ** failures, CONFIG.POLL_RETRY_MAX_MS);

    pollTimer = setTimeout(poll, delay);
}

async function poll() {
    if (pollInFlight) return;
    pollInFlight = true;

    try {
        applyStatus(await fetchStatus());
        failures = 0;
    } catch {
        failures += 1;
        applyOffline();
    } finally {
        pollInFlight = false;
        scheduleNextPoll();
    }
}

/** Polls right away instead of waiting for the next tick (after an action). */
async function pollNow() {
    clearTimeout(pollTimer);
    await poll();
}

async function onMainButtonClick() {
    if (STATE.isProcessing || !STATE.agentOnline) return;

    const stopping = isActiveStream();
    STATE.isProcessing = true;
    renderMainButton();

    try {
        await (stopping ? stopStream() : startStream());
        showStatus(DOM.metaStatus, stopping ? 'Transmisión detenida' : 'Transmisión iniciada');
    } catch (error) {
        showStatus(DOM.metaStatus, `Error: ${error.message}`, 'error');
    }

    // Keep the controls locked until the authoritative state comes back.
    await pollNow();
    STATE.isProcessing = false;
    renderMainButton();
}

async function onSendMetaClick() {
    const title = DOM.titleInput.value.trim();
    const artist = DOM.artistInput.value.trim();

    if (!title && !artist) {
        showStatus(DOM.metaStatus, 'Ingresa título o artista', 'error');
        return;
    }

    DOM.sendMetaButton.disabled = true;
    try {
        await sendMetadata(title, artist);
        showStatus(DOM.metaStatus, 'Metadatos enviados');
    } catch (error) {
        showStatus(DOM.metaStatus, `Error: ${error.message}`, 'error');
    } finally {
        DOM.sendMetaButton.disabled = false;
    }
}

async function notifyFacebookLiveStatus(status) {
    const permalinkUrl = DOM.fbUrlInput.value.trim();
    if (!permalinkUrl) {
        showStatus(DOM.fbStatus, 'Ingresa la URL de Facebook', 'error');
        return;
    }

    const button = status === 'live' ? DOM.fbStartBtn : DOM.fbStopBtn;
    button.disabled = true;
    try {
        await notifyFacebookLive(status, permalinkUrl);
        showStatus(DOM.fbStatus, 'Notificación enviada');
    } catch (error) {
        showStatus(DOM.fbStatus, `Error: ${error.message}`, 'error');
    } finally {
        button.disabled = false;
    }
}

function init() {
    DOM.mainButton.addEventListener('click', onMainButtonClick);
    DOM.sendMetaButton.addEventListener('click', onSendMetaClick);
    DOM.fbStartBtn.addEventListener('click', () => notifyFacebookLiveStatus('live'));
    DOM.fbStopBtn.addEventListener('click', () => notifyFacebookLiveStatus('live_stopped'));

    const sendOnEnter = event => {
        if (event.key === 'Enter') onSendMetaClick();
    };
    DOM.titleInput.addEventListener('keydown', sendOnEnter);
    DOM.artistInput.addEventListener('keydown', sendOnEnter);

    wireSettings();

    // Drafts restore before anything renders so the fields never flash empty.
    restoreDrafts(DRAFT_FIELDS);
    wireDraftPersistence(DRAFT_FIELDS);

    renderStatus();
    renderMainButton();
    poll();
    loadSettings();
    loadAgentConfigView();
}

init();
