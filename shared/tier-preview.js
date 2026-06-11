// Edutrack Math — tier preview badge.
// Renders a small "X review · Y new · Z mastered" summary above the
// personalised set buttons so the student knows what's waiting for them
// before they click.
//
// Usage from each app.js (after MathProgress is loaded):
//
//   MathTierPreview.attach('Linear_Functions_App', './manifest.json', '#tierPreview');
//
// The badge re-renders automatically whenever a session is logged.

(function () {
    let _appId = null;
    let _questionIds = null;
    let _container = null;

    function _renderHTML(summary) {
        const struggling = summary.struggling || 0;
        const learning = summary.learning || 0;
        const review = struggling + learning;
        const unseen = summary.unseen || 0;
        const mastered = summary.mastered || 0;
        const parts = [];
        if (review > 0) parts.push(`<span style="color:#f59e0b">${review} review</span>`);
        if (unseen > 0) parts.push(`<span style="color:#94a3b8">${unseen} new</span>`);
        if (mastered > 0) parts.push(`<span style="color:#10b981">${mastered} mastered</span>`);
        return parts.length === 0
            ? '<span style="color:#64748b;font-style:italic;">Start any set to begin tracking</span>'
            : parts.join(' · ');
    }

    function refresh() {
        if (!_container || !_appId || !_questionIds || !window.MathProgress) return;
        const s = window.MathProgress.summary(_appId, _questionIds);
        _container.innerHTML = _renderHTML(s);
    }

    async function attach(appId, manifestUrl, containerSelector) {
        _appId = appId;
        _container = document.querySelector(containerSelector);
        if (!_container) return;
        try {
            const r = await fetch(manifestUrl, { cache: 'no-store' });
            if (!r.ok) return;
            const manifest = await r.json();
            if (!Array.isArray(manifest.questionIds)) return;
            _questionIds = manifest.questionIds;
            refresh();
        } catch (e) { /* manifest missing — silently skip */ }
    }

    // Auto-refresh when a session completes (MathSession.logCompletion fires).
    // We monkey-patch logCompletion once on first attach.
    let _hookInstalled = false;
    function _installHook() {
        if (_hookInstalled || !window.MathSession || !window.MathSession.logCompletion) return;
        const original = window.MathSession.logCompletion.bind(window.MathSession);
        window.MathSession.logCompletion = function (entry) {
            const r = original(entry);
            try { refresh(); } catch (e) {}
            return r;
        };
        _hookInstalled = true;
    }

    const _originalAttach = attach;
    attach = async function (appId, manifestUrl, containerSelector) {
        await _originalAttach(appId, manifestUrl, containerSelector);
        _installHook();
    };

    window.MathTierPreview = { attach, refresh };
})();
