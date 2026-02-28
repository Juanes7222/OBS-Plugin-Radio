import { STATE, DOM } from './state.js';
import { connect } from './websocket.js';
import { startBroadcast, stopBroadcast, queryInitialState } from './broadcast.js';
import { updateButtonUI, updateStatusText, detectTheme } from './ui.js';

async function onMainButtonClick() {
    if (STATE.isProcessing || !STATE.wsIdentified) return;

    STATE.isProcessing = true;
    updateButtonUI('processing');

    try {
        STATE.isBroadcasting ? await stopBroadcast() : await startBroadcast();
    } catch (error) {
        console.error('[App] Operation error:', error);
        updateStatusText(`Error: ${error.message}`, 'error');
        setTimeout(queryInitialState, 1000);
    } finally {
        STATE.isProcessing = false;
    }
}

function init() {
    detectTheme();
    setInterval(detectTheme, 10000);

    DOM.mainButton.addEventListener('click', onMainButtonClick);
    DOM.mainButton.addEventListener('dblclick', e => e.preventDefault());

    connect();
}

init();
