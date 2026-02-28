import { DOM } from './state.js';

export function updateConnectionUI(status) {
    DOM.connectionStatus.className = status;

    const labels = {
        connected:    'Conectado a OBS',
        disconnected: 'Desconectado',
        connecting:   'Conectando...',
    };
    DOM.connectionText.textContent = labels[status] ?? status;
}

export function updateButtonUI(buttonState) {
    const btn = DOM.mainButton;
    btn.classList.remove('active', 'processing');
    btn.disabled = false;

    const states = {
        idle:       { icon: '▶',  label: 'INICIAR',      sublabel: 'Grabar + Emitir',     onAir: false, cls: null },
        active:     { icon: '⏹',  label: 'AL AIRE',      sublabel: 'Clic para detener',   onAir: true,  cls: 'active' },
        processing: { icon: null, label: 'PROCESANDO',   sublabel: 'Espere...',           onAir: null,  cls: 'processing' },
        disabled:   { icon: '⏻',  label: 'SIN CONEXIÓN', sublabel: 'Esperando OBS...',    onAir: false, cls: null },
    };

    const cfg = states[buttonState];
    if (!cfg) return;

    if (cfg.cls)      btn.classList.add(cfg.cls);
    if (buttonState === 'disabled') btn.disabled = true;

    if (buttonState === 'processing') {
        btn.querySelector('.btn-icon').innerHTML = '<span class="spinner"></span>';
    } else {
        btn.querySelector('.btn-icon').textContent = cfg.icon;
    }

    btn.querySelector('.btn-label').textContent    = cfg.label;
    btn.querySelector('.btn-sublabel').textContent = cfg.sublabel;

    if (cfg.onAir !== null) {
        DOM.onAirBar.classList.toggle('visible', cfg.onAir);
    }
}

export function updateStatusText(text, type = 'normal') {
    DOM.statusInfo.className   = type === 'normal' ? '' : type;
    DOM.statusText.textContent = text;
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
