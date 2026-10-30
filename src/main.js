/**
 * src/main.js
 * Composition Root (Inyección de Dependencias e Inicialización de la Aplicación).
 * Conecta las capas Domain, Infrastructure, Application y Presentation.
 */

(function () {
  const { Domain, Infrastructure, Application, Presentation } = window.AimTimer;

  // 1. Instanciar Estado de Dominio e Infraestructura
  const state = Domain.createInitialState();
  const soundEngine = new Infrastructure.SoundEngine();
  const storageRepo = new Infrastructure.StorageRepository();
  const displaySync = new Infrastructure.DisplaySyncManager();

  // 2. Instanciar Vista y Referencias DOM (Presentación)
  const dom = Presentation.getDomReferences();
  const stageView = new Presentation.StageView(dom, displaySync);

  // 3. Instanciar Casos de Uso / Servicios (Aplicación)
  const timerService = new Application.TimerService({
    state,
    soundEngine,
    stageView,
    displaySync,
    buildSessionSteps: Domain.buildSessionSteps,
  });

  const profileService = new Application.ProfileService({
    state,
    storageRepo,
  });

  // 4. Instanciar Controlador de Interfaz (Presentación)
  const controller = new Presentation.UIController({
    dom,
    state,
    soundEngine,
    storageRepo,
    stageView,
    timerService,
    profileService,
  });

  // 5. Inicializar estado persistido y renderizar vista inicial
  const initialTheme = storageRepo.loadTheme();
  stageView.setTheme(initialTheme);
  storageRepo.loadSettingsAndProfiles(state, soundEngine);

  stageView.syncInputsFromState(state, soundEngine);
  controller.refreshProfilesView();
  controller.bindEvents();
  timerService.resetTimer(true);
})();

