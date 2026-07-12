// Edutrack Math — password gate.
// Loads in <head> on every page. Renders a full-page overlay that blocks
// the rest of the app until the student enters a valid password.
//
// Unlock persists per browser tab (sessionStorage) — closing the tab re-locks.
//
// Passwords are matched by SHA-256 hash so the plaintext is never in source.
// This repo IS the public site, so never write a password here, not even in a
// comment: keep the plaintext out of git entirely.
//
// To change a password:
//   1. Open devtools console on any page.
//   2. Run:  await MathGate._hash('your-new-password')
//   3. Copy the returned hex string into PASSWORD_HASHES below.
//   4. Sync + push.

(function () {
    const UNLOCK_KEY = 'edutrack_math_unlocked_v1';
    const SESSION_NAME_KEY = 'edutrack_math_session_user_v1';   // stores role (back-compat)
    const SESSION_DISPLAY_KEY = 'edutrack_math_session_name_v1'; // stores display name

    // SHA-256 hex hashes of accepted passwords → { role, name }.
    // The name is used to auto-fill the per-session student name field, so
    // students never have to type it.
    const PASSWORD_HASHES = {
        // hash("michael")
        '34550715062af006ac4fab288de67ecb44793c3a05c475227241535f6ef7a81b': { role: 'student', name: 'Michael' },
        // hash("gabe")
        '72831924521887e6638e686d6d004cd6cefe48168d2d4e2c40d29115b9c611b9': { role: 'tutor', name: 'Gabe' },
        // hash("jeffrey")
        'a459891617d735655dcfed3e37db66fa07f0175866ebf35f9de8ccc59c0840bb': { role: 'student', name: 'Jeffrey' }
    };

    async function _hash(text) {
        const enc = new TextEncoder().encode(text);
        const buf = await crypto.subtle.digest('SHA-256', enc);
        return Array.from(new Uint8Array(buf))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    function isUnlocked() {
        try { return sessionStorage.getItem(UNLOCK_KEY) === '1'; } catch (e) { return false; }
    }

    function _unlock(role, name) {
        try {
            sessionStorage.setItem(UNLOCK_KEY, '1');
            sessionStorage.setItem(SESSION_NAME_KEY, role || '');
            sessionStorage.setItem(SESSION_DISPLAY_KEY, name || '');
        } catch (e) {}
    }

    function lock() {
        try {
            sessionStorage.removeItem(UNLOCK_KEY);
            sessionStorage.removeItem(SESSION_NAME_KEY);
            sessionStorage.removeItem(SESSION_DISPLAY_KEY);
        } catch (e) {}
        location.reload();
    }

    function currentRole() {
        try { return sessionStorage.getItem(SESSION_NAME_KEY) || ''; } catch (e) { return ''; }
    }

    function currentName() {
        try { return sessionStorage.getItem(SESSION_DISPLAY_KEY) || ''; } catch (e) { return ''; }
    }

    // Auto-fill any per-session student-name field with the logged-in identity,
    // so students never type their name. Runs once the page content is shown.
    function _autofillName() {
        const name = currentName();
        if (!name) return;
        const el = document.getElementById('studentName');
        if (el && !el.value.trim()) {
            el.value = name;
            try { el.dispatchEvent(new Event('input', { bubbles: true })); } catch (e) {}
        }
    }

    // Small "Signed in as <name>" badge + log-out link, shown on every page.
    function _renderSignedInBadge() {
        if (document.getElementById('edutrack-signed-in')) return;
        const name = currentName();
        if (!name || !document.body) return;
        const b = document.createElement('div');
        b.id = 'edutrack-signed-in';
        b.style.cssText = 'position:fixed;top:10px;right:12px;z-index:99998;font:600 12px/1 Outfit,sans-serif;color:#94a3b8;background:rgba(30,41,59,0.85);border:1px solid rgba(255,255,255,0.12);border-radius:999px;padding:7px 13px;';
        b.innerHTML = 'Signed in as <span style="color:#f1f5f9;">' + name + '</span> \u00b7 <a href="#" id="edutrack-logout" style="color:#38bdf8;text-decoration:none;">Log out</a>';
        document.body.appendChild(b);
        const lo = document.getElementById('edutrack-logout');
        if (lo) lo.addEventListener('click', function (e) { e.preventDefault(); lock(); });
    }

    // Hide page content immediately by injecting CSS into <head>.
    // We do this before DOMContentLoaded so users never see a flash of content.
    function _hidePage() {
        const style = document.createElement('style');
        style.id = 'edutrack-gate-hider';
        style.textContent = 'html.edutrack-locked body { visibility: hidden !important; }';
        document.head.appendChild(style);
        document.documentElement.classList.add('edutrack-locked');
    }

    function _showPage() {
        document.documentElement.classList.remove('edutrack-locked');
        const style = document.getElementById('edutrack-gate-hider');
        if (style) style.remove();
    }

    function _renderOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'edutrack-gate-overlay';
        overlay.innerHTML = `
            <style>
                #edutrack-gate-overlay {
                    position: fixed; inset: 0; z-index: 999999;
                    background: radial-gradient(circle at 50% 0%, #1e293b 0%, #0f172a 70%);
                    color: #f1f5f9; font-family: 'Outfit', sans-serif;
                    display: flex; align-items: center; justify-content: center;
                    visibility: visible !important;
                }
                #edutrack-gate-card {
                    background: rgba(30, 41, 59, 0.9);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px; padding: 36px 32px; width: 320px;
                    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4);
                    text-align: center;
                }
                #edutrack-gate-card h1 {
                    margin: 0 0 8px; font-size: 22px; font-weight: 800;
                    background: linear-gradient(90deg, #38bdf8, #818cf8);
                    -webkit-background-clip: text; background-clip: text;
                    color: transparent;
                }
                #edutrack-gate-card p { margin: 0 0 24px; color: #94a3b8; font-size: 14px; }
                #edutrack-gate-input {
                    width: 100%; box-sizing: border-box;
                    padding: 12px 14px; font-size: 15px;
                    background: rgba(15, 23, 42, 0.6);
                    color: #f1f5f9;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 10px; outline: none;
                    font-family: 'Outfit', sans-serif;
                }
                #edutrack-gate-input:focus { border-color: #38bdf8; }
                #edutrack-gate-btn {
                    margin-top: 14px; width: 100%; padding: 12px;
                    background: linear-gradient(90deg, #38bdf8, #818cf8);
                    color: #0f172a; font-weight: 700; font-size: 15px;
                    border: none; border-radius: 10px; cursor: pointer;
                    font-family: 'Outfit', sans-serif;
                }
                #edutrack-gate-btn:hover { filter: brightness(1.1); }
                #edutrack-gate-err {
                    margin-top: 12px; min-height: 18px; font-size: 13px;
                    color: #f87171;
                }
            </style>
            <div id="edutrack-gate-card">
                <h1>Edutrack Math</h1>
                <p>Enter password to continue</p>
                <input id="edutrack-gate-input" type="password" autocomplete="off" autofocus>
                <button id="edutrack-gate-btn">Unlock</button>
                <div id="edutrack-gate-err"></div>
            </div>
        `;
        document.body.appendChild(overlay);

        const input = overlay.querySelector('#edutrack-gate-input');
        const btn = overlay.querySelector('#edutrack-gate-btn');
        const err = overlay.querySelector('#edutrack-gate-err');

        async function tryUnlock() {
            err.textContent = '';
            const val = (input.value || '').trim();
            if (!val) return;
            const h = await _hash(val);
            const entry = PASSWORD_HASHES[h];
            if (entry) {
                _unlock(entry.role, entry.name);
                overlay.remove();
                _showPage();
                _autofillName();
                _renderSignedInBadge();
            } else {
                err.textContent = 'Wrong password';
                input.value = '';
                input.focus();
            }
        }

        btn.addEventListener('click', tryUnlock);
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') tryUnlock();
        });
    }

    // Run immediately.
    _hidePage();
    // Require BOTH unlock and a recorded name. A session unlocked before the
    // identity feature existed has no name, so re-prompt once to capture it —
    // guarantees every synced record is tied to a student.
    if (isUnlocked() && currentName()) {
        // Already unlocked this tab — show as soon as DOM is ready.
        const _showAndFill = () => { _showPage(); _autofillName(); _renderSignedInBadge(); };
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', _showAndFill);
        } else {
            _showAndFill();
        }
    } else {
        // Render overlay once body exists.
        if (document.body) {
            _renderOverlay();
        } else {
            document.addEventListener('DOMContentLoaded', _renderOverlay);
        }
    }

    window.MathGate = { isUnlocked, lock, currentRole, currentName, _hash };
})();
