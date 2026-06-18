// Edutrack Math — sub-category breakdown for completion screens.
// Aggregates a finished session by archetype and trap, then renders a
// horizontal bar chart so the student sees exactly where they struggled.
//
// Usage from app.js after scoring a session:
//
//   MathBreakdown.render(containerEl, {
//     questions: [...questions in this session...],
//     correctness: [true, false, true, ...]   // same length, parallel to questions
//   });
//
// Questions without archetype/trapName tags are grouped under "Untagged"
// so the chart never misleads with phantom zeros.

(function () {

    function _bucket(arr, keyFn) {
        const buckets = {};
        arr.forEach((q, i) => {
            const k = keyFn(q) || 'Untagged';
            if (!buckets[k]) buckets[k] = { correct: 0, total: 0 };
            buckets[k].total += 1;
            buckets[k].correct += (arr.correctness && arr.correctness[i]) ? 1 : 0;
        });
        return buckets;
    }

    function _aggregate(questions, correctness) {
        // Attach correctness onto the questions array (read-only side channel)
        const tagged = questions.map((q, i) => ({ q, ok: !!correctness[i] }));
        const byArchetype = {};
        const byTrap = {};
        tagged.forEach(({ q, ok }) => {
            const arch = (q.archetype || 'Untagged').trim();
            const trap = (q.trapName || '').trim();
            if (!byArchetype[arch]) byArchetype[arch] = { correct: 0, total: 0 };
            byArchetype[arch].total += 1;
            if (ok) byArchetype[arch].correct += 1;
            if (trap && !ok) {
                // Only count traps the student actually fell into.
                if (!byTrap[trap]) byTrap[trap] = { hit: 0 };
                byTrap[trap].hit += 1;
            }
        });
        return { byArchetype, byTrap };
    }

    function _sortRows(obj) {
        return Object.keys(obj)
            .map(name => ({ name, ...obj[name] }))
            .sort((a, b) => {
                // Worst accuracy first, then by total count desc as tiebreak.
                const pa = a.total > 0 ? a.correct / a.total : 0;
                const pb = b.total > 0 ? b.correct / b.total : 0;
                if (pa !== pb) return pa - pb;
                return b.total - a.total;
            });
    }

    function _pctColor(pct) {
        if (pct >= 80) return '#10b981'; // green
        if (pct >= 60) return '#f59e0b'; // amber
        return '#ef4444';                // red
    }

    function _escape(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function _stem(q) {
        const raw = (q.question || '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\\\(|\\\)|\\\[|\\\]/g, '')
            .replace(/\$/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        if (raw.length === 0 && q.question_image) return '[Image-based question]';
        if (raw.length === 0) return '(no question text)';
        return raw.length > 120 ? raw.substring(0, 120) + '…' : raw;
    }

    function _answerText(q, userAnswer) {
        if (userAnswer === undefined || userAnswer === null) return '';
        if (q.type === 'grid-in') return String(userAnswer);
        if (Array.isArray(q.options) && typeof userAnswer === 'number') {
            return q.options[userAnswer] || ('Option ' + (userAnswer + 1));
        }
        return String(userAnswer);
    }

    function _correctText(q) {
        if (q.type === 'grid-in') return q.answer || '';
        if (typeof q.correctIndex === 'number' && Array.isArray(q.options) && q.options[q.correctIndex] != null) {
            return q.options[q.correctIndex];
        }
        if (q.answer != null) return String(q.answer);
        return '';
    }

    function render(container, opts) {
        if (!container) return;
        const questions = (opts && opts.questions) || [];
        const correctness = (opts && opts.correctness) || [];
        if (questions.length === 0) {
            container.innerHTML = '';
            return;
        }
        const { byArchetype, byTrap } = _aggregate(questions, correctness);
        const archRows = _sortRows(byArchetype);
        const trapRows = Object.keys(byTrap)
            .map(name => ({ name, hit: byTrap[name].hit }))
            .sort((a, b) => b.hit - a.hit)
            .slice(0, 5);

        let html = `
            <style>
                .mb-section { margin-top: 20px; }
                .mb-title { font-size: 0.92rem; color: #94a3b8;
                    text-transform: uppercase; letter-spacing: 0.08em;
                    margin: 0 0 10px; font-weight: 700; }
                .mb-row { display: grid; grid-template-columns: 1fr auto;
                    gap: 12px; align-items: center; margin-bottom: 8px;
                    font-size: 0.92rem; }
                .mb-row-label { min-width: 0; overflow: hidden;
                    text-overflow: ellipsis; white-space: nowrap;
                    color: #e2e8f0; }
                .mb-row-count { color: #94a3b8; font-variant-numeric: tabular-nums;
                    font-size: 0.85rem; }
                .mb-row-bar { grid-column: 1 / -1; height: 6px;
                    background: rgba(255,255,255,0.06); border-radius: 999px;
                    overflow: hidden; }
                .mb-row-fill { height: 100%; border-radius: 999px; transition: width .4s ease; }
                .mb-trap { display: flex; justify-content: space-between;
                    padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.04);
                    font-size: 0.9rem; color: #e2e8f0; }
                .mb-trap:last-child { border-bottom: 0; }
                .mb-trap-count { color: #f87171; font-weight: 700;
                    font-variant-numeric: tabular-nums; }
                .mb-empty { color: #64748b; font-size: 0.88rem; font-style: italic; }
                .mb-missed { padding: 10px 0;
                    border-bottom: 1px solid rgba(255,255,255,0.04);
                    font-size: 0.88rem; }
                .mb-missed:last-child { border-bottom: 0; }
                .mb-missed-stem { color: #e2e8f0; margin-bottom: 6px; line-height: 1.45; }
                .mb-missed-answers { display: flex; gap: 14px;
                    font-size: 0.82rem; flex-wrap: wrap;
                    font-variant-numeric: tabular-nums; }
                .mb-missed-yours { color: #f87171; }
                .mb-missed-correct { color: #10b981; }
                .mb-missed-label { color: #94a3b8; margin-right: 4px; }
            </style>
            <div class="mb-section">
                <h4 class="mb-title">By archetype</h4>
        `;
        archRows.forEach(r => {
            const pct = r.total > 0 ? Math.round((r.correct / r.total) * 100) : 0;
            html += `
                <div class="mb-row">
                    <span class="mb-row-label" title="${_escape(r.name)}">${_escape(r.name)}</span>
                    <span class="mb-row-count">${r.correct}/${r.total} · ${pct}%</span>
                    <div class="mb-row-bar"><div class="mb-row-fill" style="width:${pct}%;background:${_pctColor(pct)};"></div></div>
                </div>`;
        });
        html += '</div>';

        html += '<div class="mb-section"><h4 class="mb-title">Traps you fell into</h4>';
        if (trapRows.length === 0) {
            html += '<div class="mb-empty">No traps triggered this set. </div>';
        } else {
            trapRows.forEach(t => {
                html += `<div class="mb-trap">
                    <span>${_escape(t.name)}</span>
                    <span class="mb-trap-count">×${t.hit}</span>
                </div>`;
            });
        }
        html += '</div>';

        // Missed list with answer-vs-correct, only if caller passed userAnswers.
        const userAnswers = opts.userAnswers;
        if (Array.isArray(userAnswers)) {
            const missed = [];
            questions.forEach((q, i) => {
                if (correctness[i]) return;
                const userA = userAnswers[i];
                if (userA === undefined || userA === null) return;
                missed.push({
                    q,
                    userText: _answerText(q, userA),
                    correctText: _correctText(q)
                });
            });
            if (missed.length > 0) {
                html += '<div class="mb-section"><h4 class="mb-title">Where you slipped</h4>';
                missed.forEach(m => {
                    const yours = m.userText ? _escape(m.userText) : '<em>blank</em>';
                    html += `<div class="mb-missed">
                        <div class="mb-missed-stem">${_escape(_stem(m.q))}</div>
                        <div class="mb-missed-answers">
                            <span class="mb-missed-yours"><span class="mb-missed-label">You:</span>${yours}</span>
                            <span class="mb-missed-correct"><span class="mb-missed-label">Correct:</span>${_escape(m.correctText)}</span>
                        </div>
                    </div>`;
                });
                html += '</div>';
            }
        }

        container.innerHTML = html;
    }

    window.MathBreakdown = { render };
})();
