import { STATE, DOM } from './state.js';

export function startTimer() {
    STATE.airStartTime = Date.now();
    DOM.airTimer.classList.add('visible');

    if (STATE.timerInterval) clearInterval(STATE.timerInterval);

    STATE.timerInterval = setInterval(() => {
        DOM.airTimer.textContent = formatElapsed(Date.now() - STATE.airStartTime);
    }, 500);
}

export function stopTimer() {
    if (STATE.timerInterval) {
        clearInterval(STATE.timerInterval);
        STATE.timerInterval = null;
    }
    DOM.airTimer.classList.remove('visible');
    STATE.airStartTime = null;
}

function formatElapsed(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours   = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function pad(n) {
    return n < 10 ? '0' + n : String(n);
}
