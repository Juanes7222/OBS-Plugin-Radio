/**
 * Draft persistence: the working inputs survive dock reloads, OBS restarts and
 * reboots inside the CEF-localStorage profile (disk-backed per OBS install).
 *
 * Scope: only inputs the panel owns. The agent configuration fields are NOT
 * persisted here — the agent is the source of truth and refill them on open.
 *
 * Reading/writing localStorage is wrapped defensively: an OBS profile that
 * blocks storage (or a corrupted record) must never break the panel.
 */

const STORAGE_KEY = 'radio-panel:drafts:v1';
let timer = null;

function readDrafts() {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
}

/** Restores saved values into the fields before the user looks at the panel. */
export function restoreDrafts(fields) {
    const drafts = readDrafts();
    for (const { key, element } of fields) {
        const value = drafts[key];
        if (typeof value === 'string') element.value = value;
    }
}

/** Debounced "input" persistence + a synchronous flush on pagehide. */
export function wireDraftPersistence(fields) {
    const collect = () => {
        const drafts = readDrafts();
        for (const { key, element } of fields) drafts[key] = element.value;
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
        } catch {
            // Storage unavailable: the panel keeps working without drafts.
        }
    };

    for (const { element } of fields) {
        element.addEventListener('input', () => {
            clearTimeout(timer);
            timer = setTimeout(collect, 400);
        });

        // A blur of the last edited field must not race the timer.
        element.addEventListener('change', () => {
            clearTimeout(timer);
            collect();
        });
    }

    // OBS may tear the dock down without a warning; this is the last chance.
    window.addEventListener('pagehide', () => {
        clearTimeout(timer);
        collect();
    });
}
