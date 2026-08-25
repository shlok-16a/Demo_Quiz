(function () {
    "use strict";

    function setText(id, value) {
        var el = document.getElementById(id);
        if (el) el.innerText = value;
    }

    function setValue(id, value) {
        var el = document.querySelector("#" + id + " .hud-value");
        if (el) el.innerText = String(value);
    }

    function animateCountUp(elementId, targetValue, duration) {
        var el = document.getElementById(elementId);
        if (!el) return;
        var start = 0;
        var target = Number(targetValue) || 0;
        if (target === 0) {
            el.innerText = "0";
            return;
        }
        var startTime = null;

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            var progress = Math.min((timestamp - startTime) / duration, 1);
            var current = Math.floor(progress * (target - start) + start);
            el.innerText = String(current);
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                el.innerText = String(target);
            }
        }

        requestAnimationFrame(step);
    }

    function formatDuration(seconds) {
        var total = Number(seconds) || 0;
        var mins = Math.floor(total / 60);
        var secs = total % 60;
        return mins > 0
            ? mins + "m " + String(secs).padStart(2, "0") + "s"
            : secs + "s";
    }

    function loadResult() {
        var data = null;
        try {
            data = JSON.parse(sessionStorage.getItem("quizResult") || "null");
        } catch (e) {
            data = null;
        }

        if (!data) {
            window.location.href = "index.html";
            return;
        }

        if (window.SoundEngine) {
            window.SoundEngine.result();
        }

        animateCountUp("score", data.score ?? 0, 1000);
        setValue("correct", data.correct ?? 0);
        setValue("wrong", data.wrong ?? 0);
        setValue("skipped", data.skipped ?? 0);
        setValue("maxStreak", "🔥 " + (data.maxStreak ?? 0));

        var bonusPoints = Number(data.bonusPoints) || 0;
        var bonusAnswers = Number(data.bonusAnswers) || 0;
        setValue("bonus", bonusPoints > 0
            ? "+" + bonusPoints + "  (" + bonusAnswers + " fast)"
            : "0");

        setValue("duration", formatDuration(data.durationSeconds));
    }

    function goBack() {
        if (window.SoundEngine) window.SoundEngine.click();
        try {
            sessionStorage.removeItem("quizResult");
        } catch (e) { /* ignore */ }
        window.location.href = "index.html";
    }

    window.goBack = goBack;
    window.addEventListener("load", loadResult);
})();
