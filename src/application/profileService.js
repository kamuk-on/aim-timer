/**
 * src/application/profileService.js
 * Capa de Aplicación (Casos de Uso): Gestión de perfiles guardados, carga de preajustes
 * y exportación/importación en formato JSON.
 */

window.AimTimer = window.AimTimer || {};
window.AimTimer.Application = window.AimTimer.Application || {};

(function (Application) {
  class ProfileService {
    constructor({ state, storageRepo }) {
      this.state = state;
      this.storage = storageRepo;
    }

    saveCurrentProfile(rawName) {
      const mode = this.state.currentMode;
      const modeLabel =
        mode === 'competition'
          ? 'Competencia'
          : mode === 'holding'
          ? 'Mantención'
          : 'Rutina 7×3';

      const name =
        (rawName && rawName.trim()) ||
        `${modeLabel} (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;

      const currentConfigClone = JSON.parse(JSON.stringify(this.state[mode]));
      const newEntry = {
        id: `prof-${Date.now()}`,
        name,
        config: currentConfigClone,
      };

      this.state.savedProfiles[mode].unshift(newEntry);
      this.storage.saveProfiles(this.state.savedProfiles);
      return newEntry;
    }

    loadSavedProfile(item, soundEngine) {
      if (!item || !item.config) return false;
      const mode = this.state.currentMode;
      Object.assign(this.state[mode], JSON.parse(JSON.stringify(item.config)));
      this.storage.saveSettings(this.state, soundEngine);
      return true;
    }

    deleteSavedProfile(id) {
      const mode = this.state.currentMode;
      this.state.savedProfiles[mode] = this.state.savedProfiles[mode].filter(
        (p) => p.id !== id
      );
      this.storage.saveProfiles(this.state.savedProfiles);
    }

    exportAllProfilesToJson() {
      const dataStr = JSON.stringify(this.state.savedProfiles, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aimtimer-perfiles-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }

    importProfilesFromJsonString(jsonString) {
      const imported = JSON.parse(jsonString);
      if (!imported.competition && !imported.holding && !imported.nested7x3) {
        throw new Error('Formato inválido');
      }
      if (Array.isArray(imported.competition)) {
        this.state.savedProfiles.competition = imported.competition;
      }
      if (Array.isArray(imported.holding)) {
        this.state.savedProfiles.holding = imported.holding;
      }
      if (Array.isArray(imported.nested7x3)) {
        this.state.savedProfiles.nested7x3 = imported.nested7x3;
      }
      this.storage.saveProfiles(this.state.savedProfiles);
    }
  }

  Application.ProfileService = ProfileService;
})(window.AimTimer.Application);

