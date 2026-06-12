// Edutrack Math — per-app session snapshot for resume support.
// Loaded by every sub-app before app.js. Exposes window.MathSession.
//
// Storage shape (localStorage["edutrack_math_session_<appId>_v1"]):
//   {
//     version: 1,
//     appId: string,
//     savedAt: number (epoch ms),
//     state: { ...snapshot...}    // shape is app-defined
//   }
//
// Apps are responsible for choosing what to put in the snapshot. This
// module just serialises, time-stamps, and version-gates it.

(function () {
    const SCHEMA_VERSION = 1;
    const TTL_MS = 7 * 86_400_000; // 7 days — older saves are silently dropped
    const HISTORY_KEY = 'edutrack_math_sessions_v1';
    const MAX_HISTORY = 500;

    // ──────────────────────────────────────────────────────
    // Tutor sync — fires after each finished session.
    // Set SYNC_URL to your Apps Script web-app URL once deployed.
    // Set SYNC_KEY to the matching shared secret in the script.
    // Leave SYNC_URL empty to disable syncing entirely.
    // ──────────────────────────────────────────────────────
    const SYNC_URL = 'https://script.google.com/macros/s/AKfycbyuJWML-IQ8S4_f_5uKf-2MUry6pTqNQotSV47GdZQc2lDQRf_6JUIvXy9LIwiOCB3Uvg/exec'; // e.g. 'https://script.google.com/macros/s/AKfycb.../exec'
    const SYNC_KEY = 'edutrack-math-v1'; // change to match Apps Script SHARED_KEY
    const SYNC_QUEUE_KEY = 'edutrack_math_sync_queue_v1';
    const SYNC_MAX_QUEUE = 100;

    function key(appId) {
        return `edutrack_math_session_${appId}_v1`;
    }

    function save(appId, snapshot) {
        if (!appId || !snapshot) return;
        try {
            const wrapped = {
                version: SCHEMA_VERSION,
                appId,
                savedAt: Date.now(),
                state: snapshot
            };
            localStorage.setItem(key(appId), JSON.stringify(wrapped));
        } catch (e) {
            // Quota exceeded or storage disabled — silently ignore.
        }
    }

    function load(appId) {
        try {
            const raw = localStorage.getItem(key(appId));
            if (!raw) return null;
            const wrapped = JSON.parse(raw);
            if (!wrapped || wrapped.version !== SCHEMA_VERSION) return null;
            if (typeof wrapped.savedAt !== 'number') return null;
            if (Date.now() - wrapped.savedAt > TTL_MS) {
                clear(appId);
                return null;
            }
            return wrapped;
        } catch (e) {
            return null;
        }
    }

    function clear(appId) {
        try { localStorage.removeItem(key(appId)); } catch (e) { }
    }

    function has(appId) {
        return load(appId) !== null;
    }

    // ──────────────────────────────────────────────────────
    // History log — appended on every finished session.
    // Stored as a single array under HISTORY_KEY. Capped at MAX_HISTORY entries
    // (oldest dropped on overflow).
    // ──────────────────────────────────────────────────────

    function _readHistory() {
        try {
            const raw = localStorage.getItem(HISTORY_KEY);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) { return []; }
    }

    function logCompletion(entry) {
        if (!entry || !entry.appId) return;
        const normalised = {
            v: 1,
            sessionId: entry.sessionId || ('session_' + Date.now()),
            appId: entry.appId,
            appName: entry.appName || entry.appId,
            module: entry.module || 'unknown',
            variant: entry.variant || 'standard',
            topicTitle: entry.topicTitle || '',
            score: Number(entry.score) || 0,
            gradable: Number(entry.gradable) || 0,
            ungraded: Number(entry.ungraded) || 0,
            missed: Number(entry.missed) || 0,
            durationMs: Number(entry.durationMs) || 0,
            startedAt: entry.startedAt || null,
            completedAt: entry.completedAt || Date.now(),
            studentName: entry.studentName || '',
            smartMode: !!entry.smartMode,
            isExamMode: !!entry.isExamMode,
            detail: Array.isArray(entry.detail) ? entry.detail : []
        };
        try {
            const history = _readHistory();
            history.push(normalised);
            const trimmed = history.length > MAX_HISTORY
                ? history.slice(history.length - MAX_HISTORY)
                : history;
            localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
        } catch (e) {
            // Quota or storage disabled — silently ignore.
        }
        // Fire-and-forget tutor sync. Failures queue for retry next session.
        _pushToTutor(normalised);
    }

    // ──────────────────────────────────────────────────────
    // Tutor sync helpers
    // ──────────────────────────────────────────────────────

    function _readSyncQueue() {
        try {
            const raw = localStorage.getItem(SYNC_QUEUE_KEY);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) { return []; }
    }

    function _writeSyncQueue(arr) {
        try {
            const trimmed = arr.length > SYNC_MAX_QUEUE
                ? arr.slice(arr.length - SYNC_MAX_QUEUE)
                : arr;
            localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(trimmed));
        } catch (e) { }
    }

    function _postOne(entry) {
        if (!SYNC_URL) return Promise.resolve({ ok: false, reason: 'disabled' });
        // text/plain avoids CORS preflight; Apps Script parses the body manually.
        return fetch(SYNC_URL, {
            method: 'POST',
            mode: 'cors',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ key: SYNC_KEY, type: 'session', payload: entry })
        }).then(r => r.ok ? { ok: true } : { ok: false, reason: 'http_' + r.status })
            .catch(err => ({ ok: false, reason: String(err && err.message || err) }));
    }

    function _pushToTutor(entry) {
        if (!SYNC_URL) return;
        // First, drain any queued entries from prior failed syncs.
        const queue = _readSyncQueue();
        const all = queue.concat([entry]);
        const survivors = [];
        // Sequential to keep order; awaited via .then chain.
        let chain = Promise.resolve();
        all.forEach(item => {
            chain = chain.then(() => _postOne(item)).then(res => {
                if (!res.ok) survivors.push(item);
            });
        });
        chain.then(() => _writeSyncQueue(survivors));
    }

    function syncStatus() {
        return {
            enabled: !!SYNC_URL,
            pending: _readSyncQueue().length
        };
    }

    function getHistory(filters) {
        filters = filters || {};
        let history = _readHistory();
        if (filters.appId) history = history.filter(e => e.appId === filters.appId);
        if (filters.studentName) history = history.filter(e => e.studentName === filters.studentName);
        if (filters.sinceMs) history = history.filter(e => e.completedAt >= filters.sinceMs);
        return history;
    }

    function clearHistory() {
        try { localStorage.removeItem(HISTORY_KEY); } catch (e) { }
    }

    window.MathSession = { save, load, clear, has, logCompletion, getHistory, clearHistory, syncStatus };
})();
