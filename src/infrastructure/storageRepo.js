/**
 * src/infrastructure/storageRepo.js
 * Capa de Infraestructura: Repositorio de persistencia en LocalStorage para temas,
 * parámetros de temporizador y perfiles personalizados del usuario.
 */

window.AimTimer = window.AimTimer || {};
window.AimTimer.Infrastructure = window.AimTimer.Infrastructure || {};

(function (Infrastructure) {
  const STORAGE_KEYS = {
    THEME: 'aimtimer_theme_v1',
    SETTINGS: 'aimtimer_settings_v1',
    PROFILES: 'aimtimer_profiles_v1',
  };

  const VALID_SOUND_PROFILES = ['danage', 'chronotir', 'wa_arena', 'whistle', 'custom'];

  class StorageRepository {
    loadTheme() {
      try {
        const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
        if (savedTheme === 'light' || savedTheme === 'dark') {
          return savedTheme;
        }
      } catch (err) {
        console.warn('No se pudo leer el tema:', err);
      }
      return 'dark';
    }

    saveTheme(theme) {
      try {
        localStorage.setItem(STORAGE_KEYS.THEME, theme);
      } catch (err) {
        console.warn('No se pudo guardar el tema:', err);
      }
    }

    loadSettingsAndProfiles(state, soundEngine) {
      try {
        const rawSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        if (rawSettings) {
          const parsed = JSON.parse(rawSettings);
          if (parsed.competition) Object.assign(state.competition, parsed.competition);
          if (parsed.holding) Object.assign(state.holding, parsed.holding);
          if (parsed.nested7x3) Object.assign(state.nested7x3, parsed.nested7x3);
          if (typeof parsed.autoHud === 'boolean') state.autoHud = parsed.autoHud;
          if (typeof parsed.countdownPips === 'boolean') state.countdownPips = parsed.countdownPips;

          if (parsed.soundProfile && VALID_SOUND_PROFILES.includes(parsed.soundProfile)) {
            soundEngine.profile = parsed.soundProfile;
          } else {
            soundEngine.profile = 'danage';
          }

          if (typeof parsed.soundVolume === 'number') {
            soundEngine.volume = parsed.soundVolume;
          }
        }

        const rawProfiles = localStorage.getItem(STORAGE_KEYS.PROFILES);
        if (rawProfiles) {
          const parsedProfiles = JSON.parse(rawProfiles);
          if (parsedProfiles.competition) state.savedProfiles.competition = parsedProfiles.competition;
          if (parsedProfiles.holding) state.savedProfiles.holding = parsedProfiles.holding;
          if (parsedProfiles.nested7x3) state.savedProfiles.nested7x3 = parsedProfiles.nested7x3;
        }
      } catch (err) {
        console.warn('No se pudo cargar la configuración previa:', err);
      }
    }

    saveSettings(state, soundEngine) {
      try {
        const payload = {
          competition: state.competition,
          holding: state.holding,
          nested7x3: state.nested7x3,
          autoHud: state.autoHud,
          countdownPips: state.countdownPips,
          soundProfile: soundEngine.profile,
          soundVolume: soundEngine.volume,
        };
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(payload));
      } catch (err) {
        console.warn('Error guardando configuración:', err);
      }
    }

    saveProfiles(savedProfiles) {
      try {
        localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(savedProfiles));
      } catch (err) {
        console.warn('Error guardando perfiles:', err);
      }
    }
  }

  Infrastructure.StorageRepository = StorageRepository;
})(window.AimTimer.Infrastructure);

