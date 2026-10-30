import { STATE, isActiveStream } from './state.js';
import { DOM } from './dom.js';
import {
    fetchAgentConfig,
    fetchDevices,
    fetchSettings,
    saveAgentConfig,
    saveSettings,
} from './api.js';
import { showStatus } from './ui.js';

let agentConfigFile = null;

function fillDevices(devices, selected) {
    // A configured device that is not plugged in must stay selectable, otherwise
    // saving the form would silently switch the stream to another input.
    const names = selected && !devices.includes(selected) ? [selected, ...devices] : devices;

    DOM.deviceSelect.replaceChildren(...names.map(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        return option;
    }));

    DOM.deviceSelect.value = selected ?? devices[0] ?? '';
}

/**
 * Blocks every configuration control while audio is (or is about to be) on air.
 * The panel polls every 2s, so an unchanged state must not touch the DOM.
 */
export function setConfigLocked(locked, { force = false } = {}) {
    if (!force && DOM.agentPanel.dataset.locked === String(locked)) return;
    DOM.agentPanel.dataset.locked = String(locked);

    for (const panel of [DOM.agentPanel, DOM.settingsPanel]) {
        for (const control of panel.querySelectorAll('input, select, button')) {
            control.disabled = locked;
        }
    }

    DOM.agentHint.textContent = locked
        ? 'Transmisión activa: detené la transmisión para editar la configuración.'
        : agentConfigFile
            ? `Se guarda en ${agentConfigFile}`
            : '';
    DOM.agentHint.classList.toggle('text-warning', locked);
}

export async function loadSettings({ refreshDevices = false } = {}) {
    try {
        const view = await fetchSettings();
        STATE.engine = view.engine;
        STATE.configured = view.configured;

        // butt has no tunable capture settings; hide the whole block for it.
        DOM.settingsPanel.hidden = view.engine !== 'ffmpeg';
        if (view.engine !== 'ffmpeg') return;

        const { devices } = await fetchDevices(refreshDevices);
        fillDevices(devices, view.settings.device);

        DOM.codecSelect.value = view.settings.codec;
        DOM.bitrateSelect.value = String(view.settings.bitrateKbps);
        DOM.channelsSelect.value = String(view.settings.channels);
        DOM.gainInput.value = String(view.settings.gainDb);
        DOM.mountInput.value = view.settings.mount ?? '';
    } catch (error) {
        showStatus(DOM.metaStatus, `No se pudo leer la configuración: ${error.message}`, 'error');
    }
}

export async function loadAgentConfigView() {
    try {
        const view = await fetchAgentConfig();
        agentConfigFile = view.file ?? null;

        DOM.engineSelect.value = view.engine;
        DOM.cfgHost.value = view.source.host ?? '';
        DOM.cfgPort.value = String(view.source.port ?? '');
        DOM.cfgMount.value = view.source.mount ?? '';
        DOM.cfgUser.value = view.source.user ?? '';
        DOM.cfgTls.checked = Boolean(view.source.tls);
        DOM.cfgName.value = view.source.streamName ?? '';
        DOM.cfgGenre.value = view.source.genre ?? '';
        DOM.cfgWebsite.value = view.source.website ?? '';
        DOM.cfgPublic.checked = Boolean(view.source.isPublic);
        DOM.cfgFfmpeg.value = view.ffmpegPath ?? '';
        DOM.cfgButt.value = view.buttExePath ?? '';
        DOM.cfgBackendUrl.value = view.backend.url ?? '';

        // Secrets never travel back: the field stays empty and the placeholder
        // says whether one is already stored.
        DOM.cfgPassword.value = '';
        DOM.cfgPassword.placeholder = view.source.passwordConfigured ? '•••••• (sin cambios)' : 'sin definir';
        DOM.cfgBackendSecret.value = '';
        DOM.cfgBackendSecret.placeholder = view.backend.secretConfigured ? '•••••• (sin cambios)' : 'sin definir';

        setConfigLocked(isActiveStream());
    } catch (error) {
        DOM.agentHint.textContent = `No se pudo leer la configuración: ${error.message}`;
        DOM.agentHint.classList.add('text-warning');
    }
}

async function onSaveAgentConfig() {
    if (isActiveStream()) {
        showStatus(DOM.agentStatus, 'Detené la transmisión antes de cambiar la configuración', 'error');
        return;
    }

    DOM.saveAgentConfigBtn.disabled = true;
    try {
        const payload = {
            engine: DOM.engineSelect.value,
            host: DOM.cfgHost.value.trim(),
            port: Number(DOM.cfgPort.value),
            mount: DOM.cfgMount.value.trim(),
            sourceUser: DOM.cfgUser.value.trim(),
            tls: DOM.cfgTls.checked,
            streamName: DOM.cfgName.value.trim(),
            genre: DOM.cfgGenre.value.trim(),
            website: DOM.cfgWebsite.value.trim(),
            isPublic: DOM.cfgPublic.checked,
            ffmpegPath: DOM.cfgFfmpeg.value.trim(),
            buttExePath: DOM.cfgButt.value.trim(),
            backendUrl: DOM.cfgBackendUrl.value.trim(),
        };

        // An empty secret means "leave the stored one alone".
        const password = DOM.cfgPassword.value.trim();
        if (password) payload.sourcePassword = password;
        const backendSecret = DOM.cfgBackendSecret.value.trim();
        if (backendSecret) payload.backendSecret = backendSecret;

        await saveAgentConfig(payload);
        showStatus(DOM.agentStatus, 'Configuración guardada');

        await loadAgentConfigView();
        await loadSettings();
    } catch (error) {
        showStatus(DOM.agentStatus, `Error: ${error.message}`, 'error');
    } finally {
        setConfigLocked(isActiveStream(), { force: true });
    }
}

async function onSaveSettingsClick() {
    if (isActiveStream()) {
        showStatus(DOM.metaStatus, 'Detené la transmisión antes de cambiar la configuración', 'error');
        return;
    }

    DOM.saveSettingsBtn.disabled = true;
    try {
        await saveSettings({
            device: DOM.deviceSelect.value,
            codec: DOM.codecSelect.value,
            bitrateKbps: Number(DOM.bitrateSelect.value),
            channels: Number(DOM.channelsSelect.value),
            gainDb: Number(DOM.gainInput.value),
            mount: DOM.mountInput.value.trim(),
        });

        showStatus(DOM.metaStatus, 'Configuración guardada');
    } catch (error) {
        showStatus(DOM.metaStatus, `Error: ${error.message}`, 'error');
    } finally {
        setConfigLocked(isActiveStream(), { force: true });
    }
}

export function wireSettings() {
    DOM.saveSettingsBtn.addEventListener('click', onSaveSettingsClick);
    DOM.saveAgentConfigBtn.addEventListener('click', onSaveAgentConfig);
    DOM.refreshDevicesBtn.addEventListener('click', () => loadSettings({ refreshDevices: true }));

    DOM.settingsPanel.addEventListener('toggle', event => {
        if (event?.target?.open) loadSettings();
    });
    DOM.agentPanel.addEventListener('toggle', event => {
        if (event?.target?.open) loadAgentConfigView();
    });
}
