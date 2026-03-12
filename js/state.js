export const STATE = {
    isLive:        false,
    isProcessing:  false,
    pollInterval:  null,
};

export const DOM = {
    radioStatus:   document.getElementById('radio-status'),
    statusDot:     document.getElementById('status-dot'),
    statusText:    document.getElementById('status-text'),
    mainButton:    document.getElementById('main-button'),
    songTitle:     document.getElementById('song-title'),
    songArtist:    document.getElementById('song-artist'),
    listeners:     document.getElementById('listeners'),
    airTimer:      document.getElementById('air-timer'),
    statusInfo:    document.getElementById('status-info'),
    statusMessage: document.getElementById('status-message'),
};
