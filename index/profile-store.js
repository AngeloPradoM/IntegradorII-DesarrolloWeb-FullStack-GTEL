// Separate from the application's authentication storage; never stores passwords.
window.previewProfile = {
  read() {
    try { return JSON.parse(sessionStorage.getItem('gtel-preview-profile') || 'null'); }
    catch { return null; }
  },
  save(profile) {
    try { sessionStorage.setItem('gtel-preview-profile', JSON.stringify(profile)); return true; }
    catch { return false; }
  },
  clear() { try { sessionStorage.removeItem('gtel-preview-profile'); } catch { /* Storage unavailable. */ } },
};
