export const CONFIG = {

    AGENT_BASE_URL: 'http://localhost:3000',

    POLL_INTERVAL_MS: 2000,
    REQUEST_TIMEOUT_MS: 5000,

    WEBHOOK_SECRET: typeof process !== 'undefined' ? process.env.WEBHOOK_SECRET : ''
};