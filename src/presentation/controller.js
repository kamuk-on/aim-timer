/**
 * src/presentation/controller.js
 * Capa de Presentación: Controlador de eventos de interfaz, formularios de configuración
 * y atajos de teclado para operación en línea de tiro.
 */

window.AimTimer = window.AimTimer || {};
window.AimTimer.Presentation = window.AimTimer.Presentation || {};

(function (Presentation, Domain) {
  class UIController {
    constructor({ dom, state, soundEngine, storageRepo, stageView, timerService, profileService }) {
      this.dom = dom;
      this.state = state;
      this.sound = soundEngine;
      this.storage = storageRepo;
      this.view = stageView;
      this.timer = timerService;
      this.profiles = profileService;
    }

    refreshProfilesView() {
      this.view.renderSavedProfiles(
        this.state,
        (item) => {
          if (this.profiles.loadSavedProfile(item, this.sound)) {
            this.view.syncInputsFromState(this.state, this.sound);
            this.timer.resetTimer(false);
          }
        },
        (id) => {
          this.profiles.deleteSavedProfile(id);
          this.refreshProfilesView();
        }
      );
    }

    bindEvents() {
      const { dom, state, sound, storage, view, timer, profiles } = this;
      const notifyBeep = (text, ms) => view.showBeepBadge(text, ms);

      // Cambio de pestañas de modo
      dom.modeTabs.forEach((tab) => {
        tab.addEventListener('click', () => {
          const targetMode = tab.getAttribute('data-mode');
          if (!targetMode || targetMode === state.currentMode) return;

          if (state.runtime.status === 'running' || state.runtime.status === 'paused') {
            timer.resetTimer(false);
          }

          state.currentMode = targetMode;
          dom.modeTabs.forEach((t) => {
            const active = t.getAttribute('data-mode') === targetMode;
            t.classList.toggle('active', active);
            t.setAttribute('aria-selected', String(active));
          });

          dom.modeConfigs.forEach((panel) => {
            panel.classList.toggle('active', panel.id === `config-${targetMode}`);
          });

          this.refreshProfilesView();
          timer.resetTimer(false);
        });
      });

      // Tema Claro / Oscuro
      dom.btnThemeToggle.addEventListener('click', () => {
        const next = view.getTheme() === 'dark' ? 'light' : 'dark';
        view.setTheme(next);
        storage.saveTheme(next);
      });

      // Modal de Ajustes y Sonido
      if (dom.btnOpenSettings && dom.settingsModal) {
        dom.btnOpenSettings.addEventListener('click', () => {
          dom.settingsModal.classList.remove('hidden');
        });
      }
      if (dom.btnCloseSettings && dom.settingsModal) {
        dom.btnCloseSettings.addEventListener('click', () => {
          dom.settingsModal.classList.add('hidden');
        });
      }
      if (dom.settingsModal) {
        dom.settingsModal.addEventListener('click', (e) => {
          if (e.target === dom.settingsModal) {
            dom.settingsModal.classList.add('hidden');
          }
        });
      }

      // Test Bocina Superior
      if (dom.btnTestSound) {
        dom.btnTestSound.addEventListener('click', () => {
          sound.playWASignal(1, notifyBeep);
        });
      }

      // Auto HUD
      dom.chkAutoHud.addEventListener('change', (e) => {
        state.autoHud = e.target.checked;
        storage.saveSettings(state, sound);
      });

      // Expandir / Contraer HUD
      dom.btnToggleHud.addEventListener('click', () => {
        view.setHudMode(!view.isHudMode());
      });

      // Controles de Transporte
      dom.btnStartPause.addEventListener('click', () => timer.startOrPause());
      dom.btnNextTurn.addEventListener('click', () => timer.nextStepOrTurn());
      dom.btnEmergencyStop.addEventListener('click', () => timer.finishSession(false));
      dom.btnReset.addEventListener('click', () => timer.resetTimer(true));

      // Preajustes oficiales World Archery
      dom.waQuickPresets.forEach((chip) => {
        chip.addEventListener('click', () => {
          const key = chip.getAttribute('data-wa-preset');
          const preset = Domain.WA_OFFICIAL_PRESETS[key];
          if (!preset) return;

          dom.waQuickPresets.forEach((c) => c.classList.remove('active'));
          chip.classList.add('active');

          Object.assign(state.competition, {
            format: preset.format,
            shootTime: preset.shootTime,
            warnTime: preset.warnTime,
            prepTime: preset.prepTime,
            altFirstArcher: preset.altFirstArcher,
            altArrowsPerArcher: preset.altArrowsPerArcher,
            altBufferTime: preset.altBufferTime,
          });

          storage.saveSettings(state, sound);
          view.syncInputsFromState(state, sound);
          timer.resetTimer(true);
        });
      });

      // Inputs manuales de Competencia
      const onCompInputChange = () => {
        state.competition.format = dom.compFormat.value;
        state.competition.shootTime = Math.max(5, parseInt(dom.compShootTime.value, 10) || 120);
        state.competition.warnTime = Math.max(0, parseInt(dom.compWarnTime.value, 10) || 0);
        state.competition.prepTime = Math.max(0, parseInt(dom.compPrepTime.value, 10) || 0);
        state.competition.altFirstArcher = dom.altFirstArcher.value;
        state.competition.altArrowsPerArcher = Math.max(1, parseInt(dom.altArrowsPerArcher.value, 10) || 3);
        state.competition.altBufferTime = Math.max(0, parseInt(dom.altBufferTime.value, 10) || 0);
        if (dom.compExternalScreens) {
          state.competition.externalScreens = Math.max(
            0,
            parseInt(dom.compExternalScreens.value, 10) || 0
          );
        }

        dom.altMatchOptions.classList.toggle('hidden', state.competition.format !== 'alternating');
        storage.saveSettings(state, sound);
        if (state.runtime.status === 'idle' || state.runtime.status === 'finished') {
          timer.resetTimer(false);
        }
      };

      [
        dom.compFormat,
        dom.compShootTime,
        dom.compWarnTime,
        dom.compPrepTime,
        dom.altFirstArcher,
        dom.altArrowsPerArcher,
        dom.altBufferTime,
        dom.compExternalScreens,
      ]
        .filter(Boolean)
        .forEach((el) => el.addEventListener('change', onCompInputChange));

      // Preajustes rápidos Mantenciones
      dom.holdQuickPresets.forEach((chip) => {
        chip.addEventListener('click', () => {
          const raw = chip.getAttribute('data-hold-preset');
          if (!raw) return;
          const [w, r, s] = raw.split('-').map(Number);
          dom.holdQuickPresets.forEach((c) => c.classList.remove('active'));
          chip.classList.add('active');

          state.holding.workTime = w;
          state.holding.restTime = r;
          state.holding.seriesCount = s;
          storage.saveSettings(state, sound);
          view.syncInputsFromState(state, sound);
          timer.resetTimer(false);
        });
      });

      // Inputs manuales Mantenciones
      const onHoldInputChange = () => {
        state.holding.workTime = Math.max(1, parseInt(dom.holdWorkTime.value, 10) || 20);
        state.holding.restTime = Math.max(1, parseInt(dom.holdRestTime.value, 10) || 20);
        state.holding.seriesCount = Math.max(1, parseInt(dom.holdSeriesCount.value, 10) || 10);
        state.holding.prepTime = Math.max(0, parseInt(dom.holdPrepTime.value, 10) || 0);
        storage.saveSettings(state, sound);
        view.updateSummaries(state);
        if (state.runtime.status === 'idle' || state.runtime.status === 'finished') {
          timer.resetTimer(false);
        }
      };

      [dom.holdWorkTime, dom.holdRestTime, dom.holdSeriesCount, dom.holdPrepTime].forEach((el) =>
        el.addEventListener('input', onHoldInputChange)
      );

      // Preajustes rápidos 7x3
      dom.nestedQuickPresets.forEach((chip) => {
        chip.addEventListener('click', () => {
          const key = chip.getAttribute('data-nested-preset');
          const preset = Domain.NESTED_7X3_PRESETS[key];
          if (!preset) return;
          dom.nestedQuickPresets.forEach((c) => c.classList.remove('active'));
          chip.classList.add('active');

          Object.assign(state.nested7x3, preset);
          storage.saveSettings(state, sound);
          view.syncInputsFromState(state, sound);
          timer.resetTimer(false);
        });
      });

      // Inputs manuales 7x3
      const onNestedInputChange = () => {
        state.nested7x3.roundsA = Math.max(1, parseInt(dom.nestedRoundsA.value, 10) || 4);
        state.nested7x3.repsB = Math.max(1, parseInt(dom.nestedRepsB.value, 10) || 6);
        state.nested7x3.holdX = Math.max(1, parseInt(dom.nestedHoldX.value, 10) || 7);
        state.nested7x3.restY = Math.max(1, parseInt(dom.nestedRestY.value, 10) || 3);
        state.nested7x3.macroRestC = Math.max(5, parseInt(dom.nestedMacroRestC.value, 10) || 120);
        state.nested7x3.prepTime = Math.max(0, parseInt(dom.nestedPrepTime.value, 10) || 0);
        storage.saveSettings(state, sound);
        view.updateSummaries(state);
        if (state.runtime.status === 'idle' || state.runtime.status === 'finished') {
          timer.resetTimer(false);
        }
      };

      [
        dom.nestedRoundsA,
        dom.nestedRepsB,
        dom.nestedHoldX,
        dom.nestedRestY,
        dom.nestedMacroRestC,
        dom.nestedPrepTime,
      ].forEach((el) => el.addEventListener('input', onNestedInputChange));

      // Controles de Sonido Oficial WA
      dom.soundProfile.addEventListener('change', (e) => {
        sound.profile = e.target.value;
        if (dom.customAudioGroup) {
          dom.customAudioGroup.classList.toggle('hidden', sound.profile !== 'custom');
        }
        storage.saveSettings(state, sound);
        sound.playWASignal(1, notifyBeep);
      });

      if (dom.btnTest1Beep) {
        dom.btnTest1Beep.addEventListener('click', () => sound.playWASignal(1, notifyBeep));
      }
      if (dom.btnTest2Beeps) {
        dom.btnTest2Beeps.addEventListener('click', () => sound.playWASignal(2, notifyBeep));
      }
      if (dom.btnTest3Beeps) {
        dom.btnTest3Beeps.addEventListener('click', () => sound.playWASignal(3, notifyBeep));
      }

      if (dom.fileCustomAudio) {
        dom.fileCustomAudio.addEventListener('change', async (e) => {
          const file = e.target.files && e.target.files[0];
          if (!file) return;
          try {
            await sound.loadCustomAudioFile(file);
            sound.playWASignal(1, notifyBeep);
          } catch (err) {
            alert('No se pudo decodificar el archivo de audio seleccionado.');
          }
        });
      }

      dom.soundVolume.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10) || 100;
        sound.volume = val / 100;
        dom.volLabel.textContent = `${val}%`;
        storage.saveSettings(state, sound);
      });

      dom.chkCountdownPips.addEventListener('change', (e) => {
        state.countdownPips = e.target.checked;
        storage.saveSettings(state, sound);
      });

      // Guardar / Exportar / Importar Perfiles
      const handleSaveProfile = () => {
        profiles.saveCurrentProfile(dom.customProfileName.value);
        dom.customProfileName.value = '';
        this.refreshProfilesView();
      };

      dom.btnSaveProfile.addEventListener('click', handleSaveProfile);
      dom.customProfileName.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSaveProfile();
      });

      dom.btnExportProfiles.addEventListener('click', () => {
        profiles.exportAllProfilesToJson();
      });

      dom.btnImportProfiles.addEventListener('click', () => {
        dom.fileImportProfiles.click();
      });

      dom.fileImportProfiles.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          try {
            profiles.importProfilesFromJsonString(String(reader.result));
            this.refreshProfilesView();
          } catch (err) {
            alert('El archivo seleccionado no tiene un formato JSON válido de AimTimer.');
          }
        };
        reader.readAsText(file);
        e.target.value = '';
      });

      // Atajos de teclado
      window.addEventListener('keydown', (e) => {
        const tag = document.activeElement ? document.activeElement.tagName : '';
        if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

        if (e.code === 'Space') {
          e.preventDefault();
          timer.startOrPause();
        } else if (e.key === 'n' || e.key === 'N') {
          e.preventDefault();
          timer.nextStepOrTurn();
        } else if (e.key === 'e' || e.key === 'E') {
          e.preventDefault();
          timer.finishSession(false);
        } else if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          timer.resetTimer(true);
        } else if (e.key === 'f' || e.key === 'F') {
          e.preventDefault();
          view.setHudMode(!view.isHudMode());
        } else if (e.key === 'Escape') {
          if (dom.settingsModal && !dom.settingsModal.classList.contains('hidden')) {
            dom.settingsModal.classList.add('hidden');
          } else if (view.isHudMode()) {
            view.setHudMode(false);
          }
        }
      });
    }
  }

  Presentation.UIController = UIController;
})(window.AimTimer.Presentation, window.AimTimer.Domain);

