(function () {
    "use strict";

    var startInFlight = false;

    function wait(ms) {
        return new Promise(function (resolve) {
            setTimeout(resolve, ms);
        });
    }

    function fillIntro() {
        var titleEl = document.getElementById("playReadyTitle");
        var rulesEl = document.getElementById("playReadyRules");
        var scoringEl = document.getElementById("playReadyScoring");

        if (titleEl) titleEl.innerText = "Welcome to " + QUIZ.title;
        if (rulesEl) {
            rulesEl.innerHTML = "";
            (QUIZ.rules || []).forEach(function (rule) {
                var li = document.createElement("li");
                var icon = document.createElement("span");
                icon.className = "rule-icon";
                icon.setAttribute("aria-hidden", "true");
                icon.innerText = rule.icon || "";
                var text = document.createElement("span");
                text.innerText = rule.text || "";
                li.appendChild(icon);
                li.appendChild(text);
                rulesEl.appendChild(li);
            });
        }

        if (scoringEl) {
            var seconds = QUIZ.questionTimerSeconds;
            var sWord = seconds === 1 ? "second" : "seconds";
            var points = [
                QUIZ.questions.length + " questions per quiz.",
                '<span class="format-plus">+' + QUIZ.correctPoints + "</span> points for every correct answer.",
                '<span class="format-minus">' + QUIZ.wrongPoints + "</span> for every wrong answer.",
                "You have <span class=\"format-timer\">" + seconds + "</span> " + sWord + " per question. Answer fast, leftover seconds convert straight into bonus points."
            ];
            scoringEl.innerHTML = "";
            points.forEach(function (line) {
                var li = document.createElement("li");
                var bullet = document.createElement("span");
                bullet.className = "format-bullet";
                bullet.setAttribute("aria-hidden", "true");
                var text = document.createElement("span");
                text.innerHTML = line;
                li.appendChild(bullet);
                li.appendChild(text);
                scoringEl.appendChild(li);
            });
        }
    }

    async function runStartCountdown(seconds) {
        var overlay = document.getElementById("startCountdownOverlay");
        var numberEl = document.getElementById("startCountdownNumber");
        if (!overlay || !numberEl) return;

        var countdownSeconds = Math.max(1, Number(seconds) || 5);
        overlay.style.display = "flex";

        for (var n = countdownSeconds; n >= 1; n--) {
            numberEl.innerText = String(n);
            numberEl.classList.remove("countdown-pop");
            void numberEl.offsetWidth;
            numberEl.classList.add("countdown-pop");
            await wait(1000);
        }

        numberEl.innerText = "Go!";
        await wait(400);
    }

    async function onPoolPlayStart() {
        if (startInFlight) return;
        startInFlight = true;

        var btn = document.getElementById("playStartBtn");
        if (btn) {
            btn.disabled = true;
            btn.innerText = "Starting…";
        }

        try {
            sessionStorage.removeItem("quizResult");
            await runStartCountdown(QUIZ.startCountdownSeconds);
            window.location.href = "quiz.html?v=55";
        } catch (err) {
            console.error(err);
            var overlay = document.getElementById("startCountdownOverlay");
            if (overlay) overlay.style.display = "none";
            if (btn) {
                btn.disabled = false;
                btn.innerText = "Start";
            }
            startInFlight = false;
        }
    }

    window.onPoolPlayStart = onPoolPlayStart;
    fillIntro();
})();
