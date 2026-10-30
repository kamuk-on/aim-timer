/**
 * src/domain/presets.js
 * Capa de Dominio: Entidades de configuración, preajustes oficiales World Archery / Bowtraining
 * y funciones puras de cálculo de resúmenes.
 */

window.AimTimer = window.AimTimer || {};
window.AimTimer.Domain = window.AimTimer.Domain || {};

(function (Domain) {
  const WA_OFFICIAL_PRESETS = {
    outdoor6: {
      name: '240s (6 Flechas Outdoor)',
      format: 'abcd',
      shootTime: 240,
      warnTime: 30,
      prepTime: 10,
      altFirstArcher: 'A',
      altArrowsPerArcher: 3,
      altBufferTime: 0,
    },
    indoor3: {
      name: '120s (3 Flechas Indoor)',
      format: 'abcd',
      shootTime: 120,
      warnTime: 30,
      prepTime: 10,
      altFirstArcher: 'A',
      altArrowsPerArcher: 3,
      altBufferTime: 0,
    },
    altIndividual: {
      name: '20s Tiro Alterno Individual',
      format: 'alternating',
      shootTime: 20,
      warnTime: 5,
      prepTime: 10,
      altFirstArcher: 'A',
      altArrowsPerArcher: 3,
      altBufferTime: 0,
    },
    mixedTeam: {
      name: '80s Equipos Mixtos (4 fl.)',
      format: 'alternating',
      shootTime: 80,
      warnTime: 20,
      prepTime: 10,
      altFirstArcher: 'A',
      altArrowsPerArcher: 1,
      altBufferTime: 0,
    },
    teamRecurve: {
      name: '120s Equipos (6 fl.)',
      format: 'alternating',
      shootTime: 120,
      warnTime: 30,
      prepTime: 10,
      altFirstArcher: 'A',
      altArrowsPerArcher: 1,
      altBufferTime: 0,
    },
    singleEnd3: {
      name: '120s Línea Única',
      format: 'single',
      shootTime: 120,
      warnTime: 30,
      prepTime: 10,
      altFirstArcher: 'A',
      altArrowsPerArcher: 3,
      altBufferTime: 0,
    },
  };

  const NESTED_7X3_PRESETS = {
    clasico: { roundsA: 4, repsB: 6, holdX: 7, restY: 3, macroRestC: 120, prepTime: 10 },
    intermedio: { roundsA: 5, repsB: 7, holdX: 8, restY: 3, macroRestC: 120, prepTime: 10 },
    elite: { roundsA: 6, repsB: 6, holdX: 10, restY: 3, macroRestC: 90, prepTime: 10 },
  };

  function createInitialState() {
    return {
      currentMode: 'competition', // 'competition' | 'holding' | 'nested7x3'
      autoHud: true,
      countdownPips: true,

      competition: {
        format: 'abcd', // 'single' | 'abcd' | 'ab' | 'alternating'
        shootTime: 240,
        warnTime: 30,
        prepTime: 10,
        altFirstArcher: 'A',
        altArrowsPerArcher: 3,
        altBufferTime: 0,
        externalScreens: 0,
      },
      holding: {
        workTime: 20,
        restTime: 20,
        seriesCount: 12,
        prepTime: 10,
      },
      nested7x3: {
        roundsA: 4,
        repsB: 6,
        holdX: 7,
        restY: 3,
        macroRestC: 120,
        prepTime: 10,
      },

      savedProfiles: {
        competition: [
          {
            id: 'default-wa-18m',
            name: 'Sala 18m Oficial (120s AB/CD)',
            config: {
              format: 'abcd',
              shootTime: 120,
              warnTime: 30,
              prepTime: 10,
              altFirstArcher: 'A',
              altArrowsPerArcher: 3,
              altBufferTime: 0,
            },
          },
          {
            id: 'default-wa-70m',
            name: 'Aire Libre 70m/50m (240s AB/CD)',
            config: {
              format: 'abcd',
              shootTime: 240,
              warnTime: 30,
              prepTime: 10,
              altFirstArcher: 'A',
              altArrowsPerArcher: 3,
              altBufferTime: 0,
            },
          },
        ],
        holding: [
          {
            id: 'default-hold-20-20',
            name: 'Mantenciones 20s / 20s × 12',
            config: { workTime: 20, restTime: 20, seriesCount: 12, prepTime: 10 },
          },
          {
            id: 'default-hold-30-30',
            name: 'Fuerza Isométrica 30s / 30s × 8',
            config: { workTime: 30, restTime: 30, seriesCount: 8, prepTime: 10 },
          },
        ],
        nested7x3: [
          {
            id: 'default-7x3-std',
            name: 'Clásico 7×3 (4 Rondas × 6 Series)',
            config: { roundsA: 4, repsB: 6, holdX: 7, restY: 3, macroRestC: 120, prepTime: 10 },
          },
          {
            id: 'default-7x3-pro',
            name: 'Potencia 8×3 (5 Rondas × 7 Series)',
            config: { roundsA: 5, repsB: 7, holdX: 8, restY: 3, macroRestC: 120, prepTime: 10 },
          },
        ],
      },

      runtime: {
        status: 'idle', // 'idle' | 'running' | 'paused' | 'finished'
        steps: [],
        stepIndex: 0,
        remainingMs: 0,
        stepTotalMs: 0,
        lastTickPerf: 0,
        rafId: null,
        endNumber: 1,
        lastPipSecond: null,
      },
    };
  }

  function formatDurationHuman(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${String(secs).padStart(2, '0')}s`;
  }

  function getProfileDescription(mode, cfg) {
    if (mode === 'competition') {
      const fmtMap = {
        single: 'Línea Única',
        abcd: 'Líneas AB/CD',
        ab: 'Líneas A/B',
        alternating: `Tiro Alterno (${cfg.altArrowsPerArcher} fl.)`,
      };
      return `${cfg.shootTime}s tiro · ${cfg.warnTime}s adv. · ${cfg.prepTime}s prep. · ${fmtMap[cfg.format] || cfg.format}`;
    }
    if (mode === 'holding') {
      return `${cfg.seriesCount} series × (${cfg.workTime}s mantener / ${cfg.restTime}s descanso) · Prep ${cfg.prepTime}s`;
    }
    return `${cfg.roundsA} rondas × [${cfg.repsB} series de ${cfg.holdX}s / ${cfg.restY}s] · Pausa ${cfg.macroRestC}s`;
  }

  Domain.WA_OFFICIAL_PRESETS = WA_OFFICIAL_PRESETS;
  Domain.NESTED_7X3_PRESETS = NESTED_7X3_PRESETS;
  Domain.createInitialState = createInitialState;
  Domain.formatDurationHuman = formatDurationHuman;
  Domain.getProfileDescription = getProfileDescription;
})(window.AimTimer.Domain);

