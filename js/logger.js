export const LogLevel = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    NONE: 4
};

export class Logger {
    constructor(minimumLevel = LogLevel.DEBUG) {
        this.minimumLevel = minimumLevel;
    }

    setMinimumLevel(level) {
        this.minimumLevel = level;
    }

    formatLogMessage(levelPrefix, message, additionalData) {
        const timestamp = new Date().toISOString();
        const dataPrefix = additionalData ? ` | Payload: ${JSON.stringify(additionalData)}` : '';
        return `[${timestamp}] [${levelPrefix}] ${message}${dataPrefix}`;
    }

    debug(message, additionalData = null) {
        if (this.minimumLevel <= LogLevel.DEBUG) {
            console.debug(this.formatLogMessage('DEBUG', message, additionalData));
        }
    }

    info(message, additionalData = null) {
        if (this.minimumLevel <= LogLevel.INFO) {
            console.info(this.formatLogMessage('INFO', message, additionalData));
        }
    }

    warn(message, additionalData = null) {
        if (this.minimumLevel <= LogLevel.WARN) {
            console.warn(this.formatLogMessage('WARN', message, additionalData));
        }
    }

    error(message, errorObject = null) {
        if (this.minimumLevel <= LogLevel.ERROR) {
            console.error(this.formatLogMessage('ERROR', message));
            if (errorObject) {
                console.error(errorObject);
            }
        }
    }
}

export const applicationLogger = new Logger(LogLevel.DEBUG);
