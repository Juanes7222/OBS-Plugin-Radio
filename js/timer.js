import { DOM } from './dom.js';

let intervalId = null;
let startedAt = 0;
let lastText = '';

const pad = value => String(value).padStart(2, '0');

function formatElapsed(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${pad(hours)}:${pad(minutes)}:${pad(totalSeconds % 60)}`;
}

function render() {
    const text = formatElapsed(Date.now() - startedAt);
    if (text === lastText) return; // the label only changes once per second
    lastText = text;
    DOM.airTimer.textContent = text;
}

function stopTimer() {
    clearInterval(intervalId);
    intervalId = null;
    lastText = '';
    DOM.airTimer.classList.remove('visible');
}

/** Starts the on-air clock once and keeps it running across status polls. */
export function syncTimer(isStreaming) {
    if (!isStreaming) return stopTimer();
    if (intervalId !== null) return;

    startedAt = Date.now();
    DOM.airTimer.classList.add('visible');
    render();
    intervalId = setInterval(render, 1000);
}
