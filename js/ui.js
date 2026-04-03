import { STATE, DOM } from './state.js';

export function updateIndicator(status) {
    DOM.statusIndicator.classList.remove('connected', 'disconnected', 'connecting');
    DOM.statusIndicator.classList.add(status);
    const labels = {
        connected:    'butt conectado',
        disconnected: 'butt desconectado',
        connecting:   'conectando...',
    };
    DOM.statusLabel.textContent = labels[status] ?? status;
}

export function updateMainButton() {
    const btn = DOM.mainButton;
    btn.classList.remove('active', 'processing');
    btn.disabled = STATE.isProcessing || !STATE.buttReachable;

    if (STATE.isProcessing) {
        btn.classList.add('processing');
        btn.querySelector('.btn-icon').innerHTML = '<span class="loading loading-spinner loading-lg"></span>';
        btn.querySelector('.btn-label').textContent    = 'PROCESANDO';
        if (btn.querySelector('.btn-sublabel')) {
            btn.querySelector('.btn-sublabel').textContent = 'Espere...';
        }
        return;
    }

    if (STATE.isStreaming) {
        btn.classList.add('active');
        btn.querySelector('.btn-icon').innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h12v12H6z"/></svg>';
        btn.querySelector('.btn-label').textContent    = 'AL AIRE';
        if (btn.querySelector('.btn-sublabel')) {
            btn.querySelector('.btn-sublabel').textContent = 'Clic para detener';
        }
    } else {
        btn.querySelector('.btn-icon').innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
        btn.querySelector('.btn-label').textContent    = 'INICIAR';
        if (btn.querySelector('.btn-sublabel')) {
            btn.querySelector('.btn-sublabel').textContent = 'Transmitir a AzuraCast';
        }
    }

    DOM.onAirBar.classList.toggle('visible', STATE.isStreaming);
}

export function updateMuteButton() {
    DOM.muteButton.classList.toggle('muted', STATE.isMuted);
    DOM.muteButton.textContent = STATE.isMuted ? 'SILENCIADO' : 'SILENCIAR';
    DOM.muteButton.disabled    = !STATE.isStreaming || STATE.isProcessing;
}

export function showMetaStatus(message, type = 'normal') {
    DOM.metaStatus.className   = `meta-status text-xs text-center block font-semibold ${type === 'error' ? 'text-error' : 'text-success'}`;
    DOM.metaStatus.textContent = message;
    setTimeout(() => { DOM.metaStatus.textContent = ''; DOM.metaStatus.className = 'meta-status hidden'; }, 3000);
}

export function showFbStatus(message, type = 'normal') {
    if (!DOM.fbStatus) return;
    DOM.fbStatus.className   = `meta-status text-xs text-center block font-semibold ${type === 'error' ? 'text-error' : 'text-success'}`;
    DOM.fbStatus.textContent = message;
    setTimeout(() => { DOM.fbStatus.textContent = ''; DOM.fbStatus.className = 'meta-status hidden'; }, 3000);
}

export function detectTheme() {
    document.documentElement.setAttribute('data-theme', 'dark');
}