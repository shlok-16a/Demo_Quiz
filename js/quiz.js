(function () {
    "use strict";

    var els = {
        title: document.getElementById("title"),
        score: document.getElementById("runningScore"),
        scoreValue: document.querySelector("#runningScore .hud-value"),
        timer: document.getElementById("timer"),
        timerWrap: document.getElementById("timerWrap"),
        timerFill: document.getElementById("timerFill"),
        progress: document.getElementById("progress"),
        progressValue: document.querySelector("#progress .hud-value"),
        progressFill: document.getElementById("progressFill"),
        question: document.getElementById("question"),
        option1: document.getElementById("option1"),
        option2: document.getElementById("option2"),
        option3: document.getElementById("option3"),
        skip: document.getElementById("skipBtn"),
        status: document.getElementById("status"),
        banner: document.getElementById("feedbackBanner"),
        overlay: document.getElementById("nextCountdownOverlay"),
        overlayLabel: document.getElementById("nextCountdownLabel"),
        overlayNumber: document.getElementById("nextCountdownNumber")
    };

    var optionButtons = [els.option1, els.option2, els.option3];

    var state = {
        index: 0,
        score: 0,
        correct: 0,
        wrong: 0,
        skipped: 0,
        bonusPoints: 0,
        bonusAnswers: 0,
        remaining: 0,
        clockId: null,
        busy: false,
        finished: false,
        startedAt: Date.now()
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
            btn.disabled = disabled;
        });
        els.skip.disabled = disabled;
    }

    function clearOptionStyles() {
        optionButtons.forEach(function (btn) {
            btn.classList.remove("option-correct", "option-wrong");
            btn.classList.add("option-idle");
            if (btn.blur) btn.blur();
        });
    }

    function hideBanner() {
        els.banner.classList.remove("show", "correct", "incorrect", "neutral");
        els.banner.innerText = "";
    }

    function showBanner(kind, message) {
        els.banner.classList.remove("correct", "incorrect", "neutral");
        els.banner.classList.add(kind, "show");
        els.banner.innerText = message;
    }

    function updateScore(value) {
        state.score = Number(value) || 0;
        els.scoreValue.innerText = String(state.score);
        els.score.classList.remove("score-pop");
        void els.score.offsetWidth;
        els.score.classList.add("score-pop");
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
        els.timer.innerText = secs + "s";
        els.timerFill.style.transform =
            "scaleX(" + Math.max(0, Math.min(1, secs / total)) + ")";
        els.timerWrap.classList.toggle("critical", secs > 0 && secs <= 5);
    }

    function startClock() {
        stopClock();
        state.remaining = QUIZ.questionTimerSeconds;

        els.timerFill.style.transition = "none";
        paintClock();
        void els.timerFill.offsetWidth;
        els.timerFill.style.transition = "";

        state.clockId = setInterval(function () {
            state.remaining -= 1;
            paintClock();
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
            els.overlayNumber.classList.remove("countdown-pop");
            void els.overlayNumber.offsetWidth;
            els.overlayNumber.classList.add("countdown-pop");
            await wait(1000);
        }

        els.overlay.style.display = "none";
    }

    function renderQuestion() {
        var q = QUIZ.questions[state.index];
        var number = state.index + 1;
        var total = QUIZ.questions.length;

        clearOptionStyles();
        hideBanner();

        els.question.innerText = q.questionText;
        els.option1.innerText = q.option1;
        els.option2.innerText = q.option2;
        els.option3.innerText = q.option3;

        els.progressValue.innerText = number + " / " + total;
        els.progressFill.style.width = Math.min(100, (number / total) * 100) + "%";

        setButtonsDisabled(false);
        startClock();
    }

    function showFeedback(selectedOption) {
        var q = QUIZ.questions[state.index];
        var correctOption = Number(q.correctOption) || 0;

        clearOptionStyles();

        if (correctOption >= 1 && correctOption <= 3) {
            optionButtons[correctOption - 1].classList.add("option-correct");
        }

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

        if (selectedOption >= 1 && selectedOption <= 3) {
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

        var result = showFeedback(selectedOption);

        if (result.outcome === "correct") {
            state.correct += 1;
            if (result.bonus > 0) {
                state.bonusPoints += result.bonus;
                state.bonusAnswers += 1;
            }
            updateScore(state.score + QUIZ.correctPoints + result.bonus);
        } else if (result.outcome === "wrong") {
            state.wrong += 1;
            updateScore(state.score + QUIZ.wrongPoints);
        } else {
            state.skipped += 1;
        }

        await wait(selectedOption > 0 ? 1600 : 1400);

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
        els.overlay.style.display = "none";

        try {
            sessionStorage.setItem("quizResult", JSON.stringify({
                score: state.score,
                correct: state.correct,
                wrong: state.wrong,
                skipped: state.skipped,
                bonusPoints: state.bonusPoints,
                bonusAnswers: state.bonusAnswers,
                durationSeconds: Math.max(1, Math.round((Date.now() - state.startedAt) / 1000))
            }));
        } catch (e) { /* ignore */ }

        window.location.href = "result.html";
    }

    els.option1.onclick = function () { submitAnswer(1); };
    els.option2.onclick = function () { submitAnswer(2); };
    els.option3.onclick = function () { submitAnswer(3); };
    els.skip.onclick = function () { submitAnswer(0); };

    optionButtons.forEach(function (btn) {
        btn.addEventListener("pointerleave", function () {
            btn.classList.remove("option-idle");
        });
    });

    els.title.innerText = QUIZ.title;
    updateScore(0);
    renderQuestion();
})();
