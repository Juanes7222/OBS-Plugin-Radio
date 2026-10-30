/** Everything the UI renders from, and nothing else. */
export const STATE = {
    agentOnline: false,
    // idle | starting | live | reconnecting | error
    streamState: 'idle',
    streamDetail: null,
    engine: null,
    configured: true,
    // True while an action is in flight; locks the controls so clicks cannot
    // queue up behind a slow start/stop.
    isProcessing: false,
};

export const isActiveStream = () =>
    STATE.streamState === 'starting' || STATE.streamState === 'live' || STATE.streamState === 'reconnecting';
