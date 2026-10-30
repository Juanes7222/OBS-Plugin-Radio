/**
 * Build-time constants for the panel. Everything here ends up inside
 * dist/bundle.js, which OBS loads from disk, so this file must never hold a
 * secret: outbound calls that need one are proxied through the local agent.
 */
export const CONFIG = Object.freeze({
    AGENT_BASE_URL: 'http://localhost:3000',

    // Poll fast while the agent answers, back off while it is unreachable.
    POLL_INTERVAL_MS: 2000,
    POLL_RETRY_MAX_MS: 8000,

    // Status calls must fail fast so a hung agent cannot freeze the panel.
    STATUS_TIMEOUT_MS: 4000,
    // Actions may have to launch butt.exe, which the agent waits for.
    ACTION_TIMEOUT_MS: 25000,
});
