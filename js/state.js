export const STATE = {
    isStreaming:   false,
    isMuted:       false,
    isProcessing:  false,
    buttReachable: false,

    airStartTime:  null,
    timerInterval: null,
};

export const DOM = {
    statusIndicator: document.getElementById('status-indicator'),
    statusDot:       document.getElementById('status-dot'),
    statusLabel:     document.getElementById('status-label'),
    mainButton:      document.getElementById('main-button'),
    muteButton:      document.getElementById('mute-button'),
    titleInput:      document.getElementById('meta-title'),
    artistInput:     document.getElementById('meta-artist'),
    sendMetaButton:  document.getElementById('send-meta'),
    metaStatus:      document.getElementById('meta-status'),
    airTimer:        document.getElementById('air-timer'),
    onAirBar:        document.getElementById('on-air-bar'),
    fbUrlInput:      document.getElementById('fb-url'),
    fbStartBtn:      document.getElementById('fb-start'),
    fbStopBtn:       document.getElementById('fb-stop'),
    fbStatus:        document.getElementById('fb-status'),
};