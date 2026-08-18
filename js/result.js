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

        setText("score", String(data.score ?? 0));
        setValue("correct", data.correct ?? 0);
        setValue("wrong", data.wrong ?? 0);
        setValue("skipped", data.skipped ?? 0);

        var bonusPoints = Number(data.bonusPoints) || 0;
        var bonusAnswers = Number(data.bonusAnswers) || 0;
        setValue("bonus", bonusPoints > 0
            ? "+" + bonusPoints + "  (" + bonusAnswers + " fast)"
            : "0");

        setValue("duration", formatDuration(data.durationSeconds));
    }

    function goBack() {
        try {
            sessionStorage.removeItem("quizResult");
        } catch (e) { /* ignore */ }
        window.location.href = "index.html";
    }

    window.goBack = goBack;
    window.addEventListener("load", loadResult);
})();
