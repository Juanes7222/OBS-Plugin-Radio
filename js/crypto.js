/**
 * Generates the auth string required by OBS WebSocket v5.
 * Step 1: base64( SHA256(password + salt) )
 * Step 2: base64( SHA256(step1 + challenge) )
 */
export async function generateAuthString(password, salt, challenge) {
    const base64Secret = arrayBufferToBase64(await sha256(password + salt));
    return arrayBufferToBase64(await sha256(base64Secret + challenge));
}

async function sha256(message) {
    const data = new TextEncoder().encode(message);
    return crypto.subtle.digest('SHA-256', data);
}

function arrayBufferToBase64(buffer) {
    let binary = '';
    new Uint8Array(buffer).forEach(byte => binary += String.fromCharCode(byte));
    return btoa(binary);
}
