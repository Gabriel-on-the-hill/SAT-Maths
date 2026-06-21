// Edutrack Math — SHARED ENGINE (one source of truth for all sub-apps).
// Each app sets window.APP_CONFIG = { appId } in its index.html, then loads
// this file instead of a per-app app.js. Handles image, text, letter-answer,
// and grid-in questions uniformly.
(function () {
    const APP_ID = (window.APP_CONFIG && window.APP_CONFIG.appId) || 'Core_Geometry_App';
    const state = {
        playlist: [],            // The array of topics to cover
        currentTopicIdx: 0,      // Index in the playlist
        currentSlideIdx: 0,      // Index within the current topic's question set
        currentQuestions: [],    // Reference to active set

        // Session Accumulators
        allQuestions: [],        // Flattened list for final calculation/review
        userAnswers: [],         // Global index mapped

        currentModule: null,     // 'guided', 'independent', etc.
        isExamMode: false,
        isHardMode: false,
        smartMode: false,
        isRetrySession: false,

        timeRemaining: 900,
        timerInterval: null,
        reviewIndex: 0,
        questionStartTime: 0,
        sessionStartTime: 0,

        // UNIQUE SESSION ID (Generated per page load) to group concurrent student data
        sessionId: 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    };


    // Image-only question support: every question in this app uses a
    // PNG (question_image) instead of HTML text. These helpers tolerate both.
    function _renderQContent(q) {
        if (q && q.question && String(q.question).trim()) return q.question;
        if (q && q.question_image) {
            return '<img src="' + q.question_image + '" alt="Question" class="full-q-image" style="max-width:100%;height:auto;display:block;margin:0 auto;">';
        }
        return '<em>(question content missing)</em>';
    }
    function _cleanQText(q) {
        const raw = (q && q.question ? String(q.question) : '').replace(/<[^>]*>?/gm, '').replace(/\(/g, '').replace(/\)/g, '').replace(/$/g, '').trim();
        if (raw) return raw;
        if (q && q.question_image) {
            const file = String(q.question_image).split('/').pop().replace(/.[^.]+$/, '');
            return '[Image: ' + file + ']';
        }
        return '[no content]';
    }

    const dom = {
        startScreen: document.getElementById('startScreen'),
        introScreen: document.getElementById('introScreen'),
        quiz: document.getElementById('quiz'),
        endScreen: document.getElementById('endScreen'),
        reviewScreen: document.getElementById('reviewScreen'),

        introTitle: document.querySelector('#introScreen h2'),
        introCards: document.getElementById('playlistIntro'),
        startPracticeBtn: document.getElementById('startPracticeBtn'),
        introBackBtn: document.getElementById('introBackBtn'),

        examModeToggle: document.getElementById('examModeToggle'),
        hardModeToggle: document.getElementById('hardModeToggle'),
        smartModeToggle: document.getElementById('smartModeToggle'),

        activeTimer: document.getElementById('timerDisplay'),
        progressText: document.getElementById('progress'),
        difficultyBadge: document.getElementById('difficultyBadge') || { textContent: '' },
        questionText: document.getElementById('questionText'),
        optionsGrid: document.getElementById('optionsGrid'),

        feedbackArea: document.getElementById('feedbackArea'),
        feedbackStatus: document.getElementById('feedbackStatus'),
        explanationText: document.getElementById('explanationText'),

        prevBtn: document.getElementById('prevSlideBtn'),
        nextBtn: document.getElementById('nextSlideBtn'),

        scoreDisplay: document.getElementById('endScreenScore'),
        reviewBtn: document.getElementById('reviewBtn'),
        retryMissedBtn: document.getElementById('retryMissedBtn'),
        retryMissedCount: document.getElementById('retryMissedCount'),
        returnMenuBtn: document.getElementById('returnMenuBtn'),
        endTitle: document.getElementById('endScreenTitle'),

        resumeBanner: document.getElementById('resumeBanner'),
        resumeLabel: document.getElementById('resumeLabel'),
        resumeBtn: document.getElementById('resumeBtn'),
        resumeDiscardBtn: document.getElementById('resumeDiscardBtn'),

        weakAreaCta: document.getElementById('weakAreaCta'),
        weakAreaBtn: document.getElementById('weakAreaBtn'),
        freshIndependentBtn: document.getElementById('freshIndependentBtn'),
        freshGuidedBtn: document.getElementById('freshGuidedBtn'),
        freshExamBtn: document.getElementById('freshExamBtn'),

        reviewBackBtn: document.getElementById('reviewBackBtn'),
        reviewQuestionText: document.getElementById('reviewQuestionText'),
        reviewOptions: document.getElementById('reviewOptions'),
        reviewFeedbackStatus: document.getElementById('reviewFeedbackStatus'),
        reviewExplanationText: document.getElementById('reviewExplanationText'),
        reviewPrevBtn: document.getElementById('reviewPrevBtn'),
        reviewNextBtn: document.getElementById('reviewNextBtn'),
        reviewProgress: document.getElementById('reviewProgress'),
        globalHomeBtn: document.getElementById('globalHomeBtn')
    };

    // Derive the 0-3 index of the correct answer. Data files store the answer
    // as a letter ("A"-"D") on `q.answer`; this maps it to an index for comparison.
    function getCorrectIndex(q) {
        if (typeof q.correctIndex === 'number') return q.correctIndex;
        if (typeof q.answer === 'string') {
            const idx = ['A', 'B', 'C', 'D'].indexOf(q.answer.trim().toUpperCase());
            return idx;
        }
        return -1;
    }

    // --- SCORE TRACKING UTILITIES ---
    function saveProgress(isFinal = false) {
        // Calculate current score based on all questions answered so far
        let score = 0;
        let answeredCount = 0;
        let detailedScores = []; // Array to hold 1/0 for each question

        // We look at allQuestions (previously answered topics) + currentQuestions (currently active topic)
        const combinedQuestions = [...state.allQuestions, ...state.currentQuestions];

        combinedQuestions.forEach((q, idx) => {
            const userA = state.userAnswers[idx];
            if (userA !== undefined && userA !== null) {
                answeredCount++;
                let earnedPoints = 0;

                if (q.type === 'grid-in') {
                    if (checkGridIn(userA || "", q.answer)) {
                        score++;
                        earnedPoints = 1;
                    }
                } else {
                    if (userA === getCorrectIndex(q)) {
                        score++;
                        earnedPoints = 1;
                    }
                }

                // Strip KaTeX/HTML to make it perfectly readable in Sheets
                const _ct = _cleanQText(q);
                const cleanQuestion = _ct.substring(0, 40) + (_ct.length > 40 ? "..." : "");
                detailedScores.push(`Q${idx + 1}: ${cleanQuestion} (${earnedPoints}/1)`);
            }
        });

        // Don't save if nothing has been answered yet
        if (answeredCount === 0) return;

        const appName = APP_ID;
        const sectionName = state.currentModule
            ? state.currentModule.charAt(0).toUpperCase() + state.currentModule.slice(1)
            : 'Session';
        const fullTopicContext = `Core Geometry | ${sectionName}`;

        const totalPossible = combinedQuestions.length; // Or state.playlist total if we pre-calculate

        // --- OPTION 3: Local Storage ---
        const storageKey = `edutrack_score_${appName}_${fullTopicContext}`;

        let previousHighScore = localStorage.getItem(storageKey);
        const currentPercentage = score / totalPossible;

        const highScoreDisplay = document.getElementById('highScoreDisplay');
        if (previousHighScore) {
            const parsedScore = JSON.parse(previousHighScore);
            const prevPercentage = parsedScore.score / parsedScore.maxScore;

            if (isFinal && currentPercentage > prevPercentage) {
                if (highScoreDisplay) highScoreDisplay.textContent = `New Personal Best! (Previous: ${parsedScore.score}/${parsedScore.maxScore})`;
                localStorage.setItem(storageKey, JSON.stringify({ score: score, maxScore: totalPossible }));
            } else if (isFinal) {
                if (highScoreDisplay) highScoreDisplay.textContent = `Your Personal Best: ${parsedScore.score}/${parsedScore.maxScore}`;
            }
            // If not final but we are saving progress, we still update if it's strictly better
            else if (currentPercentage > prevPercentage) {
                localStorage.setItem(storageKey, JSON.stringify({ score: score, maxScore: totalPossible }));
            }
        } else {
            if (isFinal && highScoreDisplay) highScoreDisplay.textContent = `First attempt recorded!`;
            localStorage.setItem(storageKey, JSON.stringify({ score: score, maxScore: totalPossible }));
        }

        // --- OPTION 2: Google Sheets Tracking ---
        const studentNameInput = document.getElementById('studentName');
        const studentName = (studentNameInput && studentNameInput.value.trim()) ? studentNameInput.value.trim()
            : (window.MathGate && MathGate.currentName && MathGate.currentName()) ? MathGate.currentName()
            : "Unknown Student";

        const scriptURL = ""; // Sheet A retired — sessions now sync via MathSession only (one pipeline). Restore this URL to re-enable.
        const dbStatus = document.getElementById('dbSyncStatus');
        if (isFinal && dbStatus && scriptURL) {
            dbStatus.style.display = 'block';
            dbStatus.textContent = "Saving final score to database...";
            dbStatus.style.color = "var(--primary)";
        }

        const payload = {
            studentName: studentName,
            appName: appName,
            topicName: fullTopicContext + (isFinal ? " (Complete)" : " (In Progress)"),
            score: score,
            maxScore: totalPossible,
            detailedScores: detailedScores.join(" | "), // Ex: Q1: Eq... (1/1) | Q2: 4x... (0/1)
            sessionId: state.sessionId, // Groups all questions from this single session
            timestamp: new Date().toISOString() // Logs exact time of this specific answer
        };

        if (isFinal && scriptURL) fetch(scriptURL, {  // disabled while scriptURL is empty
            method: 'POST',
            body: JSON.stringify(payload)
        })
            .then(response => {
                if (isFinal && dbStatus) {
                    dbStatus.textContent = "Score successfully saved to database!";
                    dbStatus.style.color = "var(--success)";
                }
            })
            .catch(error => {
                if (isFinal && dbStatus) {
                    dbStatus.textContent = "Could not save to database (Check connection).";
                    dbStatus.style.color = "var(--danger)";
                }
            });
    }

    // UTILITIES
    function formatTime(seconds) {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    function triggerMath(element) {
        if (window.renderMathInElement) {
            window.renderMathInElement(element || document.body, {
                delimiters: [
                    { left: '$$', right: '$$', display: true },
                    { left: '$', right: '$', display: false }
                ],
                throwOnError: false
            });
        }
    }

    // CORE ENGINE
    function init() {
        document.querySelectorAll('.module-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const nameInput = document.getElementById('studentName');
                if (!nameInput.value.trim()) {
                    e.preventDefault();
                    nameInput.style.border = "2px solid var(--danger)";
                    nameInput.placeholder = "REQUIRED: Enter your name";
                    nameInput.focus();

                    // Remove the red border once they start typing
                    nameInput.addEventListener('input', function removeWarning() {
                        nameInput.style.border = "";
                        nameInput.placeholder = "E.g., Tracy";
                        nameInput.removeEventListener('input', removeWarning);
                    });

                    return; // Stop execution, name missing
                }

                startPlaylist(btn.dataset.module);
            });
        });

        dom.nextBtn.addEventListener('click', handleNext);
        dom.prevBtn.addEventListener('click', () => {
            if (state.currentSlideIdx > 0) {
                state.currentSlideIdx--;
                renderSlide();
            }
        });

        dom.returnMenuBtn.addEventListener('click', () => location.reload());

        if (dom.globalHomeBtn) {
            dom.globalHomeBtn.addEventListener('click', () => {
                location.reload();
            });
        }
        dom.introBackBtn.addEventListener('click', () => {
            if (state.currentTopicIdx === 0) {
                dom.introScreen.hidden = true;
                dom.startScreen.hidden = false;
            } else {
                // Return to transition logic if we were mid-playlist? 
                // For simplicity, just reload or return to start.
                location.reload();
            }
        });

        dom.startPracticeBtn.addEventListener('click', () => {
            dom.introScreen.hidden = true;
            beginQuizExecution();
        });

        dom.reviewBtn.addEventListener('click', startReview);

        if (dom.retryMissedBtn) {
            dom.retryMissedBtn.addEventListener('click', startRetryMissed);
        }

        dom.reviewBackBtn.addEventListener('click', () => {
            dom.reviewScreen.hidden = true;
            dom.endScreen.hidden = false;
        });

        dom.reviewNextBtn.addEventListener('click', () => {
            if (state.reviewIndex < state.allQuestions.length - 1) {
                state.reviewIndex++;
                renderReviewSlide();
            }
        });

        dom.reviewPrevBtn.addEventListener('click', () => {
            if (state.reviewIndex > 0) {
                state.reviewIndex--;
                renderReviewSlide();
            }
        });

        const copyBtn = document.getElementById('copyBtn');
        if (copyBtn) copyBtn.addEventListener('click', handleCopyWork);

        if (dom.weakAreaBtn) {
            dom.weakAreaBtn.addEventListener('click', startWeakArea);
        }
        if (dom.freshIndependentBtn) {
            dom.freshIndependentBtn.addEventListener('click', startFreshIndependent);
        }
        if (dom.freshGuidedBtn) {
            dom.freshGuidedBtn.addEventListener('click', startFreshGuided);
        }
        if (dom.freshExamBtn) {
            dom.freshExamBtn.addEventListener('click', startFreshExam);
        }

        checkAndShowResume();
        refreshWeakAreaVisibility();
    }

    function handleCopyWork() {
        const nameInput = document.getElementById('studentName').value.trim();
        const name = nameInput ? nameInput : "Student";
        const date = new Date().toLocaleDateString();

        let score = 0;
        state.allQuestions.forEach((q, idx) => {
            if (q.type === 'grid-in') {
                if (checkGridIn(state.userAnswers[idx] || "", q.answer)) score++;
            } else {
                if (state.userAnswers[idx] === getCorrectIndex(q)) score++;
            }
        });

        let outputText = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nSAT PLAYLIST REPORT\nStudent: ${name}\nDate: ${date}\nFinal Score: ${score} / ${state.allQuestions.length}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

        state.allQuestions.forEach((q, idx) => {
            const userA = state.userAnswers[idx];
            let isCorrect = false;
            if (q.type === 'grid-in') {
                isCorrect = checkGridIn(userA || "", q.answer);
            } else {
                isCorrect = userA === getCorrectIndex(q);
            }

            // Strip KaTeX/HTML for raw text copy
            const cleanQuestion = _cleanQText(q);
            outputText += `Q${idx + 1}: ${cleanQuestion}\n`;

            if (userA === undefined || userA === null) {
                outputText += `  Status: UNANSWERED\n\n`;
            } else {
                const userChoice = q.type === 'grid-in' ? userA : ['A', 'B', 'C', 'D'][userA];
                outputText += `  Selected: ${userChoice}\n`;
                outputText += `  Status: ${isCorrect ? 'Correct' : 'Incorrect'}\n\n`;
            }
        });

        outputText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nEnd of Report\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

        // Clipboard logic
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(outputText).then(() => {
                const msgEl = document.getElementById('submitMsg');
                if (msgEl) {
                    msgEl.innerText = "Copied to clipboard!";
                    msgEl.classList.add("msg-success");
                    setTimeout(() => { msgEl.innerText = ''; }, 3000);
                }
            });
        }
    }

    function startPlaylist(moduleKey) {
        state.isExamMode = dom.examModeToggle.checked;
        state.isHardMode = dom.hardModeToggle.checked;
        state.smartMode = !!(dom.smartModeToggle && dom.smartModeToggle.checked);
        state.isRetrySession = false;
        state.currentModule = moduleKey;

        // 1. Normalize playlist shape. Core_Geometry's data declares a flat object
        //    { guided: [...], independent: [...], ... } rather than an array of topics.
        //    Wrap it in a single synthetic topic so downstream loadTopic() works.
        const raw = window.PLAYLIST;
        let sourcePlaylist;
        if (Array.isArray(raw)) {
            sourcePlaylist = raw;
        } else if (raw && typeof raw === 'object') {
            sourcePlaylist = [{
                id: 'core_geometry',
                title: 'Core Geometry',
                introText: 'Area, volume, lines, angles, and triangles. Identify the formula first, then plug in.',
                questions: raw
            }];
        } else {
            sourcePlaylist = [];
        }
        state.currentTopicIdx = 0;
        state.allQuestions = [];
        state.userAnswers = [];

        if (sourcePlaylist.length === 0) {
            alert("Payload empty. Ensure questions.js is loaded.");
            return;
        }

        if (state.smartMode && window.MathProgress) {
            const flat = [];
            sourcePlaylist.forEach(topic => {
                (topic.questions[moduleKey] || []).forEach(q => flat.push(q));
            });
            const ordered = window.MathProgress.prioritize(APP_ID, flat);
            state.playlist = [{
                id: 'smart_drill',
                title: 'Smart Drill (Weak Questions First)',
                introText: 'Questions you got wrong before come first, then unseen, then mastered. Goal: shrink your wrong list.',
                questions: { [moduleKey]: ordered }
            }];
        } else {
            state.playlist = sourcePlaylist;
        }

        // 2. Hide Start
        dom.startScreen.hidden = true;

        // 3. Start Topic 1
        loadTopic(0);
    }

    function loadTopic(index) {
        state.currentTopicIdx = index;
        if (index === 0) state.sessionStartTime = Date.now();
        const topic = state.playlist[index];
        const moduleKey = state.currentModule;

        // Determine the questions for this topic
        // (Hard Mode is currently handled inside the payload via distribution, 
        //  but we can add logic here if we had different keys).
        state.currentQuestions = topic.questions[moduleKey] || [];
        // Hard-only mode: restrict to Hard-difficulty questions (graceful fallback
        // to the full set if this module has none tagged Hard).
        if (state.isHardMode) {
            const _hardOnly = (state.currentQuestions || []).filter(q => q && String(q.difficulty || '').toLowerCase() === 'hard');
            if (_hardOnly.length > 0) state.currentQuestions = _hardOnly;
        }
        state.currentSlideIdx = 0;

        // Render the Concept Intro dynamically
        dom.introTitle.textContent = `Concept: ${topic.title}`;
        dom.introCards.innerHTML = `
            <div class="concept-card">
                <div class="card-title">Strategy</div>
                <p>${topic.introText}</p>
            </div>
        `;

        dom.introScreen.hidden = false;
        triggerMath(dom.introScreen);
    }

    function beginQuizExecution() {
        dom.quiz.hidden = false;

        // If it's the very first topic, start global timer if in Exam mode
        if (state.currentTopicIdx === 0 && (state.isExamMode || state.customTimed)) {
            startTimer();
            dom.activeTimer.hidden = false;
        }

        renderSlide();
    }

    function startTimer() {
// Scale the clock to the session length (~90s per question = realistic SAT
        // pace), instead of a flat 20 minutes regardless of how many questions.
        const _mod = state.currentModule;
        let _n = 0;
        (state.playlist || []).forEach(t => { _n += ((t.questions && t.questions[_mod]) || []).length; });
        // Per-question seconds is tutor-adjustable (set on the hub); default 90.
        let _perQ = 90;
        try { const _v = parseInt(localStorage.getItem('edutrack_timer_per_q'), 10); if (_v >= 10 && _v <= 600) _perQ = _v; } catch (e) {}
        if (state.customTotalSeconds) {
            state.timeRemaining = state.customTotalSeconds;
        } else if (window.APP_CONFIG && window.APP_CONFIG.examTotalSeconds) {
            state.timeRemaining = window.APP_CONFIG.examTotalSeconds;
        } else {
            state.timeRemaining = _n > 0 ? _n * _perQ : 1200;
        }
        dom.activeTimer.textContent = formatTime(state.timeRemaining);
        state.timerInterval = setInterval(() => {
            state.timeRemaining--;
            dom.activeTimer.textContent = formatTime(state.timeRemaining);
            if (state.timeRemaining <= 60) dom.activeTimer.classList.add('timer-danger');
            if (state.timeRemaining <= 0) finishPlaylist();
        }, 1000);
    }

    function renderSlide() {
        const q = state.currentQuestions[state.currentSlideIdx];
        state.questionStartTime = Date.now();
        saveSession();

        // Progress tracking
        const topicName = state.playlist[state.currentTopicIdx].title;
        dom.progressText.textContent = `${topicName} | Slide ${state.currentSlideIdx + 1} of ${state.currentQuestions.length}`;

        // Update Difficulty Badge
        if (dom.difficultyBadge && q.difficulty) {
            dom.difficultyBadge.innerText = q.difficulty;
            dom.difficultyBadge.className = `difficulty-badge diff-${q.difficulty.toLowerCase()}`;
        }

        // Question markup
        dom.questionText.innerHTML = _renderQContent(q);
        dom.optionsGrid.innerHTML = '';
        dom.feedbackArea.hidden = true;

        if (q.type === 'grid-in') {
            const container = document.createElement('div');
            container.className = 'grid-in-container';
            container.innerHTML = `
                <input type="text" id="grid-in-input" placeholder="Type answer..." class="grid-in-input">
                <button id="grid-in-submit" class="grid-in-submit primary-btn">Submit Answer</button>
            `;
            dom.optionsGrid.appendChild(container);

            const input = container.querySelector('#grid-in-input');
            const submit = container.querySelector('#grid-in-submit');

            // Find if already answered in global tracker
            const globalIdx = state.allQuestions.length + state.currentSlideIdx;
            if (state.userAnswers[globalIdx] !== undefined) {
                input.value = state.userAnswers[globalIdx];
                input.disabled = true;
                submit.disabled = true;
                if (!state.isExamMode && state.currentModule !== 'homework') {
                    const isCorrect = checkGridIn(input.value, q.answer);
                    showFeedback(isCorrect);
                }
            }

            submit.addEventListener('click', () => {
                const val = input.value.trim();
                if (!val) return;
                state.userAnswers[globalIdx] = val;
                input.disabled = true;
                submit.disabled = true;

                const isCorrect = checkGridIn(val, q.answer);
                recordToLedger(q, isCorrect);

                // Save progress immediately
                saveProgress(false);

                if (!state.isExamMode && state.currentModule !== 'homework') {
                    showFeedback(isCorrect);
                }
            });
        } else {
            const letters = ['A', 'B', 'C', 'D'];
            letters.forEach((letter, idx) => {
                const btn = document.createElement('button');
                btn.className = 'option-btn';
                btn.innerHTML = (`<span class="opt-letter">${letter}</span>` + ((q.options && q.options[idx] != null && q.options[idx] !== "") ? ` <span class="opt-text">${q.options[idx]}</span>` : ""));

                const globalIdx = state.allQuestions.length + state.currentSlideIdx;
                if (state.userAnswers[globalIdx] === idx) {
                    btn.classList.add('selected');
                    if (!state.isExamMode && state.currentModule !== 'homework') {
                        const isCorrect = idx === getCorrectIndex(q);
                        btn.classList.add(isCorrect ? 'correct' : 'wrong');
                        showFeedback(isCorrect);
                        disableOptions();
                    }
                }

                btn.addEventListener('click', () => {
                    if (state.userAnswers[globalIdx] !== undefined && !state.isExamMode && state.currentModule !== 'homework') return;

                    state.userAnswers[globalIdx] = idx;
                    const isCorrect = idx === getCorrectIndex(q);
                    recordToLedger(q, isCorrect);

                    // Save progress immediately
                    saveProgress(false);

                    if (!state.isExamMode && state.currentModule !== 'homework') {
                        btn.classList.add(isCorrect ? 'correct' : 'wrong');
                        disableOptions();
                        showFeedback(isCorrect);
                    } else {
                        Array.from(dom.optionsGrid.children).forEach(b => b.classList.remove('selected'));
                        btn.classList.add('selected');
                    }
                });
                dom.optionsGrid.appendChild(btn);
            });
        }

        dom.prevBtn.disabled = (state.currentSlideIdx === 0);
        dom.nextBtn.textContent = (state.currentSlideIdx === state.currentQuestions.length - 1) ? 'Continue →' : 'Next Question →';

        triggerMath(dom.quiz);
    }

    function checkGridIn(userVal, correctVal) {
        if (correctVal === null || correctVal === undefined || correctVal === '') return false;
        const clean = (val) => (val == null ? '' : val.toString()).toLowerCase().replace(/\s+/g, '').replace(/\.$/, '');
        const u = clean(userVal);
        const candidates = correctVal.toString().split('|').map(clean).filter(Boolean);
        return candidates.some(c => u === c || (!isNaN(u) && !isNaN(c) && parseFloat(u) === parseFloat(c)));
    }

    function hasAnswerKey(q) {
        if (!q) return false;
        if (q.type === 'grid-in') return !!(q.answer && q.answer.toString().trim());
        const ci = (typeof q.correctIndex === 'number') ? q.correctIndex : getCorrectIndex(q);
        return typeof ci === 'number' && ci >= 0;
    }

    function recordToLedger(q, isCorrect) {
        if (!window.MathProgress || !q || !q.id) return;
        const source = state.isRetrySession ? 'retry'
            : state.isExamMode ? 'exam'
            : state.currentModule;
        const elapsedMs = state.questionStartTime > 0 ? (Date.now() - state.questionStartTime) : 0;
        window.MathProgress.recordAnswer(q._appId || APP_ID, q.id, isCorrect, source, elapsedMs);
    }

    // --- SESSION RESUME ---
    function snapshotState() {
        return {
            currentModule: state.currentModule,
            currentTopicIdx: state.currentTopicIdx,
            currentSlideIdx: state.currentSlideIdx,
            playlist: state.playlist,
            currentQuestions: state.currentQuestions,
            allQuestions: state.allQuestions,
            userAnswers: state.userAnswers,
            isExamMode: state.isExamMode,
            isHardMode: state.isHardMode,
            smartMode: state.smartMode,
            isRetrySession: state.isRetrySession
        };
    }

    function saveSession() {
        if (!window.MathSession) return;
        if (!state.currentModule || !state.playlist || state.playlist.length === 0) return;
        window.MathSession.save(APP_ID, snapshotState());
    }

    function clearSession() {
        if (window.MathSession) window.MathSession.clear(APP_ID);
    }

    function startWeakArea() {
        if (!window.MathProgress) return;

        const sourcePlaylist = window.PLAYLIST || [];
        const seen = new Set();
        const pool = [];

        const collectFromObject = (raw) => {
            if (!raw || typeof raw !== 'object') return;
            Object.values(raw).forEach(qs => {
                if (!Array.isArray(qs)) return;
                qs.forEach(q => {
                    if (q && q.id && !seen.has(q.id)) {
                        seen.add(q.id);
                        pool.push(q);
                    }
                });
            });
        };

        if (Array.isArray(sourcePlaylist)) {
            sourcePlaylist.forEach(topic => collectFromObject(topic && topic.questions));
        } else {
            collectFromObject(sourcePlaylist);
        }

        const selected = window.MathProgress.buildWeakAreaSet(APP_ID, pool, 10);
        if (selected.length === 0) {
            alert('No questions available.');
            return;
        }

        state.isExamMode = dom.examModeToggle.checked;
        state.isHardMode = false;
        state.smartMode = false;
        state.isRetrySession = false;
        state.currentModule = 'homework';
        state.currentTopicIdx = 0;
        state.allQuestions = [];
        state.userAnswers = [];

        state.playlist = [{
            id: 'weak_area',
            title: 'Weak-Area Drill',
            introText: 'Ten questions drawn from your weakest archetypes. Same conditions as Section C homework: no feedback during the quiz, full breakdown at the end.',
            questions: { homework: selected }
        }];

        dom.startScreen.hidden = true;
        loadTopic(0);
    }

    function refreshWeakAreaVisibility() {
        if (!dom.weakAreaCta || !window.MathProgress) return;
        const attempted = window.MathProgress.countAttempted(APP_ID);
        dom.weakAreaCta.hidden = (attempted < 5);
    }

    function _buildCrossModulePool() {
        const sourcePlaylist = window.PLAYLIST || [];
        const seen = new Set();
        const pool = [];
        const collectFromObject = (raw) => {
            if (!raw || typeof raw !== 'object') return;
            Object.values(raw).forEach(qs => {
                if (!Array.isArray(qs)) return;
                qs.forEach(q => {
                    if (q && q.id && !seen.has(q.id)) {
                        seen.add(q.id);
                        pool.push(q);
                    }
                });
            });
        };
        if (Array.isArray(sourcePlaylist)) {
            sourcePlaylist.forEach(topic => collectFromObject(topic && topic.questions));
        } else {
            collectFromObject(sourcePlaylist);
        }
        return pool;
    }

    function _runPersonalisedSession(opts) {
        const selected = opts.selected;
        if (!selected || selected.length === 0) { alert('No questions available.'); return; }

        state.isExamMode = dom.examModeToggle.checked;
        state.isHardMode = false;
        state.smartMode = false;
        state.isRetrySession = false;
        state.currentModule = opts.moduleKey;
        state.currentTopicIdx = 0;
        state.allQuestions = [];
        state.userAnswers = [];

        state.playlist = [{
            id: opts.playlistMeta.id,
            title: opts.playlistMeta.title,
            introText: opts.playlistMeta.introText,
            questions: { [opts.moduleKey]: selected }
        }];

        dom.startScreen.hidden = true;
        loadTopic(0);
    }

    function startFreshIndependent() {
        if (!window.MathProgress) return;
        const pool = _buildCrossModulePool();
        const selected = window.MathProgress.buildBalancedSet(APP_ID, pool, { count: (window.APP_CONFIG && window.APP_CONFIG.freshCount) || 8, daysToAvoid: 7, distribution: (window.APP_CONFIG && window.APP_CONFIG.distribution) });
        _runPersonalisedSession({
            selected,
            moduleKey: 'independent',
            playlistMeta: {
                id: 'fresh_independent',
                title: 'Fresh Independent Set',
                introText: 'A balanced eight-question set drawn from the full pool — proportional difficulty mix, skipping questions you saw in the last week. Section B conditions: instant feedback as you go.'
            }
        });
    }

    function startFreshGuided() {
        if (!window.MathProgress) return;
        const pool = _buildCrossModulePool();
        const selected = window.MathProgress.buildCuratedProgression(APP_ID, pool, { count: 10, distribution: (window.APP_CONFIG && window.APP_CONFIG.distribution) });
        _runPersonalisedSession({
            selected,
            moduleKey: 'guided',
            playlistMeta: {
                id: 'fresh_guided',
                title: 'Fresh Guided Set',
                introText: 'Ten questions in an easy → medium → hard progression. New material wherever possible, feedback shown as you go. Use this when you want a fresh tutor-style walk-through.'
            }
        });
    }

    function startFreshExam() {
        if (!window.MathProgress) return;
        const pool = _buildCrossModulePool();
        const selected = window.MathProgress.buildExamSample(APP_ID, pool, { count: (window.APP_CONFIG && window.APP_CONFIG.examCount) || 15 });
        _runPersonalisedSession({
            selected,
            moduleKey: 'exam',
            playlistMeta: {
                id: 'fresh_exam',
                title: 'Fresh Final Assessment',
                introText: 'Fifteen questions sampled in proportion to the SAT archetype mix. Exam conditions: no feedback during the quiz, full breakdown at the end. Treat it like a checkpoint.'
            }
        });
    }

    // ---- Mock SAT exam mode (cross-app, SAT-weighted, queue-aware) ----
    // Requires window.EXAM_POOLS = [{ appId, domain, playlist }, ...] (set by exam.html).
    function buildMockExam() {
        const pools = window.EXAM_POOLS || [];
        const byDomain = {};
        pools.forEach(p => {
            const flat = [];
            const seen = new Set();
            const _raw = p.playlist;
            const _topics = Array.isArray(_raw) ? _raw : ((_raw && typeof _raw === 'object') ? [{ questions: _raw }] : []);
            _topics.forEach(topic => {
                const qs = (topic && topic.questions) || {};
                Object.values(qs).forEach(arr => {
                    if (!Array.isArray(arr)) return;
                    arr.forEach(q => {
                        if (q && q.id && !seen.has(q.id)) {
                            seen.add(q.id);
                            const qq = Object.assign({}, q, { _appId: p.appId, _domain: p.domain });
                            // exam.html is served from root, so re-root app-relative image paths
                            if (typeof qq.question === 'string') qq.question = qq.question.replace(/src="assets\//g, 'src="' + p.appId + '/assets/');
                            if (typeof qq.question_image === 'string' && qq.question_image.indexOf('assets/') === 0) qq.question_image = p.appId + '/' + qq.question_image;
                            flat.push(qq);
                        }
                    });
                });
            });
            // queue-aware: missed/unseen first, mastered to the back (per source app)
            const ordered = (window.MathProgress && window.MathProgress.prioritize)
                ? window.MathProgress.prioritize(p.appId, flat) : flat;
            (byDomain[p.domain] = byDomain[p.domain] || []).push(ordered); // array of per-app lists
        });
        const quota = (window.APP_CONFIG && window.APP_CONFIG.examQuota) || {
            'Algebra': 8, 'Advanced Math': 8,
            'Problem-Solving and Data Analysis': 3, 'Geometry and Trigonometry': 3
        };
        const exam = [];
        Object.keys(quota).forEach(dom => {
            const lists = byDomain[dom] || [];
            // round-robin across the domain's apps, preserving each app's weakest-first order
            const merged = [];
            let idx = 0, more = true;
            while (more) { more = false; lists.forEach(l => { if (idx < l.length) { merged.push(l[idx]); more = true; } }); idx++; }
            for (let i = 0; i < quota[dom] && i < merged.length; i++) exam.push(merged[i]);
        });
        // interleave domains so they're not clustered
        for (let i = exam.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const t = exam[i]; exam[i] = exam[j]; exam[j] = t;
        }
        return exam;
    }

    function startMockExam() {
        if (!window.MathProgress) { alert('Progress module missing.'); return; }
        const selected = buildMockExam();
        if (!selected.length) { alert('No questions available for the exam.'); return; }
        state.isExamMode = true;
        state.isHardMode = false;
        state.smartMode = false;
        state.isRetrySession = false;
        state.currentModule = 'exam';
        state.currentTopicIdx = 0;
        state.allQuestions = [];
        state.userAnswers = [];
        state.playlist = [{
            id: 'mock_sat',
            title: 'Mock SAT — Math (Single Module)',
            introText: 'Exam conditions: ' + selected.length + ' questions, timed, no feedback until the end. Drawn across all domains by SAT weighting — your weakest and least-recent questions come first.',
            questions: { exam: selected }
        }];
        dom.startScreen.hidden = true;
        loadTopic(0);
    }

    // ───────── Custom Practice (cross-topic, difficulty-filtered, mastery queue) ─────────
    // Gather every question matching the chosen difficulties, tagged with its source
    // app + domain, with image paths re-rooted for the root-level custom page.
    // Canonical skill label for a question. Falls back to 'Untagged' so that a
    // question without an archetype is never silently unreachable — the picker
    // uses this exact same function, guaranteeing every question maps to a box.
    function _skillOf(q) { return (q && q.archetype) ? String(q.archetype) : 'Untagged'; }

    function _customCandidates(difficulties, skills) {
        const pools = window.EXAM_POOLS || [];
        const diffs = (difficulties || []).map(function (d) { return String(d).toLowerCase(); });
        const skillSet = (skills && skills.length) ? new Set(skills.map(function (s) { return String(s); })) : null;
        const out = []; const seen = new Set();
        pools.forEach(function (p) {
            const raw = p.playlist;
            const topics = Array.isArray(raw) ? raw : ((raw && typeof raw === 'object') ? [{ questions: raw }] : []);
            topics.forEach(function (t) {
                const qs = (t && t.questions) || {};
                Object.values(qs).forEach(function (arr) {
                    if (!Array.isArray(arr)) return;
                    arr.forEach(function (q) {
                        if (!q || !q.id) return;
                        const key = p.appId + ':' + q.id;
                        if (seen.has(key)) return; seen.add(key);
                        const d = String(q.difficulty || '').toLowerCase();
                        if (diffs.length && diffs.indexOf(d) < 0) return;
                        if (skillSet && !skillSet.has(_skillOf(q))) return;
                        const qq = Object.assign({}, q, { _appId: p.appId, _domain: p.domain });
                        if (typeof qq.question === 'string') qq.question = qq.question.replace(/src="assets\//g, 'src="' + p.appId + '/assets/');
                        if (typeof qq.question_image === 'string' && qq.question_image.indexOf('assets/') === 0) qq.question_image = p.appId + '/' + qq.question_image;
                        out.push(qq);
                    });
                });
            });
        });
        return out;
    }

    function _nonUniform(vals) {
        if (!vals || vals.length < 2) return false;
        for (let i = 1; i < vals.length; i++) if (vals[i] !== vals[0]) return true;
        return false;
    }

    // Largest-remainder apportionment of `count` across weighted keys.
    function _quota(weights, count) {
        const keys = Object.keys(weights);
        const tot = keys.reduce(function (a, k) { return a + (weights[k] || 0); }, 0);
        if (tot <= 0) { const z = {}; keys.forEach(function (k) { z[k] = 0; }); return z; }
        const parts = keys.map(function (k) {
            const exact = count * (weights[k] || 0) / tot;
            return { k: k, n: Math.floor(exact), r: exact - Math.floor(exact) };
        });
        let assigned = parts.reduce(function (a, p) { return a + p.n; }, 0);
        parts.sort(function (a, b) { return b.r - a.r; });
        let i = 0;
        while (assigned < count && parts.length) { parts[i % parts.length].n++; assigned++; i++; }
        const out = {}; parts.forEach(function (p) { out[p.k] = p.n; }); return out;
    }

    // Choose `count` from queue-ordered `active`, approximating the difficulty and
    // skill marginals. A dimension only constrains when its weights are non-uniform,
    // so equal weights (the default) reproduce the plain weakest-first slice. Quotas
    // that the pool can't satisfy are backfilled in queue order, so the set always
    // reaches `count` when enough questions exist.
    function _allocate(active, count, diffW, skillW) {
        const diffOn = diffW && _nonUniform(Object.keys(diffW).map(function (k) { return diffW[k]; }));
        const skillOn = skillW && _nonUniform(Object.keys(skillW).map(function (k) { return skillW[k]; }));
        if (!diffOn && !skillOn) return active.slice(0, count);
        const rd = diffOn ? _quota(diffW, count) : null;
        const rs = skillOn ? _quota(skillW, count) : null;
        const picked = []; const used = new Set();
        function dk(q) { return String(q.difficulty || ''); }
        function sk(q) { return _skillOf(q); }
        function take(q) { picked.push(q); used.add(q); if (rd && rd[dk(q)] > 0) rd[dk(q)]--; if (rs && rs[sk(q)] > 0) rs[sk(q)]--; }
        // Pass 1: satisfy both marginals at once.
        active.forEach(function (q) {
            if (picked.length >= count || used.has(q)) return;
            if (rd && !(rd[dk(q)] > 0)) return;
            if (rs && !(rs[sk(q)] > 0)) return;
            take(q);
        });
        // Pass 2: satisfy the difficulty marginal alone.
        if (rd) active.forEach(function (q) {
            if (picked.length >= count || used.has(q)) return;
            if (rd[dk(q)] > 0) take(q);
        });
        // Pass 3: satisfy the skill marginal alone.
        if (rs) active.forEach(function (q) {
            if (picked.length >= count || used.has(q)) return;
            if (rs[sk(q)] > 0) take(q);
        });
        // Pass 4: backfill in queue order to reach the requested count.
        active.forEach(function (q) {
            if (picked.length >= count || used.has(q)) return;
            take(q);
        });
        return picked;
    }

    // Build a sitting: exclude mastered (auto-resurfaces after the 21-day decay),
    // then order unseen -> needs-work (net<=0) -> answered-once (net>=1), least-recent first.
    function buildCustomSet(opts) {
        opts = opts || {};
        const MP = window.MathProgress;
        const all = _customCandidates(opts.difficulties, opts.skills);
        let mastered = 0; const active = [];
        all.forEach(function (q) {
            if (MP && MP.isMastered(q._appId, q.id)) { mastered++; return; }
            active.push(q);
        });
        function tier(q) {
            const r = MP ? MP.getRecord(q._appId, q.id) : { attempts: 0, correct: 0, wrong: 0 };
            if (!r.attempts) return 0;                       // fresh / unseen
            return ((r.correct || 0) - (r.wrong || 0)) <= 0 ? 1 : 2; // needs-work, then answered-once
        }
        active.sort(function (a, b) {
            const ta = tier(a), tb = tier(b);
            if (ta !== tb) return ta - tb;
            const ra = MP ? MP.getRecord(a._appId, a.id) : { lastSeen: 0 };
            const rb = MP ? MP.getRecord(b._appId, b.id) : { lastSeen: 0 };
            return (ra.lastSeen || 0) - (rb.lastSeen || 0);
        });
        const count = opts.count || 10;
        const selected = _allocate(active, count, opts.diffWeights, opts.skillWeights);
        return { selected: selected, remaining: active.length, mastered: mastered, total: all.length };
    }

    function resetCustomSet(opts) {
        if (!window.MathProgress || !window.MathProgress.resetRecords) return 0;
        const pairs = _customCandidates((opts || {}).difficulties, (opts || {}).skills).map(function (q) { return { appId: q._appId, qid: q.id }; });
        return window.MathProgress.resetRecords(pairs);
    }

    // ── Skill picker (Custom Practice) ──────────────────────────────
    // Friendly topic names, matching the hub cards.
    var _appLabels = {
        Linear_Equations_App: 'Linear Equations (One Variable)',
        Linear_Functions_App: 'Linear Functions',
        Nonlinear_Functions_App: 'Nonlinear Functions',
        Systems_and_Expressions_App_v2: 'Systems & Expressions',
        Proportionality_App: 'Proportionality',
        Statistical_Reasoning_App: 'Statistical Reasoning',
        Data_Analysis_Probability_App: 'Data Analysis & Probability',
        Core_Geometry_App: 'Core Geometry',
        Analytical_Geometry_App: 'Analytical Geometry & Trig'
    };

    function _esc(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    // Builds Domain -> Topic(app) -> Skill(archetype) counts straight from the
    // live pools, using the SAME traversal + dedup + _skillOf() as the filter.
    // This guarantees the picker and the filter see exactly the same questions.
    function _skillTaxonomy() {
        const pools = window.EXAM_POOLS || [];
        const byDomain = {};
        pools.forEach(function (p) {
            const raw = p.playlist;
            const topics = Array.isArray(raw) ? raw : ((raw && typeof raw === 'object') ? [{ questions: raw }] : []);
            const dom = p.domain || 'Other';
            const dEntry = byDomain[dom] || (byDomain[dom] = { domain: dom, apps: {} });
            const aEntry = dEntry.apps[p.appId] || (dEntry.apps[p.appId] = { appId: p.appId, label: _appLabels[p.appId] || p.appId, archetypes: {}, count: 0, _seen: new Set() });
            topics.forEach(function (t) {
                const qs = (t && t.questions) || {};
                Object.values(qs).forEach(function (arr) {
                    if (!Array.isArray(arr)) return;
                    arr.forEach(function (q) {
                        if (!q || !q.id) return;
                        if (aEntry._seen.has(q.id)) return; aEntry._seen.add(q.id);
                        const a = _skillOf(q);
                        aEntry.archetypes[a] = (aEntry.archetypes[a] || 0) + 1;
                        aEntry.count++;
                    });
                });
            });
        });
        return byDomain;
    }

    function buildSkillPicker() {
        const host = document.getElementById('skillPicker');
        if (!host) return;
        const tax = _skillTaxonomy();
        const domainOrder = ['Algebra', 'Advanced Math', 'Problem-Solving and Data Analysis', 'Geometry and Trigonometry'];
        const domains = Object.keys(tax).sort(function (a, b) {
            const ia = domainOrder.indexOf(a), ib = domainOrder.indexOf(b);
            return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
        });
        let html = '';
        domains.forEach(function (dom) {
            const apps = tax[dom].apps;
            html += '<div class="skill-domain"><div class="skill-domain-title">' + _esc(dom) + '</div>';
            Object.keys(apps).forEach(function (appId) {
                const app = apps[appId];
                const arches = Object.keys(app.archetypes).sort();
                html += '<div class="skill-topic">';
                html += '<div class="skill-topic-head">'
                    + '<input type="checkbox" class="skill-topic-all" data-app="' + _esc(appId) + '" title="Include the whole topic">'
                    + '<button type="button" class="skill-topic-toggle" aria-expanded="false" title="Show the skills in this topic">'
                    + '<span class="skill-caret-icon">▸</span>'
                    + '<span class="topic-name">' + _esc(app.label) + '</span>'
                    + '<span class="skill-count">' + app.count + ' Qs</span>'
                    + '</button>'
                    + '<input type="number" class="topic-weight" value="1" min="0" step="1" title="Topic weight" disabled>'
                    + '</div>';
                html += '<div class="skill-arch-list" hidden>';
                arches.forEach(function (a) {
                    html += '<div class="skill-arch-row" style="display:flex;align-items:flex-start;gap:8px;">'
                        + '<label style="flex:1;"><input type="checkbox" class="skill-arch" data-app="' + _esc(appId) + '" value="' + _esc(a) + '">'
                        + '<span>' + _esc(a) + ' <span class="skill-count">(' + app.archetypes[a] + ')</span></span></label>'
                        + '<input type="number" class="skill-weight" value="1" min="0" step="1" title="Skill weight" disabled>'
                        + '</div>';
                });
                html += '</div></div>';
            });
            html += '</div>';
        });
        host.innerHTML = html;

        host.addEventListener('click', function (e) {
            const toggle = e.target.closest('.skill-topic-toggle');
            if (!toggle) return;
            e.preventDefault();
            const list = toggle.closest('.skill-topic').querySelector('.skill-arch-list');
            const opening = list.hidden;
            list.hidden = !opening;
            toggle.setAttribute('aria-expanded', String(opening));
            const icon = toggle.querySelector('.skill-caret-icon');
            if (icon) icon.textContent = opening ? '▾' : '▸';
        });
        function _syncTopic(topic) {
            const all = topic.querySelectorAll('.skill-arch');
            const checked = topic.querySelectorAll('.skill-arch:checked');
            const head = topic.querySelector('.skill-topic-all');
            head.checked = all.length > 0 && checked.length === all.length;
            head.indeterminate = checked.length > 0 && checked.length < all.length;
            const anyChecked = checked.length > 0;
            const tw = topic.querySelector('.topic-weight');
            if (tw) tw.disabled = !anyChecked;
            // each skill's own weight follows its own checkbox
            topic.querySelectorAll('.skill-arch-row').forEach(function (row) {
                const cb = row.querySelector('.skill-arch');
                const w = row.querySelector('.skill-weight');
                if (w) w.disabled = !(cb && cb.checked);
            });
        }
        host.addEventListener('change', function (e) {
            const topic = e.target.closest('.skill-topic');
            if (!topic) return;
            if (e.target.classList.contains('skill-topic-all')) {
                topic.querySelectorAll('.skill-arch').forEach(function (c) { c.checked = e.target.checked; });
                e.target.indeterminate = false;
            }
            if (e.target.classList.contains('skill-topic-all') || e.target.classList.contains('skill-arch')) {
                _syncTopic(topic);
            }
        });
    }

    function _selectedSkills() {
        return Array.prototype.slice
            .call(document.querySelectorAll('#skillPicker .skill-arch:checked'))
            .map(function (c) { return c.value; });
    }

    // Relative weight per selected difficulty (default 1 each). Equal weights
    // mean "no difficulty ratio" — the allocator then ignores this dimension.
    function _difficultyWeights() {
        const out = {};
        [['diffEasy', 'Easy'], ['diffMedium', 'Medium'], ['diffHard', 'Hard']].forEach(function (pair) {
            const cb = document.getElementById(pair[0]);
            if (cb && cb.checked) {
                const w = document.querySelector('.diff-weight[data-diff="' + pair[1] + '"]');
                let v = w ? parseFloat(w.value) : 1;
                if (isNaN(v) || v < 0) v = 1;
                out[pair[1]] = v;
            }
        });
        return out;
    }

    // Relative weight per selected skill = its own weight x its topic's weight.
    function _skillWeights() {
        const out = {};
        Array.prototype.slice.call(document.querySelectorAll('#skillPicker .skill-arch:checked')).forEach(function (c) {
            const row = c.closest('.skill-arch-row');
            const topic = c.closest('.skill-topic');
            let sw = row ? parseFloat((row.querySelector('.skill-weight') || {}).value) : 1;
            let tw = topic ? parseFloat((topic.querySelector('.topic-weight') || {}).value) : 1;
            if (isNaN(sw) || sw < 0) sw = 1;
            if (isNaN(tw) || tw < 0) tw = 1;
            out[c.value] = sw * tw;
        });
        return out;
    }

    function _runCustom(selected, opts) {
        state.isExamMode = false;          // practice → feedback as you go
        state.isHardMode = false;
        state.smartMode = false;
        state.isRetrySession = false;
        state.currentModule = 'custom';
        state.customOpts = { difficulties: opts.difficulties, count: opts.count, skills: opts.skills };
        const mins = parseInt(opts.minutes, 10);
        state.customTimed = (mins > 0);
        state.customTotalSeconds = state.customTimed ? mins * 60 : 0;
        state.currentTopicIdx = 0; state.allQuestions = []; state.userAnswers = [];
        state.playlist = [{
            id: 'custom_practice',
            title: 'Custom Practice',
            introText: 'Adaptive set: ' + selected.length + ' question(s) drawn from your chosen difficulties — newest and weakest first, mastered ones skipped. Feedback shown as you go' + (state.customTimed ? '; timed at ' + mins + ' min.' : '.'),
            questions: { custom: selected }
        }];
        dom.startScreen.hidden = true;
        loadTopic(0);
    }

    function startCustomPractice(opts) {
        if (!window.MathProgress) { alert('Progress module missing.'); return; }
        if (!opts.difficulties || !opts.difficulties.length) { alert('Pick at least one difficulty.'); return; }
        const built = buildCustomSet(opts);
        if (built.total === 0) { alert('No questions match the selected difficulty.'); return; }
        if (built.selected.length === 0) {
            if (confirm('You have mastered every question at the selected difficulty! Reset this set so you can practise it again?')) {
                resetCustomSet(opts);
                _runCustom(buildCustomSet(opts).selected, opts);
            }
            return;
        }
        _runCustom(built.selected, opts);
    }

    function checkAndShowResume() {
        if (!window.MathSession || !dom.resumeBanner) return;
        const saved = window.MathSession.load(APP_ID);
        if (!saved || !saved.state) return;
        const s = saved.state;
        if (!s.currentModule || !s.playlist || !s.currentQuestions) return;

        const moduleLabels = {
            guided: 'Section A: Guided',
            independent: 'Section B: Independent',
            homework: 'Section C: Homework',
            exam: 'Final Assessment'
        };
        const label = moduleLabels[s.currentModule] || s.currentModule;
        const completedTopicsCount = (s.allQuestions || []).length;
        const positionInCurrentTopic = (s.currentSlideIdx || 0) + 1;
        const positionGlobal = completedTopicsCount + positionInCurrentTopic;
        const totalQuestions = completedTopicsCount + ((s.currentQuestions || []).length);
        dom.resumeLabel.textContent = `${label} — Q ${positionGlobal} of ${totalQuestions}`;
        dom.resumeBanner.hidden = false;

        dom.resumeBtn.onclick = () => {
            Object.assign(state, s);
            dom.resumeBanner.hidden = true;
            dom.startScreen.hidden = true;
            dom.quiz.hidden = false;
            renderSlide();
        };
        dom.resumeDiscardBtn.onclick = () => {
            clearSession();
            dom.resumeBanner.hidden = true;
        };
    }

    function disableOptions() {
        Array.from(dom.optionsGrid.children).forEach(b => b.disabled = true);
    }

    function showFeedback(isCorrect) {
        const q = state.currentQuestions[state.currentSlideIdx];
        const isGridIn = q.type === 'grid-in';
        const hasKey = hasAnswerKey(q);

        if (isGridIn && !hasKey) {
            dom.feedbackStatus.textContent = "ℹ Response Saved";
            dom.feedbackStatus.style.color = "var(--primary, #38bdf8)";
        } else {
            dom.feedbackStatus.textContent = isCorrect ? "Correct" : "Incorrect";
            dom.feedbackStatus.style.color = isCorrect ? "var(--success)" : "var(--danger)";
        }

        let html = '';
        if (isGridIn) {
            if (hasKey) {
                html += `<div class="answer-key-line" style="margin-bottom:12px;font-weight:600;">Correct answer: <span style="color:var(--success);">${escapeHtml(q.answer)}</span></div>`;
            } else {
                html += `<div class="answer-key-line" style="margin-bottom:12px;font-weight:600;color:var(--text-muted, #94a3b8);">Answer key not yet available for this question — please verify with your tutor.</div>`;
            }
        }
        html += q.explanation || '';
        html += renderTrapCallout(q);
        dom.explanationText.innerHTML = html;
        dom.feedbackArea.hidden = false;
        triggerMath(dom.feedbackArea);
    }

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
    }

    function renderTrapCallout(q) {
        if (!q) return '';
        const archetype = q.archetype;
        const trap = q.trapName || q.trapShape;
        const strategy = q.strategy;
        if (!archetype && !trap && !strategy) return '';
        let out = '<div style="margin-top:16px;padding:12px 14px;background:rgba(56,189,248,0.08);border-left:3px solid var(--primary,#38bdf8);border-radius:6px;line-height:1.6;font-size:0.95em;">';
        if (archetype) out += `<div style="font-size:0.85em;color:var(--text-muted,#94a3b8);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.04em;">Archetype · ${escapeHtml(archetype)}</div>`;
        if (trap) out += `<div style="margin-bottom:6px;"><strong>Watch for:</strong> ${escapeHtml(trap)}</div>`;
        if (strategy) out += `<div><strong>Strategy:</strong> ${escapeHtml(strategy)}</div>`;
        out += '</div>';
        return out;
    }

    function handleNext() {
        if (state.currentSlideIdx < state.currentQuestions.length - 1) {
            state.currentSlideIdx++;
            renderSlide();
        } else {
            // End of current TOPIC
            state.allQuestions = state.allQuestions.concat(state.currentQuestions);

            if (state.currentTopicIdx < state.playlist.length - 1) {
                // There is another topic!
                dom.quiz.hidden = true;
                loadTopic(state.currentTopicIdx + 1);
            } else {
                // Playlist Finished
                finishPlaylist();
            }
        }
    }

    function _examIsCorrect(q, userA) {
        if (!hasAnswerKey(q)) return false;
        try { return (q.type === 'grid-in') ? checkGridIn(userA || "", q.answer) : (userA === getCorrectIndex(q)); }
        catch (e) { return false; }
    }

    // Bluebook-style end-of-exam report: estimated score band + per-domain bars.
    function _renderExamSummary(container) {
        const qs = state.allQuestions, ua = state.userAnswers;
        const order = ['Algebra', 'Advanced Math', 'Problem-Solving and Data Analysis', 'Geometry and Trigonometry'];
        const label = {
            'Algebra': 'Algebra', 'Advanced Math': 'Advanced Math',
            'Problem-Solving and Data Analysis': 'Problem-Solving &amp; Data Analysis',
            'Geometry and Trigonometry': 'Geometry &amp; Trigonometry'
        };
        const dom = {}; let correct = 0, gradable = 0;
        qs.forEach((q, i) => {
            const okc = _examIsCorrect(q, ua[i]);
            if (hasAnswerKey(q)) { gradable++; if (okc) correct++; }
            const d = q._domain || 'Other';
            (dom[d] = dom[d] || { c: 0, t: 0 }).t++;
            if (okc) dom[d].c++;
        });
        const pct = gradable ? correct / gradable : 0;
        const scaled = Math.round((200 + 600 * pct) / 10) * 10;
        const lo = Math.max(200, scaled - 30), hi = Math.min(800, scaled + 30);
        const mins = state.sessionStartTime ? Math.max(1, Math.round((Date.now() - state.sessionStartTime) / 60000)) : null;
        let h = '<div style="max-width:560px;margin:0 auto;text-align:left;">';
        h += '<div style="text-align:center;padding:18px;border:1px solid var(--border,rgba(255,255,255,0.1));border-radius:14px;background:rgba(56,189,248,0.06);margin-bottom:18px;">';
        h += '<div style="font-size:0.8rem;letter-spacing:0.08em;text-transform:uppercase;color:var(--text-muted,#94a3b8);">Estimated SAT Math</div>';
        h += '<div style="font-size:2.4rem;font-weight:800;color:var(--text-main,#f1f5f9);line-height:1.1;margin:4px 0;">' + lo + '&ndash;' + hi + '</div>';
        h += '<div style="font-size:0.85rem;color:var(--text-muted,#94a3b8);">' + correct + ' of ' + gradable + ' correct' + (mins ? ' &middot; ' + mins + ' min' : '') + '</div>';
        h += '<div style="font-size:0.72rem;color:var(--text-muted,#94a3b8);margin-top:6px;font-style:italic;">Rough estimate from a 22-question practice module &mdash; not an official score.</div>';
        h += '</div>';
        h += '<div style="font-size:0.8rem;letter-spacing:0.06em;text-transform:uppercase;color:var(--text-muted,#94a3b8);margin-bottom:10px;">Performance by domain</div>';
        order.forEach(d => {
            const v = dom[d]; if (!v) return;
            const p = v.t ? Math.round(100 * v.c / v.t) : 0;
            const col = p >= 70 ? '#4ade80' : (p >= 40 ? '#fbbf24' : '#f87171');
            h += '<div style="margin-bottom:12px;">';
            h += '<div style="display:flex;justify-content:space-between;font-size:0.9rem;margin-bottom:4px;"><span>' + label[d] + '</span><span style="color:var(--text-muted,#94a3b8);">' + v.c + '/' + v.t + ' &middot; ' + p + '%</span></div>';
            h += '<div style="height:8px;background:rgba(255,255,255,0.06);border-radius:999px;overflow:hidden;"><div style="height:100%;width:' + p + '%;background:' + col + ';"></div></div>';
            h += '</div>';
        });
        h += '</div>';
        container.innerHTML = h;
    }

    function finishPlaylist() {
        clearInterval(state.timerInterval);
        dom.activeTimer.hidden = true;
        dom.quiz.hidden = true;
        dom.endScreen.hidden = false;

        let score = 0;
        let gradable = 0;
        let ungraded = 0;
        const missed = [];
        state.allQuestions.forEach((q, idx) => {
            try {
                if (!hasAnswerKey(q)) { ungraded++; return; }
                gradable++;
                const userA = state.userAnswers[idx];
                let isCorrect = false;
                if (q.type === 'grid-in') {
                    isCorrect = checkGridIn(userA || "", q.answer);
                } else {
                    isCorrect = userA === getCorrectIndex(q);
                }
                if (isCorrect) score++;
                else if (userA !== undefined && userA !== null) missed.push(q);
            } catch (e) {
                ungraded++;
            }
        });
        // Sub-category breakdown — the mock exam uses a Bluebook-style domain report
        const _bdEl = document.getElementById("breakdown");
        if (_bdEl && state.playlist[0] && state.playlist[0].id === 'mock_sat') {
            _renderExamSummary(_bdEl);
        } else if (window.MathBreakdown) {
            const _correctness = state.allQuestions.map((q, idx) => {
                if (!hasAnswerKey(q)) return false;
                const userA = state.userAnswers[idx];
                try {
                    return (q.type === "grid-in")
                        ? checkGridIn(userA || "", q.answer)
                        : userA === q.correctIndex;
                } catch (e) { return false; }
            });
            const breakdownEl = document.getElementById("breakdown");
            if (breakdownEl) {
                window.MathBreakdown.render(breakdownEl, {
                    questions: state.allQuestions,
                    correctness: _correctness,
                    userAnswers: state.userAnswers
                });
            }
        }


        let scoreText = `Total Score: ${score} / ${gradable}`;
        if (ungraded > 0) scoreText += ` (${ungraded} ungraded)`;
        if (state.currentModule === 'custom' && state.customOpts && typeof buildCustomSet === 'function') {
            try { if (buildCustomSet(state.customOpts).selected.length === 0) scoreText += ' · Set mastered'; } catch (e) {}
        }
        dom.scoreDisplay.textContent = scoreText;
        dom.scoreDisplay.hidden = false;
        dom.reviewBtn.hidden = false;

        if (dom.retryMissedBtn && dom.retryMissedCount) {
            if (missed.length > 0) {
                dom.retryMissedCount.textContent = String(missed.length);
                dom.retryMissedBtn.hidden = false;
                dom._missedQueue = missed;
            } else {
                dom.retryMissedBtn.hidden = true;
            }
        }

        // Log to local session history for the "My Progress" page
        if (window.MathSession && window.MathSession.logCompletion) {
            const _variantMap = {
                weak_area: 'weak-area', fresh_independent: 'fresh-independent',
                fresh_guided: 'fresh-guided', fresh_exam: 'fresh-exam',
                retry_missed: 'retry-missed'
            };
            const _playlistId = (state.playlist[0] && state.playlist[0].id) || '';
            const _variant = state.isRetrySession ? 'retry-missed' : (_variantMap[_playlistId] || 'standard');
            const _nameInput = document.getElementById('studentName');
            const _studentName = (_nameInput && _nameInput.value.trim()) || (window.MathGate && MathGate.currentName && MathGate.currentName()) || '';
            const _detail = state.allQuestions.map((q, i) => {
                const _ua = state.userAnswers[i];
                const _ok = hasAnswerKey(q) ? ((q.type === 'grid-in') ? checkGridIn(_ua || "", q.answer) : (_ua === getCorrectIndex(q))) : false;
                return { id: q.id, app: q._appId || APP_ID, domain: q._domain || '', difficulty: q.difficulty || '', answered: (_ua !== undefined && _ua !== null), correct: _ok };
            });
            // Compact per-domain score summary, e.g. "Algebra 7/9; Advanced Math 5/8".
            // Only the cross-domain modes (mock exam, custom practice) tag questions
            // with a domain; single-topic apps leave it blank.
            const _domainAgg = {};
            _detail.forEach(d => {
                if (!d.domain) return;
                const a = _domainAgg[d.domain] || (_domainAgg[d.domain] = { correct: 0, total: 0 });
                a.total++;
                if (d.correct) a.correct++;
            });
            const _domainBreakdown = Object.keys(_domainAgg)
                .map(dom => `${dom} ${_domainAgg[dom].correct}/${_domainAgg[dom].total}`)
                .join('; ');
            window.MathSession.logCompletion({
                sessionId: state.sessionId,
                appId: APP_ID,
                appName: (state.playlist[0] && state.playlist[0].title) || APP_ID,
                module: state.currentModule,
                variant: _variant,
                topicTitle: (state.playlist[0] && state.playlist[0].title) || '',
                score: score,
                gradable: gradable,
                ungraded: ungraded,
                missed: missed.length,
                durationMs: state.sessionStartTime ? (Date.now() - state.sessionStartTime) : 0,
                startedAt: state.sessionStartTime || null,
                completedAt: Date.now(),
                studentName: _studentName,
                detail: _detail,
                domainBreakdown: _domainBreakdown,
                smartMode: !!state.smartMode,
                isExamMode: !!state.isExamMode
            });
        }

        // Session is complete; remove the resume snapshot
        clearSession();

        // Save final progress
        saveProgress(true);
    }

    function startRetryMissed() {
        const missed = dom._missedQueue || [];
        if (missed.length === 0) return;
        state.isRetrySession = true;
        state.allQuestions = [];
        state.userAnswers = [];
        state.currentTopicIdx = 0;
        state.currentSlideIdx = 0;
        state.playlist = [{
            id: 'retry_missed',
            title: 'Retry — Missed Questions',
            introText: 'These are the questions you missed. Mastery comes from re-doing them, not from moving on.',
            questions: { [state.currentModule]: missed }
        }];
        dom.endScreen.hidden = true;
        dom.retryMissedBtn.hidden = true;
        dom._missedQueue = [];
        loadTopic(0);
    }

    function startReview() {
        state.reviewIndex = 0;
        dom.endScreen.hidden = true;
        dom.reviewScreen.hidden = false;
        renderReviewSlide();
    }

    function renderReviewSlide() {
        const q = state.allQuestions[state.reviewIndex];
        const userA = state.userAnswers[state.reviewIndex];
        const hasKey = hasAnswerKey(q);
        const ci = getCorrectIndex(q);

        let isCorrect = false;
        if (hasKey) {
            if (q.type === 'grid-in') {
                isCorrect = checkGridIn(userA || "", q.answer);
            } else {
                isCorrect = userA === ci;
            }
        }

        dom.reviewProgress.textContent = `Review: ${state.reviewIndex + 1} of ${state.allQuestions.length}`;
        dom.reviewQuestionText.innerHTML = _renderQContent(q);

        dom.reviewOptions.innerHTML = '';
        if (q.type === 'grid-in') {
            const correctDisplay = hasKey ? escapeHtml(q.answer) : '<em style="color:var(--text-muted,#94a3b8);">Not in key — verify with tutor</em>';
            dom.reviewOptions.innerHTML = `<div class="review-grid-in">
                <p><strong>Your Answer:</strong> ${escapeHtml(userA || "—")}</p>
                <p><strong>Correct Answer:</strong> ${correctDisplay}</p>
            </div>`;
        } else {
            ['A', 'B', 'C', 'D'].forEach((letter, idx) => {
                const div = document.createElement('div');
                div.className = 'option-btn disabled';
                div.innerHTML = (`<span class="opt-letter">${letter}</span>` + ((q.options && q.options[idx] != null && q.options[idx] !== "") ? ` <span class="opt-text">${q.options[idx]}</span>` : ""));
                if (hasKey && idx === ci) div.classList.add('correct');
                if (idx === userA && !isCorrect) div.classList.add('wrong');
                dom.reviewOptions.appendChild(div);
            });
        }

        if (!hasKey) {
            dom.reviewFeedbackStatus.textContent = "ℹ Ungraded (answer key missing)";
            dom.reviewFeedbackStatus.style.color = "var(--primary, #38bdf8)";
        } else {
            dom.reviewFeedbackStatus.textContent = isCorrect ? "Correct" : "Incorrect";
            dom.reviewFeedbackStatus.style.color = isCorrect ? "var(--success)" : "var(--danger)";
        }
        dom.reviewExplanationText.innerHTML = q.explanation || '';

        dom.reviewPrevBtn.disabled = state.reviewIndex === 0;
        dom.reviewNextBtn.disabled = state.reviewIndex === state.allQuestions.length - 1;

        triggerMath(dom.reviewScreen);
    }

    
    // Tier preview badge above the personalised set buttons.
    if (window.MathTierPreview) {
        window.MathTierPreview.attach(APP_ID, './manifest.json', '#tierPreview');
    }
    if (window.APP_CONFIG && window.APP_CONFIG.customMode) {
        buildSkillPicker();
        ['diffEasy', 'diffMedium', 'diffHard'].forEach(function (id) {
            const cb = document.getElementById(id);
            if (!cb) return;
            const w = document.querySelector('.diff-weight[data-diff="' + id.replace('diff', '') + '"]');
            const sync = function () { if (w) w.disabled = !cb.checked; };
            cb.addEventListener('change', sync); sync();
        });
        const _cb = document.getElementById('startCustomBtn');
        if (_cb) _cb.addEventListener('click', function () {
            const _n = document.getElementById('studentName');
            if (_n && !_n.value.trim()) { _n.style.border = '2px solid var(--danger)'; _n.placeholder = 'Enter your name'; _n.focus(); return; }
            const diffs = [];
            if (document.getElementById('diffEasy') && document.getElementById('diffEasy').checked) diffs.push('Easy');
            if (document.getElementById('diffMedium') && document.getElementById('diffMedium').checked) diffs.push('Medium');
            if (document.getElementById('diffHard') && document.getElementById('diffHard').checked) diffs.push('Hard');
            if (!diffs.length) { alert('Pick at least one difficulty.'); return; }
            const countEl = document.getElementById('customCount');
            const minsEl = document.getElementById('customMinutes');
            const count = countEl ? (parseInt(countEl.value, 10) || 10) : 10;
            const minutes = minsEl ? (parseInt(minsEl.value, 10) || 0) : 0;
            startCustomPractice({ difficulties: diffs, count: count, minutes: minutes, skills: _selectedSkills(), diffWeights: _difficultyWeights(), skillWeights: _skillWeights() });
        });
    }
    if (window.APP_CONFIG && window.APP_CONFIG.examMode) {
        const _eb = document.getElementById('startMockExamBtn');
        if (_eb) _eb.addEventListener('click', function () {
            const _n = document.getElementById('studentName');
            if (_n && !_n.value.trim()) { _n.style.border = '2px solid var(--danger)'; _n.placeholder = 'Enter your name'; _n.focus(); return; }
            startMockExam();
        });
    }

    init();
})();
