(function () {
    const APP_ID = 'Data_Analysis_Probability_App';
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
                    if (userA === q.correctIndex) {
                        score++;
                        earnedPoints = 1;
                    }
                }

                // Strip KaTeX/HTML to make it perfectly readable in Sheets
                const cleanQuestion = q.question.replace(/<[^>]*>?/gm, '').replace(/\\\(/g, '').replace(/\\\)/g, '').replace(/\$/g, '').substring(0, 40) + "...";
                detailedScores.push(`Q${idx + 1}: ${cleanQuestion} (${earnedPoints}/1)`);
            }
        });

        // Don't save if nothing has been answered yet
        if (answeredCount === 0) return;

        const appName = "Data_Analysis_Probability_App";
        // If final, list all topics they covered
        const sectionName = state.currentModule.charAt(0).toUpperCase() + state.currentModule.slice(1);
        const fullTopicContext = `Data Analysis & Probability | ${sectionName}`;

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
                if (highScoreDisplay) highScoreDisplay.textContent = `🏆 New Personal Best! (Previous: ${parsedScore.score}/${parsedScore.maxScore})`;
                localStorage.setItem(storageKey, JSON.stringify({ score: score, maxScore: totalPossible }));
            } else if (isFinal) {
                if (highScoreDisplay) highScoreDisplay.textContent = `Your Personal Best: ${parsedScore.score}/${parsedScore.maxScore}`;
            }
            // If not final but we are saving progress, we still update if it's strictly better
            else if (currentPercentage > prevPercentage) {
                localStorage.setItem(storageKey, JSON.stringify({ score: score, maxScore: totalPossible }));
            }
        } else {
            if (isFinal && highScoreDisplay) highScoreDisplay.textContent = `🏆 First attempt recorded!`;
            localStorage.setItem(storageKey, JSON.stringify({ score: score, maxScore: totalPossible }));
        }

        // --- OPTION 2: Google Sheets Tracking ---
        const studentNameInput = document.getElementById('studentName');
        const studentName = (studentNameInput && studentNameInput.value.trim()) ? studentNameInput.value.trim() : "Unknown Student";

        const dbStatus = document.getElementById('dbSyncStatus');
        if (isFinal && dbStatus) {
            dbStatus.style.display = 'block';
            dbStatus.textContent = "Saving final score to database...";
            dbStatus.style.color = "var(--primary)";
        }

        const scriptURL = "https://script.google.com/macros/s/AKfycbxCEkQ_QepW7MWzClK28h32T-StNMdeGsqMISPVx76dn-Md7349LJA4Ir22LunJ6sQbkg/exec";

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

        fetch(scriptURL, {
            method: 'POST',
            body: JSON.stringify(payload)
        })
            .then(response => {
                if (isFinal && dbStatus) {
                    dbStatus.textContent = "✅ Score successfully saved to database!";
                    dbStatus.style.color = "var(--success)";
                }
            })
            .catch(error => {
                if (isFinal && dbStatus) {
                    dbStatus.textContent = "⚠️ Could not save to database (Check connection).";
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
                    nameInput.placeholder = "⚠️ REQUIRED: Enter your name";
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
                if (state.userAnswers[idx] === q.correctIndex) score++;
            }
        });

        let outputText = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📝 SAT PLAYLIST REPORT\nStudent: ${name}\nDate: ${date}\nFinal Score: ${score} / ${state.allQuestions.length}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

        state.allQuestions.forEach((q, idx) => {
            const userA = state.userAnswers[idx];
            let isCorrect = false;
            if (q.type === 'grid-in') {
                isCorrect = checkGridIn(userA || "", q.answer);
            } else {
                isCorrect = userA === q.correctIndex;
            }

            // Strip KaTeX/HTML for raw text copy
            const cleanQuestion = q.question.replace(/<[^>]*>?/gm, '').replace(/\\\(/g, '').replace(/\\\)/g, '').replace(/\$/g, '');
            outputText += `Q${idx + 1}: ${cleanQuestion}\n`;

            if (userA === undefined || userA === null) {
                outputText += `  Status: ⚠️ UNANSWERED\n\n`;
            } else {
                const userChoice = q.type === 'grid-in' ? userA : ['A', 'B', 'C', 'D'][userA];
                outputText += `  Selected: ${userChoice}\n`;
                outputText += `  Status: ${isCorrect ? '✅ Correct' : '❌ Incorrect'}\n\n`;
            }
        });

        outputText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nEnd of Report\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

        // Clipboard logic
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(outputText).then(() => {
                const msgEl = document.getElementById('submitMsg');
                if (msgEl) {
                    msgEl.innerText = "✅ Copied to clipboard!";
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

        // 1. Prepare the playlist
        const sourcePlaylist = window.PLAYLIST || [];
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
                <div class="card-title">Winning Strategy</div>
                <p>${topic.introText}</p>
            </div>
        `;

        dom.introScreen.hidden = false;
        triggerMath(dom.introScreen);
    }

    function beginQuizExecution() {
        dom.quiz.hidden = false;

        // If it's the very first topic, start global timer if in Exam mode
        if (state.currentTopicIdx === 0 && state.isExamMode) {
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
        state.timeRemaining = _n > 0 ? _n * _perQ : 1200;
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
        dom.questionText.innerHTML = q.question;
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
                btn.innerHTML = `<span class="opt-letter">${letter}</span>`;

                const globalIdx = state.allQuestions.length + state.currentSlideIdx;
                if (state.userAnswers[globalIdx] === idx) {
                    btn.classList.add('selected');
                    if (!state.isExamMode && state.currentModule !== 'homework') {
                        const isCorrect = idx === q.correctIndex;
                        btn.classList.add(isCorrect ? 'correct' : 'wrong');
                        showFeedback(isCorrect);
                        disableOptions();
                    }
                }

                btn.addEventListener('click', () => {
                    if (state.userAnswers[globalIdx] !== undefined && !state.isExamMode && state.currentModule !== 'homework') return;

                    state.userAnswers[globalIdx] = idx;
                    const isCorrect = idx === q.correctIndex;
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
        return typeof q.correctIndex === 'number' && q.correctIndex >= 0;
    }

    function recordToLedger(q, isCorrect) {
        if (!window.MathProgress || !q || !q.id) return;
        const source = state.isRetrySession ? 'retry'
            : state.isExamMode ? 'exam'
            : state.currentModule;
        const elapsedMs = state.questionStartTime > 0 ? (Date.now() - state.questionStartTime) : 0;
        window.MathProgress.recordAnswer(APP_ID, q.id, isCorrect, source, elapsedMs);
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
        const selected = window.MathProgress.buildBalancedSet(APP_ID, pool, { count: 8, daysToAvoid: 7 });
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
        const selected = window.MathProgress.buildCuratedProgression(APP_ID, pool, { count: 10 });
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
        const selected = window.MathProgress.buildExamSample(APP_ID, pool, { count: 15 });
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
            dom.feedbackStatus.textContent = isCorrect ? "✓ Correct" : "✗ Incorrect";
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
        if (trap) out += `<div style="margin-bottom:6px;">⚠️ <strong>Watch for:</strong> ${escapeHtml(trap)}</div>`;
        if (strategy) out += `<div>🎯 <strong>Strategy:</strong> ${escapeHtml(strategy)}</div>`;
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
                    isCorrect = userA === q.correctIndex;
                }
                if (isCorrect) score++;
                else if (userA !== undefined && userA !== null) missed.push(q);
            } catch (e) {
                ungraded++;
            }
        });
        // Sub-category breakdown
        if (window.MathBreakdown) {
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
            const _studentName = (_nameInput && _nameInput.value.trim()) || '';
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

        let isCorrect = false;
        if (hasKey) {
            if (q.type === 'grid-in') {
                isCorrect = checkGridIn(userA || "", q.answer);
            } else {
                isCorrect = userA === q.correctIndex;
            }
        }

        dom.reviewProgress.textContent = `Review: ${state.reviewIndex + 1} of ${state.allQuestions.length}`;
        dom.reviewQuestionText.innerHTML = q.question;

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
                div.innerHTML = `<span class="opt-letter">${letter}</span>`;
                if (hasKey && idx === q.correctIndex) div.classList.add('correct');
                if (idx === userA && !isCorrect) div.classList.add('wrong');
                dom.reviewOptions.appendChild(div);
            });
        }

        if (!hasKey) {
            dom.reviewFeedbackStatus.textContent = "ℹ Ungraded (answer key missing)";
            dom.reviewFeedbackStatus.style.color = "var(--primary, #38bdf8)";
        } else {
            dom.reviewFeedbackStatus.textContent = isCorrect ? "✓ Correct" : "✗ Incorrect";
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
    init();
})();
