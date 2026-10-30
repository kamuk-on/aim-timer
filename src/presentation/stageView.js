/**
 * src/presentation/stageView.js
 * Capa de Presentación: Vista responsable de actualizar el escenario del temporizador,
 * colores semafóricos WA, métricas, formularios y lista de perfiles guardados.
 */

window.AimTimer = window.AimTimer || {};
window.AimTimer.Presentation = window.AimTimer.Presentation || {};

(function (Presentation, Domain) {
  class StageView {
    constructor(dom, displaySync = null) {
      this.dom = dom;
      this.displaySync = displaySync;
      this.beepBadgeTimeout = null;
      this.currentColorClass = 'state-idle';
      if (this.dom.timerStage) {
        this.dom.timerStage.querySelectorAll('img').forEach((img) => img.remove());
      }
    }

    emitSyncSnapshot() {
      if (!this.displaySync) return;
      this.displaySync.broadcast({
        colorClass: this.currentColorClass,
        phaseText: this.dom.phaseBanner.textContent,
        lineText: this.dom.stageLineBadge.textContent,
        beepText: this.dom.stageBeepIndicator.textContent,
        isBeepActive: this.dom.stageBeepIndicator.classList.contains('active-beep'),
        digits: this.dom.clockDisplay.textContent,
        tenths: this.dom.clockTenths.textContent,
        progressWidth: this.dom.progressBar.style.width || '100%',
        metrics: [
          { label: this.dom.metric1Label.textContent, value: this.dom.metric1Value.textContent },
          { label: this.dom.metric2Label.textContent, value: this.dom.metric2Value.textContent },
          { label: this.dom.metric3Label.textContent, value: this.dom.metric3Value.textContent },
        ],
      });
    }

    setTheme(theme) {
      this.dom.html.setAttribute('data-theme', theme);
    }

    getTheme() {
      return this.dom.html.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    }

    setStageColorClass(cls) {
      this.currentColorClass = cls;
      this.dom.timerStage.classList.remove(
        'state-idle',
        'state-red',
        'state-green',
        'state-amber',
        'state-blue'
      );
      this.dom.timerStage.classList.add(cls);
    }

    showBeepBadge(text, durationMs = 1500) {
      if (this.beepBadgeTimeout) clearTimeout(this.beepBadgeTimeout);
      this.dom.stageBeepIndicator.textContent = text;
      this.dom.stageBeepIndicator.classList.add('active-beep');
      this.emitSyncSnapshot();
      this.beepBadgeTimeout = setTimeout(() => {
        this.dom.stageBeepIndicator.textContent = 'WA';
        this.dom.stageBeepIndicator.classList.remove('active-beep');
        this.emitSyncSnapshot();
      }, durationMs);
    }

    setHudMode(enabled) {
      this.dom.body.classList.toggle('hud-mode', enabled);
      this.dom.hudBtnText.textContent = enabled ? 'Salir' : 'Expandir';
    }

    isHudMode() {
      return this.dom.body.classList.contains('hud-mode');
    }

    appendPausedBanner() {
      if (!this.dom.phaseBanner.textContent.includes('(PAUSADO)')) {
        this.dom.phaseBanner.textContent += ' (PAUSADO)';
        this.emitSyncSnapshot();
      }
    }

    restoreRunningBanner(label) {
      this.dom.phaseBanner.textContent = label;
      this.emitSyncSnapshot();
    }

    renderStepHeader(step) {
      this.dom.stageLineBadge.textContent = step.lineBadge;
      this.dom.phaseBanner.textContent = step.label;
      this.setStageColorClass(step.colorState);

      if (step.metrics && step.metrics.length === 3) {
        this.dom.metric1Label.textContent = step.metrics[0].label;
        this.dom.metric1Value.textContent = step.metrics[0].value;
        this.dom.metric2Label.textContent = step.metrics[1].label;
        this.dom.metric2Value.textContent = step.metrics[1].value;
        this.dom.metric3Label.textContent = step.metrics[2].label;
        this.dom.metric3Value.textContent = step.metrics[2].value;
      }
      this.emitSyncSnapshot();
    }

    renderActiveClock(state) {
      const rt = state.runtime;
      const step = rt.steps[rt.stepIndex];
      if (!step) return;

      const clampedMs = Math.max(0, rt.remainingMs);
      const displaySec = Math.floor(clampedMs / 1000);
      const tenths = Math.floor((clampedMs % 1000) / 100);

      this.dom.clockDisplay.textContent = String(displaySec);
      this.dom.clockTenths.textContent = `.${tenths}`;

      const pct = rt.stepTotalMs > 0 ? (clampedMs / rt.stepTotalMs) * 100 : 0;
      this.dom.progressBar.style.width = `${Math.max(0, Math.min(100, pct))}%`;

      if (step.type === 'shoot' && step.warnSec > 0) {
        if (clampedMs <= step.warnSec * 1000 && clampedMs > 0) {
          this.setStageColorClass('state-amber');
          if (!this.dom.phaseBanner.textContent.includes('ADVERTENCIA')) {
            this.dom.phaseBanner.textContent = `${step.label} · ¡ADVERTENCIA!`;
          }
        } else {
          this.setStageColorClass('state-green');
        }
      }
      this.emitSyncSnapshot();
    }

    renderFinishedStage(state, completedNaturally, finishedEndNumber) {
      this.setStageColorClass('state-red');
      this.dom.clockDisplay.textContent = '0';
      this.dom.clockTenths.textContent = '.0';
      this.dom.progressBar.style.width = '0%';

      if (state.currentMode === 'competition') {
        this.dom.phaseBanner.textContent = completedNaturally
          ? `FIN DE TANDA ${finishedEndNumber} — ALTO EL TIRO`
          : `TANDA ${finishedEndNumber} FINALIZADA — ALTO EL TIRO`;
      } else {
        this.dom.phaseBanner.textContent = '¡ENTRENAMIENTO FINALIZADO! — 3 PITIDOS';
      }
      this.emitSyncSnapshot();
    }

    renderIdleStage(state) {
      const rt = state.runtime;
      this.setStageColorClass('state-idle');

      if (state.currentMode === 'competition') {
        const cfg = state.competition;
        this.dom.stageModeLabel.textContent = 'COMPETENCIA';
        const endNum = rt.endNumber;
        const pair1 = cfg.format === 'abcd' ? 'AB' : 'A';
        const pair2 = cfg.format === 'abcd' ? 'CD' : 'B';
        const firstTurn =
          cfg.format === 'single'
            ? 'Todas'
            : cfg.format === 'alternating'
            ? `Arq. ${cfg.altFirstArcher}`
            : endNum % 2 === 1
            ? pair1
            : pair2;

        this.dom.stageLineBadge.textContent =
          cfg.format === 'single'
            ? 'Línea Única'
            : cfg.format === 'alternating'
            ? 'Tiro Alterno'
            : `Tanda ${endNum} · Inicia ${firstTurn}`;

        this.dom.phaseBanner.textContent = 'Listo';
        this.dom.clockDisplay.textContent = String(cfg.shootTime);
        this.dom.clockTenths.textContent = '.0';
        this.dom.progressBar.style.width = '100%';

        this.dom.metric1Label.textContent = 'Tanda';
        this.dom.metric1Value.textContent = `${endNum}`;
        this.dom.metric2Label.textContent = 'Inicia';
        this.dom.metric2Value.textContent = firstTurn;
        this.dom.metric3Label.textContent = 'Prep';
        this.dom.metric3Value.textContent = `${cfg.prepTime}s`;
      } else if (state.currentMode === 'holding') {
        const cfg = state.holding;
        this.dom.stageModeLabel.textContent = 'MANTENCIONES';
        this.dom.stageLineBadge.textContent = `${cfg.seriesCount} Series`;
        this.dom.phaseBanner.textContent = 'Listo';
        this.dom.clockDisplay.textContent = String(cfg.workTime);
        this.dom.clockTenths.textContent = '.0';
        this.dom.progressBar.style.width = '100%';

        this.dom.metric1Label.textContent = 'Series';
        this.dom.metric1Value.textContent = `${cfg.seriesCount}`;
        this.dom.metric2Label.textContent = 'Mantener';
        this.dom.metric2Value.textContent = `${cfg.workTime}s`;
        this.dom.metric3Label.textContent = 'Descanso';
        this.dom.metric3Value.textContent = `${cfg.restTime}s`;
      } else if (state.currentMode === 'nested7x3') {
        const cfg = state.nested7x3;
        this.dom.stageModeLabel.textContent = '7×3';
        this.dom.stageLineBadge.textContent = `${cfg.roundsA} Rondas × ${cfg.repsB} Series`;
        this.dom.phaseBanner.textContent = 'Listo';
        this.dom.clockDisplay.textContent = String(cfg.holdX);
        this.dom.clockTenths.textContent = '.0';
        this.dom.progressBar.style.width = '100%';

        this.dom.metric1Label.textContent = 'Rondas';
        this.dom.metric1Value.textContent = `${cfg.roundsA}`;
        this.dom.metric2Label.textContent = 'Series';
        this.dom.metric2Value.textContent = `${cfg.repsB}`;
        this.dom.metric3Label.textContent = 'Ciclo';
        this.dom.metric3Value.textContent = `${cfg.holdX}s / ${cfg.restY}s`;
      }

      this.updateTransportButtons(state);
      this.emitSyncSnapshot();
    }

    updateTransportButtons(state) {
      const rt = state.runtime;

      if (rt.status === 'running') {
        this.dom.iconPlay.classList.add('hidden');
        this.dom.iconPause.classList.remove('hidden');
        this.dom.startPauseText.textContent = 'Pausar';
        this.dom.btnNextTurn.classList.remove('hidden');
      } else if (rt.status === 'paused') {
        this.dom.iconPlay.classList.remove('hidden');
        this.dom.iconPause.classList.add('hidden');
        this.dom.startPauseText.textContent = 'Reanudar';
        this.dom.btnNextTurn.classList.remove('hidden');
      } else if (rt.status === 'finished') {
        this.dom.iconPlay.classList.remove('hidden');
        this.dom.iconPause.classList.add('hidden');
        this.dom.startPauseText.textContent =
          state.currentMode === 'competition'
            ? `Tanda ${rt.endNumber}`
            : 'Repetir';
        this.dom.btnNextTurn.classList.add('hidden');
      } else {
        this.dom.iconPlay.classList.remove('hidden');
        this.dom.iconPause.classList.add('hidden');
        this.dom.startPauseText.textContent = 'Iniciar';
        this.dom.btnNextTurn.classList.add('hidden');
      }

      if (state.currentMode === 'competition' && state.competition.format === 'alternating') {
        this.dom.nextTurnText.textContent = 'Sig. Arquero';
      } else {
        this.dom.nextTurnText.textContent = 'Saltar';
      }
    }

    syncInputsFromState(state, soundEngine) {
      this.dom.chkAutoHud.checked = state.autoHud;
      this.dom.chkCountdownPips.checked = state.countdownPips;
      this.dom.soundProfile.value = soundEngine.profile;
      if (this.dom.customAudioGroup) {
        this.dom.customAudioGroup.classList.toggle('hidden', soundEngine.profile !== 'custom');
      }
      this.dom.soundVolume.value = Math.round(soundEngine.volume * 100);
      this.dom.volLabel.textContent = `${Math.round(soundEngine.volume * 100)}%`;

      // Competencia
      this.dom.compFormat.value = state.competition.format;
      this.dom.compShootTime.value = state.competition.shootTime;
      this.dom.compWarnTime.value = state.competition.warnTime;
      this.dom.compPrepTime.value = state.competition.prepTime;
      this.dom.altFirstArcher.value = state.competition.altFirstArcher;
      this.dom.altArrowsPerArcher.value = state.competition.altArrowsPerArcher;
      this.dom.altBufferTime.value = state.competition.altBufferTime;
      if (this.dom.compExternalScreens) {
        this.dom.compExternalScreens.value = String(state.competition.externalScreens || 0);
      }
      this.dom.altMatchOptions.classList.toggle('hidden', state.competition.format !== 'alternating');

      // Mantenciones
      this.dom.holdWorkTime.value = state.holding.workTime;
      this.dom.holdRestTime.value = state.holding.restTime;
      this.dom.holdSeriesCount.value = state.holding.seriesCount;
      this.dom.holdPrepTime.value = state.holding.prepTime;

      // 7x3
      this.dom.nestedRoundsA.value = state.nested7x3.roundsA;
      this.dom.nestedRepsB.value = state.nested7x3.repsB;
      this.dom.nestedHoldX.value = state.nested7x3.holdX;
      this.dom.nestedRestY.value = state.nested7x3.restY;
      this.dom.nestedMacroRestC.value = state.nested7x3.macroRestC;
      this.dom.nestedPrepTime.value = state.nested7x3.prepTime;

      this.updateSummaries(state);
    }

    updateSummaries(state) {
      const h = state.holding;
      const holdTotalSec =
        h.prepTime + h.seriesCount * h.workTime + Math.max(0, h.seriesCount - 1) * h.restTime;
      this.dom.holdSummaryBanner.textContent = `Resumen: ${h.seriesCount} series de ${h.workTime}s de mantención + ${h.restTime}s de descanso · Duración total: ${Domain.formatDurationHuman(holdTotalSec)}`;

      const n = state.nested7x3;
      const oneRoundSec = n.repsB * n.holdX + Math.max(0, n.repsB - 1) * n.restY;
      const nestedTotalSec =
        n.prepTime + n.roundsA * oneRoundSec + Math.max(0, n.roundsA - 1) * n.macroRestC;
      this.dom.nestedSummaryBanner.textContent = `Resumen: ${n.roundsA} rondas de [${n.repsB} × (${n.holdX}s mantener + ${n.restY}s pausa)] con ${n.macroRestC}s entre rondas · Total: ${Domain.formatDurationHuman(nestedTotalSec)}`;
    }

    renderSavedProfiles(state, onLoadProfile, onDeleteProfile) {
      const list = state.savedProfiles[state.currentMode] || [];
      this.dom.savedProfilesList.innerHTML = '';

      if (list.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty-profiles';
        empty.textContent = 'No hay configuraciones guardadas en este modo todavía.';
        this.dom.savedProfilesList.appendChild(empty);
        return;
      }

      list.forEach((item) => {
        const row = document.createElement('div');
        row.className = 'saved-profile-item';

        const info = document.createElement('div');
        info.className = 'saved-profile-info';
        info.title = 'Haz clic para cargar esta configuración';
        const title = document.createElement('strong');
        title.textContent = item.name;
        const desc = document.createElement('span');
        desc.textContent = Domain.getProfileDescription(state.currentMode, item.config);
        info.appendChild(title);
        info.appendChild(desc);

        const actions = document.createElement('div');
        actions.className = 'saved-profile-actions';

        const btnLoad = document.createElement('button');
        btnLoad.type = 'button';
        btnLoad.className = 'btn-load-prof';
        btnLoad.textContent = 'Cargar';
        btnLoad.addEventListener('click', () => onLoadProfile(item));

        const btnDel = document.createElement('button');
        btnDel.type = 'button';
        btnDel.className = 'btn-del-prof';
        btnDel.textContent = '✕';
        btnDel.title = 'Eliminar configuración';
        btnDel.addEventListener('click', () => onDeleteProfile(item.id));

        info.addEventListener('click', () => onLoadProfile(item));

        actions.appendChild(btnLoad);
        actions.appendChild(btnDel);

        row.appendChild(info);
        row.appendChild(actions);
        this.dom.savedProfilesList.appendChild(row);
      });
    }
  }

  Presentation.StageView = StageView;
})(window.AimTimer.Presentation, window.AimTimer.Domain);

