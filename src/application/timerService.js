/**
 * src/application/timerService.js
 * Capa de Aplicación (Casos de Uso): Orquestador del motor de tiempo en vivo,
 * transiciones de fase, rotación de tandas WA y disparo de señales acústicas.
 */

window.AimTimer = window.AimTimer || {};
window.AimTimer.Application = window.AimTimer.Application || {};

(function (Application) {
  class TimerService {
    constructor({ state, soundEngine, stageView, displaySync = null, buildSessionSteps }) {
      this.state = state;
      this.sound = soundEngine;
      this.view = stageView;
      this.displaySync = displaySync;
      this.buildSessionSteps = buildSessionSteps;
      this.tickLoopBound = this.tickLoop.bind(this);
    }

    triggerStepAudio(step) {
      if (!step || !step.startBeeps) return;
      const notify = (text, ms) => this.view.showBeepBadge(text, ms);

      if (step.startBeeps === 'rest_tone') {
        this.sound.playLetDownRestSignal(notify);
      } else if (typeof step.startBeeps === 'number' && step.startBeeps > 0) {
        this.sound.playWASignal(step.startBeeps, notify);
      }
    }

    enterStep(index) {
      const rt = this.state.runtime;
      if (index >= rt.steps.length) {
        this.finishSession(true);
        return;
      }

      rt.stepIndex = index;
      const step = rt.steps[index];
      rt.stepTotalMs = step.durationSec * 1000;
      rt.remainingMs = rt.stepTotalMs;
      rt.lastPipSecond = null;
      rt.zeroSoundTriggered = false;

      this.view.renderStepHeader(step);
      if (!step.audioTriggeredAtZero) {
        this.triggerStepAudio(step);
      }
      this.view.renderActiveClock(this.state);
      this.view.updateTransportButtons(this.state);
    }

    tickLoop(nowPerf) {
      const rt = this.state.runtime;
      if (rt.status !== 'running') return;

      const delta = nowPerf - rt.lastTickPerf;
      rt.lastTickPerf = nowPerf;
      rt.remainingMs -= delta;

      if (rt.remainingMs <= 0) {
        this.enterStep(rt.stepIndex + 1);
        if (rt.status === 'running') {
          rt.lastTickPerf = performance.now();
          rt.rafId = requestAnimationFrame(this.tickLoopBound);
        }
        return;
      }

      const step = rt.steps[rt.stepIndex];
      const clampedMs = Math.max(0, rt.remainingMs);
      const displaySec = Math.floor(clampedMs / 1000);

      // Al llegar a < 1 segundo (cuando el dígito principal muestra 0), disparar el sonido de fin/cambio de fase
      if (!rt.zeroSoundTriggered && clampedMs < 1000) {
        rt.zeroSoundTriggered = true;
        const nextStep = rt.steps[rt.stepIndex + 1];
        if (nextStep) {
          nextStep.audioTriggeredAtZero = true;
          this.triggerStepAudio(nextStep);
        } else {
          rt.finishAudioTriggeredAtZero = true;
          this.sound.playWASignal(3, (text, ms) => this.view.showBeepBadge(text, ms));
        }
      }

      // Pips de pre-aviso 3-2-1 en Bowtraining (sincronizados al mostrar 3, 2 y 1 en pantalla)
      if (
        this.state.countdownPips &&
        step &&
        step.enableCountdownPips &&
        displaySec <= 3 &&
        displaySec >= 1 &&
        rt.lastPipSecond !== displaySec &&
        clampedMs < rt.stepTotalMs - 200
      ) {
        rt.lastPipSecond = displaySec;
        this.sound.playCountdownPip();
      }

      this.view.renderActiveClock(this.state);
      rt.rafId = requestAnimationFrame(this.tickLoopBound);
    }

    startOrPause() {
      this.sound.init();
      const rt = this.state.runtime;

      if (rt.status === 'idle' || rt.status === 'finished') {
        rt.steps = this.buildSessionSteps(this.state);
        if (rt.steps.length === 0) return;

        // Si en Competencia el usuario solicitó proyectar en 1 o más pantallas, abrirlas automáticamente
        const extCount =
          this.state.currentMode === 'competition'
            ? parseInt(this.state.competition.externalScreens, 10) || 0
            : 0;

        if (extCount > 0 && this.displaySync) {
          this.displaySync.openDisplays(extCount);
        } else if (this.state.autoHud) {
          this.view.setHudMode(true);
        }

        rt.status = 'running';
        this.enterStep(0);
        rt.lastTickPerf = performance.now();
        rt.rafId = requestAnimationFrame(this.tickLoopBound);
      } else if (rt.status === 'running') {
        rt.status = 'paused';
        if (rt.rafId) cancelAnimationFrame(rt.rafId);
        this.view.appendPausedBanner();
        this.view.updateTransportButtons(this.state);
      } else if (rt.status === 'paused') {
        rt.status = 'running';
        const step = rt.steps[rt.stepIndex];
        if (step) {
          this.view.restoreRunningBanner(step.label);
        }
        rt.lastTickPerf = performance.now();
        rt.rafId = requestAnimationFrame(this.tickLoopBound);
        this.view.updateTransportButtons(this.state);
      }
    }

    nextStepOrTurn() {
      const rt = this.state.runtime;
      if (rt.status !== 'running' && rt.status !== 'paused') return;
      this.sound.init();
      this.enterStep(rt.stepIndex + 1);
      if (rt.status === 'running') {
        rt.lastTickPerf = performance.now();
      }
    }

    finishSession(completedNaturally = true) {
      const rt = this.state.runtime;
      if (rt.rafId) cancelAnimationFrame(rt.rafId);
      rt.status = 'finished';
      rt.remainingMs = 0;

      // 3 pitidos oficiales de fin de tanda (si no se dispararon ya al entrar en 0.9s)
      if (!completedNaturally || !rt.finishAudioTriggeredAtZero) {
        this.sound.playWASignal(3, (text, ms) => this.view.showBeepBadge(text, ms));
      }
      rt.finishAudioTriggeredAtZero = false;

      const finishedEndNumber = rt.endNumber;
      if (this.state.currentMode === 'competition') {
        rt.endNumber += 1;
      }

      this.view.renderFinishedStage(this.state, completedNaturally, finishedEndNumber);
      this.view.updateTransportButtons(this.state);
    }

    resetTimer(resetEndCounter = false) {
      const rt = this.state.runtime;
      if (rt.rafId) cancelAnimationFrame(rt.rafId);
      this.sound.clearScheduled();
      if (resetEndCounter) {
        rt.endNumber = 1;
      }
      rt.status = 'idle';
      rt.finishAudioTriggeredAtZero = false;
      rt.zeroSoundTriggered = false;
      rt.steps = this.buildSessionSteps(this.state);
      rt.stepIndex = 0;
      this.view.renderIdleStage(this.state);
    }
  }

  Application.TimerService = TimerService;
})(window.AimTimer.Application);

