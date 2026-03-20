import { CONFIG } from './config.js';

/** Asks radio-agent to spawn the butt process. */
export async function launchButt() {
    if (!CONFIG.AGENT_BASE_URL) throw new Error('Agent not configured');

    const res = await fetch(`${CONFIG.AGENT_BASE_URL}/butt/launch`, {
        method: 'POST',
        signal: AbortSignal.timeout(CONFIG.REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`Agent launch failed (${res.status})`);
}