(function () {
    "use strict";

    var els = {
        score: document.getElementById("runningScore"),
        scoreValue: document.querySelector("#runningScore .hud-value"),
        streakCell: document.getElementById("streakCell"),
        streakValue: document.getElementById("streakValue"),
        streakPopBanner: document.getElementById("streakPopBanner"),
        timer: document.getElementById("timer"),
        timerWrap: document.getElementById("timerWrap"),
        timerFill: document.getElementById("timerFill"),
        progress: document.getElementById("progress"),
        question: document.getElementById("question"),
        option1: document.getElementById("option1"),
        option2: document.getElementById("option2"),
        option3: document.getElementById("option3"),
        option4: document.getElementById("option4"),
        skip: document.getElementById("skipBtn"),
        status: document.getElementById("status"),
        banner: document.getElementById("feedbackBanner"),
        card: document.getElementById("questionCard") || document.querySelector(".question-card"),
        overlay: document.getElementById("nextCountdownOverlay"),
        overlayLabel: document.getElementById("nextCountdownLabel"),
        overlayNumber: document.getElementById("nextCountdownNumber")
    };

    var optionButtons = [els.option1, els.option2, els.option3, els.option4];

    var state = {
        index: 0,
        score: 0,
        correct: 0,
        wrong: 0,
        skipped: 0,
        streak: 0,
        maxStreak: 0,
        bonusPoints: 0,
        bonusAnswers: 0,
        remaining: 0,
        clockId: null,
        busy: false,
        finished: false,
        startedAt: Date.now(),
        verdicts: []
    };

    function wait(ms) {
        return new Promise(function (resolve) {
            setTimeout(resolve, ms);
        });
    }

    function formatPoints(points) {
        var n = Number(points) || 0;
        return n > 0 ? "+" + n : String(n);
    }

    function setButtonsDisabled(disabled) {
        optionButtons.forEach(function (btn) {
            if (btn) btn.disabled = disabled;
        });
        if (els.skip) els.skip.disabled = disabled;
    }

    function clearOptionStyles() {
        var optionStack = document.querySelector(".option-stack");
        if (optionStack) optionStack.classList.remove("is-image-grid");

        optionButtons.forEach(function (btn) {
            if (!btn) return;
            btn.classList.remove(
                "option-correct",
                "option-wrong",
                "option-selected",
                "option-pulse",
                "option-shake",
                "option-hidden",
                "has-image-option"
            );
            btn.style.display = "";
            btn.classList.add("option-idle");
            if (btn.blur) btn.blur();
        });
    }

    function hideBanner() {
        if (!els.banner) return;
        els.banner.classList.remove("show", "correct", "incorrect", "neutral");
        els.banner.innerText = "";
    }

    function updateStreakUI() {
        if (!els.streakValue || !els.streakCell) return;
        els.streakValue.innerText = "🔥 " + state.streak;
        if (state.streak > 1) {
            els.streakCell.classList.add("active-streak");
        } else {
            els.streakCell.classList.remove("active-streak");
        }
    }

    function triggerScreenShake() {
        var target = els.card || document.body;
        target.classList.remove("screen-shake");
        void target.offsetWidth;
        target.classList.add("screen-shake");
        setTimeout(function () {
            target.classList.remove("screen-shake");
        }, 450);
    }

    function showStreakPop(title) {
        if (!els.streakPopBanner) return;
        els.streakPopBanner.innerText = title;
        els.streakPopBanner.classList.remove("show-pop");
        void els.streakPopBanner.offsetWidth;
        els.streakPopBanner.classList.add("show-pop");
    }

    function haptic(kind) {
        if (!navigator.vibrate) return;
        try {
            if (kind === "light") navigator.vibrate(14);
            else navigator.vibrate([24, 40, 24]);
        } catch (e) { /* ignore */ }
    }

    function burstConfetti(btn) {
        var rect = btn.getBoundingClientRect();
        var layer = document.createElement("div");
        layer.className = "fx-burst";
        document.body.appendChild(layer);

        var cx = rect.left + rect.width / 2;
        var cy = rect.top + 10;
        var colors = ["#4fe08c", "#ffc24d", "#fe8321", "#ffffff", "#7ee0ff"];
        var sparkles = ["✨", "🎉", "🔥", "⚡"];

        for (var i = 0; i < 18; i++) {
            var p = document.createElement("span");
            p.className = "fx-particle";
            var ang = (Math.PI * 2 * i) / 18 + Math.random() * 0.4;
            var dist = 30 + Math.random() * 54;
            p.style.left = cx + "px";
            p.style.top = cy + "px";
            p.style.setProperty("--dx", (Math.cos(ang) * dist) + "px");
            p.style.setProperty("--dy", (Math.sin(ang) * dist - 28) + "px");
            if (i < sparkles.length) {
                p.className = "fx-particle fx-emoji";
                p.innerText = sparkles[i];
            } else {
                p.style.background = colors[i % colors.length];
            }
            layer.appendChild(p);
        }

        setTimeout(function () {
            if (layer.parentNode) layer.parentNode.removeChild(layer);
        }, 850);
    }

    function updateScore(value) {
        state.score = Number(value) || 0;
        els.scoreValue.innerText = String(state.score);
        els.score.classList.remove("score-pop");
        void els.score.offsetWidth;
        els.score.classList.add("score-pop");
    }

    function flyPointsToScore(btn, text, kind, nextScore) {
        var from = btn.getBoundingClientRect();
        var to = els.score.getBoundingClientRect();
        var startX = from.left + from.width / 2;
        var startY = from.top + 6;
        var endX = to.left + to.width / 2;
        var endY = to.top + to.height / 2;

        var el = document.createElement("span");
        el.className = "fx-float fx-hold fx-" + kind;
        el.innerText = text;
        el.style.left = startX + "px";
        el.style.top = startY + "px";
        el.style.setProperty("--tx", (endX - startX) + "px");
        el.style.setProperty("--ty", (endY - startY) + "px");
        document.body.appendChild(el);

        setTimeout(function () {
            el.classList.remove("fx-hold");
            el.classList.add("fx-fly");
        }, 450);

        setTimeout(function () {
            updateScore(nextScore);
        }, 1600);

        setTimeout(function () {
            if (el.parentNode) el.parentNode.removeChild(el);
        }, 1950);
    }

    function showBanner(kind, message) {
        if (!els.banner) return;
        els.banner.classList.remove("correct", "incorrect", "neutral");
        els.banner.classList.add(kind, "show");
        els.banner.innerText = message;
    }

    function stopClock() {
        if (state.clockId) {
            clearInterval(state.clockId);
            state.clockId = null;
        }
    }

    function paintClock() {
        var secs = Math.max(0, state.remaining);
        var total = QUIZ.questionTimerSeconds || 1;
        var progress = Math.max(0, Math.min(1, secs / total));
        els.timer.innerText = String(secs);
        els.timerFill.style.strokeDashoffset = String(100 * (1 - progress));
        els.timerWrap.classList.toggle("critical", secs > 0 && secs <= 3);
    }

    function paintQuestionPips() {
        var el = els.progress;
        if (!el) return;

        var total = QUIZ.questions.length;
        if (el.childElementCount !== total) {
            el.innerHTML = "";
            for (var i = 0; i < total; i++) {
                el.appendChild(document.createElement("span"));
            }
        }

        var pips = el.children;
        for (var i = 0; i < pips.length; i++) {
            var pip = pips[i];
            var verdict = state.verdicts[i];
            pip.className = "";
            pip.innerText = "";
            if (verdict === "correct") {
                pip.className = "is-correct";
                pip.innerText = "✓";
            } else if (verdict === "wrong") {
                pip.className = "is-wrong";
                pip.innerText = "✕";
            } else if (i === state.index) {
                pip.className = "is-current";
            }
        }
        el.setAttribute("aria-label", "Question " + (state.index + 1) + " of " + total);
    }

    function startClock() {
        stopClock();
        state.remaining = QUIZ.questionTimerSeconds;

        els.timerFill.style.transition = "none";
        paintClock();
        void els.timerFill.getBoundingClientRect();
        els.timerFill.style.transition = "";

        state.clockId = setInterval(function () {
            state.remaining -= 1;
            paintClock();
            if (window.SoundEngine) window.SoundEngine.tick(state.remaining <= 3);
            if (state.remaining <= 0) {
                stopClock();
                submitAnswer(0);
            }
        }, 1000);
    }

    async function runInterQuestionCountdown(nextNumber) {
        var seconds = Math.max(0, Number(QUIZ.interQuestionCountdownSeconds) || 0);
        if (seconds <= 0) return;

        els.overlayLabel.innerText = "Question " + nextNumber + " loading in";
        els.overlay.style.display = "flex";

        for (var n = seconds; n >= 1; n--) {
            els.overlayNumber.innerText = String(n);
            if (window.SoundEngine) window.SoundEngine.tick(n <= 2);
            els.overlayNumber.classList.remove("countdown-pop");
            void els.overlayNumber.offsetWidth;
            els.overlayNumber.classList.add("countdown-pop");
            await wait(1000);
        }

        els.overlay.style.display = "none";
    }

    function renderQuestion() {
        var q = QUIZ.questions[state.index];
        var optionStack = document.querySelector(".option-stack");

        clearOptionStyles();
        hideBanner();

        els.question.innerText = q.questionText;

        var isImageQ = q.type === "image" || Boolean(q.option4 && typeof q.option1 === "object");

        if (isImageQ) {
            if (optionStack) optionStack.classList.add("is-image-grid");
            optionButtons.forEach(function (btn, idx) {
                if (!btn) return;
                var opt = q["option" + (idx + 1)];
                btn.style.display = "flex";
                if (opt && typeof opt === "object" && opt.img) {
                    btn.innerHTML = '<img src="' + opt.img + '" class="opt-img-full" alt="Option ' + (idx + 1) + '">';
                    btn.classList.add("has-image-option");
                } else {
                    btn.innerText = String(opt || "");
                }
            });
        } else {
            if (optionStack) optionStack.classList.remove("is-image-grid");
            optionButtons.forEach(function (btn, idx) {
                if (!btn) return;
                if (idx < 3) {
                    btn.style.display = "flex";
                    var opt = q["option" + (idx + 1)];
                    btn.innerText = typeof opt === "object" ? (opt.text || "") : String(opt || "");
                } else {
                    btn.style.display = "none";
                }
            });
        }

        if (els.card) {
            els.card.classList.remove("card-flip-up");
            void els.card.offsetWidth;
            els.card.classList.add("card-flip-up");
        }

        paintQuestionPips();
        updateStreakUI();

        setButtonsDisabled(false);
        startClock();
    }

    function showFeedback(selectedOption) {
        var q = QUIZ.questions[state.index];
        var isImageQ = q.type === "image" || Boolean(q.option4);
        var totalActive = isImageQ ? 4 : 3;
        var correctOption = Number(q.correctOption) || 0;

        clearOptionStyles();

        var optionStack = document.querySelector(".option-stack");
        if (isImageQ && optionStack) optionStack.classList.add("is-image-grid");

        if (correctOption >= 1 && correctOption <= totalActive) {
            optionButtons[correctOption - 1].classList.add("option-correct");
        }

        // Hide non-relevant options so focus stays on the correct answer
        optionButtons.forEach(function (btn, idx) {
            var optNum = idx + 1;
            if (optNum > totalActive) {
                btn.style.display = "none";
                return;
            }
            if (optNum !== correctOption && optNum !== selectedOption) {
                btn.classList.add("option-hidden");
            }
        });

        if (selectedOption === 0) {
            showBanner(
                "neutral",
                state.remaining <= 0
                    ? "Time up — correct answer highlighted"
                    : "Skipped — correct answer highlighted"
            );
            return { outcome: "skipped", bonus: 0 };
        }

        if (selectedOption === correctOption) {
            var bonus = Math.max(0, state.remaining) * (QUIZ.bonusPointsPerSecond || 1);
            var msg = "Hooray! Correct answer " + formatPoints(QUIZ.correctPoints) + " points";
            if (bonus > 0) msg += " " + formatPoints(bonus) + " bonus";
            showBanner("correct", msg);
            return { outcome: "correct", bonus: bonus };
        }

        if (selectedOption >= 1 && selectedOption <= totalActive) {
            optionButtons[selectedOption - 1].classList.add("option-wrong");
        }
        showBanner("incorrect", "Oops, wrong answer, " + formatPoints(QUIZ.wrongPoints) + " points");
        return { outcome: "wrong", bonus: 0 };
    }

    async function submitAnswer(selectedOption) {
        if (state.busy || state.finished) return;
        state.busy = true;
        stopClock();
        setButtonsDisabled(true);

        if (window.SoundEngine) window.SoundEngine.click();

        var q = QUIZ.questions[state.index];
        var totalActive = (q.type === "image" || q.option4) ? 4 : 3;

        var result = showFeedback(selectedOption);
        var picked = selectedOption >= 1 && selectedOption <= totalActive
            ? optionButtons[selectedOption - 1]
            : null;

        if (result.outcome === "correct") {
            state.correct += 1;
            state.streak += 1;
            if (state.streak > state.maxStreak) {
                state.maxStreak = state.streak;
            }

            var streakBonus = state.streak > 1 ? (state.streak - 1) * 5 : 0;
            if (result.bonus > 0 || streakBonus > 0) {
                state.bonusPoints += (result.bonus + streakBonus);
                state.bonusAnswers += 1;
            }

            if (window.SoundEngine) {
                window.SoundEngine.correct(state.streak);
                if (state.streak >= 2) {
                    window.SoundEngine.streak(state.streak);
                }
            }

            if (state.streak >= 2) {
                var popTitles = ["🔥 2x STREAK!", "⚡ 3x STREAK - ON FIRE!", "🚀 4x STREAK - UNSTOPPABLE!", "🏆 5x STREAK - PERFECT DOMINANCE!"];
                showStreakPop(popTitles[Math.min(state.streak - 2, popTitles.length - 1)]);
            }

            haptic("light");
            if (picked) {
                picked.classList.add("option-pulse");
                burstConfetti(picked);
                flyPointsToScore(picked, formatPoints(QUIZ.correctPoints + result.bonus + streakBonus), "up", state.score + QUIZ.correctPoints + result.bonus + streakBonus);
            } else {
                updateScore(state.score + QUIZ.correctPoints + result.bonus + streakBonus);
            }
        } else if (result.outcome === "wrong") {
            state.wrong += 1;
            state.streak = 0;
            if (window.SoundEngine) window.SoundEngine.wrong();
            triggerScreenShake();
            haptic("error");
            if (picked) {
                picked.classList.add("option-shake");
                flyPointsToScore(picked, formatPoints(QUIZ.wrongPoints), "down", state.score + QUIZ.wrongPoints);
            } else {
                updateScore(state.score + QUIZ.wrongPoints);
            }
        } else {
            state.skipped += 1;
            state.streak = 0;
        }

        updateStreakUI();

        if (result.outcome === "correct") state.verdicts[state.index] = "correct";
        else state.verdicts[state.index] = "wrong";
        paintQuestionPips();

        await wait(picked ? 2100 : 1400);

        if (state.index >= QUIZ.questions.length - 1) {
            finish();
            return;
        }

        hideBanner();
        await runInterQuestionCountdown(state.index + 2);
        state.index += 1;
        state.busy = false;
        renderQuestion();
    }

    function finish() {
        if (state.finished) return;
        state.finished = true;
        stopClock();
        if (els.overlay) els.overlay.style.display = "none";

        try {
            sessionStorage.setItem("quizResult", JSON.stringify({
                score: state.score,
                correct: state.correct,
                wrong: state.wrong,
                skipped: state.skipped,
                maxStreak: state.maxStreak,
                bonusPoints: state.bonusPoints,
                bonusAnswers: state.bonusAnswers,
                durationSeconds: Math.max(1, Math.round((Date.now() - state.startedAt) / 1000))
            }));
        } catch (e) { /* ignore */ }

        window.location.href = "result.html";
    }

    if (els.option1) els.option1.onclick = function () { submitAnswer(1); };
    if (els.option2) els.option2.onclick = function () { submitAnswer(2); };
    if (els.option3) els.option3.onclick = function () { submitAnswer(3); };
    if (els.option4) els.option4.onclick = function () { submitAnswer(4); };
    if (els.skip) els.skip.onclick = function () { submitAnswer(0); };

    // Keyboard support
    document.addEventListener("keydown", function (e) {
        if (state.busy || state.finished) return;
        var key = e.key ? e.key.toLowerCase() : "";
        var code = e.code ? e.code.toLowerCase() : "";

        if (key === "1" || key === "a" || code === "digit1" || code === "keya") {
            e.preventDefault();
            submitAnswer(1);
        } else if (key === "2" || key === "b" || code === "digit2" || code === "keyb") {
            e.preventDefault();
            submitAnswer(2);
        } else if (key === "3" || key === "c" || code === "digit3" || code === "keyc") {
            e.preventDefault();
            submitAnswer(3);
        } else if (key === "4" || key === "d" || code === "digit4" || code === "keyd") {
            e.preventDefault();
            var q = QUIZ.questions[state.index];
            if (q.type === "image" || q.option4) {
                submitAnswer(4);
            }
        } else if (key === " " || key === "s" || code === "space" || code === "keys") {
            e.preventDefault();
            submitAnswer(0);
        }
    });

    optionButtons.forEach(function (btn) {
        if (!btn) return;
        btn.addEventListener("pointerleave", function () {
            btn.classList.remove("option-idle");
        });
    });

    document.title = QUIZ.title || "Quiz";
    updateScore(0);
    renderQuestion();
})();
