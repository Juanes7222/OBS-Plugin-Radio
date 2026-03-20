import { STATE, DOM } from './state.js';

export function updateIndicator(status) {
    DOM.statusIndicator.className = `indicator ${status}`;
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
        btn.querySelector('.btn-icon').innerHTML = '<span class="spinner"></span>';
        btn.querySelector('.btn-label').textContent    = 'PROCESANDO';
        btn.querySelector('.btn-sublabel').textContent = 'Espere...';
        return;
    }

    if (STATE.isStreaming) {
        btn.classList.add('active');
        btn.querySelector('.btn-icon').textContent     = '\u23F9';
        btn.querySelector('.btn-label').textContent    = 'AL AIRE';
        btn.querySelector('.btn-sublabel').textContent = 'Clic para detener';
    } else {
        btn.querySelector('.btn-icon').textContent     = '\u25B6';
        btn.querySelector('.btn-label').textContent    = 'INICIAR';
        btn.querySelector('.btn-sublabel').textContent = 'Transmitir a AzuraCast';
    }

    DOM.onAirBar.classList.toggle('visible', STATE.isStreaming);
}

export function updateMuteButton() {
    DOM.muteButton.classList.toggle('muted', STATE.isMuted);
    DOM.muteButton.textContent = STATE.isMuted ? 'SILENCIADO' : 'SILENCIAR';
    DOM.muteButton.disabled    = !STATE.isStreaming || STATE.isProcessing;
}

export function showMetaStatus(message, type = 'normal') {
    DOM.metaStatus.className   = `meta-status ${type}`;
    DOM.metaStatus.textContent = message;
    setTimeout(() => { DOM.metaStatus.textContent = ''; DOM.metaStatus.className = 'meta-status'; }, 3000);
}

export function detectTheme() {
    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;width:1px;height:1px;top:-1px;left:-1px;background:inherit;pointer-events:none;';
    document.body.appendChild(probe);
    const bg = getComputedStyle(probe).backgroundColor;
    document.body.removeChild(probe);

    const match = bg.match(/(\d+)/g);
    if (!match || match.length < 3) return;

    const [r, g, b] = match.map(Number);
    // ITU-R BT.709 perceived luminance
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    document.documentElement.classList.toggle('theme-light', luminance > 0.5);
}