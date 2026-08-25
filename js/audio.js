(function () {
    "use strict";

    var ctx = null;
    var isMuted = localStorage.getItem("quizSound") === "off";

    function getAudioContext() {
        if (!ctx) {
            var AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                ctx = new AudioCtx();
            }
        }
        if (ctx && ctx.state === "suspended") {
            ctx.resume();
        }
        return ctx;
    }

    // Lazy init audio context on user interaction
    function initUserGesture() {
        getAudioContext();
        window.removeEventListener("pointerdown", initUserGesture);
        window.removeEventListener("keydown", initUserGesture);
    }
    window.addEventListener("pointerdown", initUserGesture);
    window.addEventListener("keydown", initUserGesture);

    function playTone(freq, type, duration, gainVal, freqEnd) {
        if (isMuted) return;
        var audioCtx = getAudioContext();
        if (!audioCtx) return;

        try {
            var osc = audioCtx.createOscillator();
            var gain = audioCtx.createGain();

            osc.type = type || "sine";
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            if (freqEnd) {
                osc.frequency.exponentialRampToValueAtTime(Math.max(10, freqEnd), audioCtx.currentTime + duration);
            }

            gain.gain.setValueAtTime(gainVal || 0.15, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.start();
            osc.stop(audioCtx.currentTime + duration);
        } catch (e) {
            // Audio context error fallback
        }
    }

    var SoundEngine = {
        isMuted: function () {
            return isMuted;
        },
        toggleSound: function () {
            isMuted = !isMuted;
            localStorage.setItem("quizSound", isMuted ? "off" : "on");
            this.updateToggleUI();
            if (!isMuted) {
                this.click();
            }
            return !isMuted;
        },
        updateToggleUI: function () {
            var buttons = document.querySelectorAll(".sound-toggle-btn");
            buttons.forEach(function (btn) {
                btn.setAttribute("aria-label", isMuted ? "Unmute sound" : "Mute sound");
                btn.innerHTML = isMuted ? "🔇" : "🔊";
                if (isMuted) {
                    btn.classList.add("is-muted");
                } else {
                    btn.classList.remove("is-muted");
                }
            });
        },
        click: function () {
            playTone(700, "sine", 0.04, 0.08, 900);
        },
        tick: function (isCritical) {
            if (isCritical) {
                playTone(1200, "triangle", 0.05, 0.12, 600);
            } else {
                playTone(800, "sine", 0.03, 0.06, 500);
            }
        },
        correct: function (streak) {
            if (isMuted) return;
            var audioCtx = getAudioContext();
            if (!audioCtx) return;

            var baseFreq = 523.25; // C5
            if (streak > 1) baseFreq *= Math.pow(1.05946, (streak - 1) * 2); // Pitch up per streak level

            var notes = [baseFreq, baseFreq * 1.25, baseFreq * 1.5, baseFreq * 2]; // Major chord
            notes.forEach(function (freq, i) {
                setTimeout(function () {
                    playTone(freq, "sine", 0.18, 0.12, freq * 1.02);
                }, i * 65);
            });
        },
        wrong: function () {
            if (isMuted) return;
            playTone(180, "sawtooth", 0.28, 0.18, 60);
        },
        streak: function (streakCount) {
            if (isMuted) return;
            var audioCtx = getAudioContext();
            if (!audioCtx) return;

            var fanfare = [440, 554.37, 659.25, 880];
            fanfare.forEach(function (freq, i) {
                setTimeout(function () {
                    playTone(freq, "triangle", 0.22, 0.15);
                }, i * 80);
            });
        },
        result: function () {
            if (isMuted) return;
            var arpeggio = [523.25, 659.25, 783.99, 1046.5];
            arpeggio.forEach(function (freq, i) {
                setTimeout(function () {
                    playTone(freq, "sine", 0.35, 0.14);
                }, i * 110);
            });
        }
    };

    document.addEventListener("DOMContentLoaded", function () {
        SoundEngine.updateToggleUI();
    });

    window.SoundEngine = SoundEngine;
})();
