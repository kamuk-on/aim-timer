/**
 * src/presentation/domElements.js
 * Capa de Presentación: Mapeo centralizado de nodos del DOM.
 */

window.AimTimer = window.AimTimer || {};
window.AimTimer.Presentation = window.AimTimer.Presentation || {};

(function (Presentation) {
  function getDomReferences() {
    return {
      html: document.documentElement,
      body: document.body,
      modeTabs: document.querySelectorAll('.mode-tab'),
      modeConfigs: document.querySelectorAll('.mode-config'),
      btnThemeToggle: document.getElementById('btnThemeToggle'),
      btnOpenSettings: document.getElementById('btnOpenSettings'),
      btnCloseSettings: document.getElementById('btnCloseSettings'),
      settingsModal: document.getElementById('settingsModal'),
      btnTestSound: document.getElementById('btnTestSound'),
      chkAutoHud: document.getElementById('chkAutoHud'),

      // Escenario de Tiro (Stage)
      timerStage: document.getElementById('timerStage'),
      stageModeLabel: document.getElementById('stageModeLabel'),
      stageLineBadge: document.getElementById('stageLineBadge'),
      stageBeepIndicator: document.getElementById('stageBeepIndicator'),
      btnToggleHud: document.getElementById('btnToggleHud'),
      hudBtnText: document.getElementById('hudBtnText'),
      phaseBanner: document.getElementById('phaseBanner'),
      clockDisplay: document.getElementById('clockDisplay'),
      clockTenths: document.getElementById('clockTenths'),
      progressBar: document.getElementById('progressBar'),
      metric1Label: document.getElementById('metric1Label'),
      metric1Value: document.getElementById('metric1Value'),
      metric2Label: document.getElementById('metric2Label'),
      metric2Value: document.getElementById('metric2Value'),
      metric3Label: document.getElementById('metric3Label'),
      metric3Value: document.getElementById('metric3Value'),

      // Controles de transporte
      btnStartPause: document.getElementById('btnStartPause'),
      iconPlay: document.getElementById('iconPlay'),
      iconPause: document.getElementById('iconPause'),
      startPauseText: document.getElementById('startPauseText'),
      btnNextTurn: document.getElementById('btnNextTurn'),
      nextTurnText: document.getElementById('nextTurnText'),
      btnEmergencyStop: document.getElementById('btnEmergencyStop'),
      btnReset: document.getElementById('btnReset'),

      // Inputs Competencia
      waQuickPresets: document.querySelectorAll('[data-wa-preset]'),
      compFormat: document.getElementById('compFormat'),
      compShootTime: document.getElementById('compShootTime'),
      compWarnTime: document.getElementById('compWarnTime'),
      compPrepTime: document.getElementById('compPrepTime'),
      altMatchOptions: document.getElementById('altMatchOptions'),
      altFirstArcher: document.getElementById('altFirstArcher'),
      altArrowsPerArcher: document.getElementById('altArrowsPerArcher'),
      altBufferTime: document.getElementById('altBufferTime'),
      compExternalScreens: document.getElementById('compExternalScreens'),

      // Inputs Mantenciones
      holdQuickPresets: document.querySelectorAll('[data-hold-preset]'),
      holdWorkTime: document.getElementById('holdWorkTime'),
      holdRestTime: document.getElementById('holdRestTime'),
      holdSeriesCount: document.getElementById('holdSeriesCount'),
      holdPrepTime: document.getElementById('holdPrepTime'),
      holdSummaryBanner: document.getElementById('holdSummaryBanner'),

      // Inputs 7x3
      nestedQuickPresets: document.querySelectorAll('[data-nested-preset]'),
      nestedRoundsA: document.getElementById('nestedRoundsA'),
      nestedRepsB: document.getElementById('nestedRepsB'),
      nestedHoldX: document.getElementById('nestedHoldX'),
      nestedRestY: document.getElementById('nestedRestY'),
      nestedMacroRestC: document.getElementById('nestedMacroRestC'),
      nestedPrepTime: document.getElementById('nestedPrepTime'),
      nestedSummaryBanner: document.getElementById('nestedSummaryBanner'),

      // Sonido y Perfiles
      soundProfile: document.getElementById('soundProfile'),
      soundVolume: document.getElementById('soundVolume'),
      volLabel: document.getElementById('volLabel'),
      btnTest1Beep: document.getElementById('btnTest1Beep'),
      btnTest2Beeps: document.getElementById('btnTest2Beeps'),
      btnTest3Beeps: document.getElementById('btnTest3Beeps'),
      customAudioGroup: document.getElementById('customAudioGroup'),
      fileCustomAudio: document.getElementById('fileCustomAudio'),
      chkCountdownPips: document.getElementById('chkCountdownPips'),
      customProfileName: document.getElementById('customProfileName'),
      btnSaveProfile: document.getElementById('btnSaveProfile'),
      savedProfilesList: document.getElementById('savedProfilesList'),
      btnExportProfiles: document.getElementById('btnExportProfiles'),
      btnImportProfiles: document.getElementById('btnImportProfiles'),
      fileImportProfiles: document.getElementById('fileImportProfiles'),
    };
  }

  Presentation.getDomReferences = getDomReferences;
})(window.AimTimer.Presentation);

