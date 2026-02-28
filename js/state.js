export const STATE = {
    ws: null,
    wsConnected: false,
    wsIdentified: false,
    reconnectTimer: null,
    reconnectAttempts: 0,

    isRecording: false,
    isStreaming: false,
    isRtmpActive: false,
    isBroadcasting: false,
    isProcessing: false,

    airStartTime: null,
    timerInterval: null,

    pendingRequests: new Map(),
    requestCounter: 0,
};

export const DOM = {
    connectionStatus: document.getElementById('connection-status'),
    connectionText:   document.getElementById('connection-text'),
    mainButton:       document.getElementById('main-button'),
    statusInfo:       document.getElementById('status-info'),
    statusText:       document.getElementById('status-text'),
    airTimer:         document.getElementById('air-timer'),
    onAirBar:         document.getElementById('on-air-bar'),
};
