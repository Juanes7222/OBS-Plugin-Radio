import { STATE } from './state.js';
import { DOM } from './dom.js';

const ICON_PLAY = '<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
const ICON_STOP = '<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h12v12H6z"/></svg>';
const ICON_BUSY = '<span class="loading loading-spinner loading-lg"></span>';

const STATE_LABELS = {
    idle: 'detenido',
    starting: 'iniciando…',
    live: 'en línea',
    reconnecting: 'reconectando…',
    error: 'error de transmisión',
};

// Last rendered value per surface: the panel polls every 2s and must not touch
// the DOM (or restart CSS animations) when nothing changed.
const rendered = { status: '', main: '', detail: '' };

const statusTimers = new WeakMap();

/** A stream the station is not airing is not a working connection. */
const isOffAir = () => STATE.streamState === 'live' && STATE.airing === false;

function connectionState() {
    if (!STATE.agentOnline) return 'disconnected';
    if (STATE.streamState !== 'live') return 'connecting';
    return isOffAir() ? 'connecting' : 'connected';
}

export function renderStatus() {
    const connection = connectionState();
    const label = connection === 'disconnected'
        ? 'agente sin conexión'
        : isOffAir()
            ? 'sin aire en la emisora'
            : STATE_LABELS[STATE.streamState] ?? STATE.streamState;

    const key = `${connection}|${label}`;
    if (key !== rendered.status) {
        rendered.status = key;
        DOM.statusIndicator.classList.remove('connected', 'disconnected', 'connecting');
        DOM.statusIndicator.classList.add(connection);
        DOM.statusLabel.textContent = label;
    }

    const detail = STATE.agentOnline ? STATE.streamDetail ?? '' : '';
    if (detail !== rendered.detail) {
        rendered.detail = detail;
        DOM.streamError.textContent = detail;
        DOM.streamError.classList.toggle('hidden', detail === '');
    }
}

export function renderMainButton() {
    const live = STATE.streamState === 'live';
    const connecting = STATE.streamState === 'starting' || STATE.streamState === 'reconnecting';

    const key = `${STATE.isProcessing}|${STATE.streamState}|${STATE.agentOnline}|${STATE.airing}`;
    if (key === rendered.main) return;
    rendered.main = key;

    DOM.mainButton.disabled = STATE.isProcessing || !STATE.agentOnline;
    DOM.mainButton.classList.toggle('active', live && !STATE.isProcessing);

    if (STATE.isProcessing) {
        DOM.mainIcon.innerHTML = ICON_BUSY;
        DOM.mainLabel.textContent = 'PROCESANDO';
    } else if (connecting) {
        DOM.mainIcon.innerHTML = ICON_BUSY;
        DOM.mainLabel.textContent = 'CONECTANDO';
    } else if (live && STATE.airing === false) {
        DOM.mainIcon.innerHTML = ICON_STOP;
        DOM.mainLabel.textContent = 'SIN AIRE';
    } else if (live) {
        DOM.mainIcon.innerHTML = ICON_STOP;
        DOM.mainLabel.textContent = 'AL AIRE';
    } else {
        DOM.mainIcon.innerHTML = ICON_PLAY;
        DOM.mainLabel.textContent = 'INICIAR';
    }

    DOM.onAirBar.classList.toggle('on-air', live);
    DOM.onAirBar.classList.toggle('off-air', !live);
}

/** Shows a temporary message in one of the panel's status lines. */
export function showStatus(element, message, type = 'info') {
    clearTimeout(statusTimers.get(element));

    element.className = `meta-status text-xs text-center block font-semibold ${type === 'error' ? 'text-error' : 'text-success'}`;
    element.textContent = message;

    statusTimers.set(element, setTimeout(() => {
        element.className = 'meta-status hidden';
        element.textContent = '';
    }, 4000));
}
