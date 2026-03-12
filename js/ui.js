import { DOM } from './state.js';

export function updateRadioStatus(isLive, streamerName) {
    DOM.radioStatus.className  = isLive ? 'live' : 'autodj';
    DOM.statusDot.className    = isLive ? 'dot live' : 'dot autodj';
    DOM.statusText.textContent = isLive
        ? `EN VIVO${streamerName ? ' — ' + streamerName : ''}`
        : 'AutoDJ';
}

export function updateButtonUI(buttonState) {
    const btn = DOM.mainButton;
    btn.classList.remove('active', 'processing', 'disabled');
    btn.disabled = false;

    const states = {
        idle:       { icon: '▶', label: 'SALIR AL AIRE',  sublabel: 'Iniciar emisión' },
        active:     { icon: '⏹', label: 'AL AIRE',        sublabel: 'Clic para detener' },
        processing: { icon: '…', label: 'PROCESANDO',     sublabel: 'Espere...' },
        'no-agent': { icon: '⚠', label: 'SIN AGENTE',     sublabel: 'Inicia radio-agent' },
    };

    const cfg = states[buttonState];
    if (!cfg) return;

    if (buttonState === 'active')     btn.classList.add('active');
    if (buttonState === 'processing') { btn.classList.add('processing'); btn.disabled = true; }
    if (buttonState === 'no-agent')   { btn.classList.add('disabled');   btn.disabled = true; }

    btn.querySelector('.btn-icon').textContent     = cfg.icon;
    btn.querySelector('.btn-label').textContent    = cfg.label;
    btn.querySelector('.btn-sublabel').textContent = cfg.sublabel;

    document.getElementById('on-air-bar').classList.toggle('visible', buttonState === 'active');
}

export function updateNowPlaying({ currentSong, currentArtist, listeners }) {
    DOM.songTitle.textContent  = currentSong   ?? '—';
    DOM.songArtist.textContent = currentArtist ?? '—';
    DOM.listeners.textContent  = listeners     ?? 0;
}

export function updateStatusMessage(text, type = 'normal') {
    DOM.statusInfo.className      = type === 'normal' ? '' : type;
    DOM.statusMessage.textContent = text;
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