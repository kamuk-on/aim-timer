/**
 * src/domain/sequenceBuilder.js
 * Capa de Dominio: Generador puro de secuencias de fases (Steps) según el reglamento
 * World Archery y los protocolos de entrenamiento Bowtraining (Mantenciones y 7×3).
 */

window.AimTimer = window.AimTimer || {};
window.AimTimer.Domain = window.AimTimer.Domain || {};

(function (Domain) {
  /**
   * Construye la lista de fases (steps) según el estado actual de dominio.
   * @param {Object} state Estado completo de configuración y runtime
   * @returns {Array<Object>} Lista de objetos Step
   */
  function buildSessionSteps(state) {
    const steps = [];

    if (state.currentMode === 'competition') {
      const cfg = state.competition;
      const endNum = state.runtime.endNumber;

      if (cfg.format === 'single') {
        if (cfg.prepTime > 0) {
          steps.push({
            type: 'prep',
            label: 'PREPARACIÓN — LÍNEA DE TIRO',
            durationSec: cfg.prepTime,
            warnSec: 0,
            colorState: 'state-red',
            startBeeps: 2,
            enableCountdownPips: false,
            lineBadge: 'LÍNEA ÚNICA',
            metrics: [
              { label: 'TANDA / END', value: `${endNum}` },
              { label: 'LÍNEA ACTIVA', value: 'TODAS' },
              { label: 'FASE', value: 'PREP' },
            ],
          });
        }
        steps.push({
          type: 'shoot',
          label: 'TIRO ACTIVO',
          durationSec: cfg.shootTime,
          warnSec: cfg.warnTime,
          colorState: 'state-green',
          startBeeps: 1,
          enableCountdownPips: false,
          lineBadge: 'LÍNEA ÚNICA',
          metrics: [
            { label: 'TANDA / END', value: `${endNum}` },
            { label: 'LÍNEA ACTIVA', value: 'TODAS' },
            { label: 'ADVERTENCIA', value: `${cfg.warnTime}s` },
          ],
        });
      } else if (cfg.format === 'abcd' || cfg.format === 'ab') {
        const pair1 = cfg.format === 'abcd' ? 'AB' : 'A';
        const pair2 = cfg.format === 'abcd' ? 'CD' : 'B';
        // Rotación automática en cada tanda: Tanda impar (AB -> CD), Tanda par (CD -> AB)
        const order = endNum % 2 === 1 ? [pair1, pair2] : [pair2, pair1];

        order.forEach((turnName, idx) => {
          if (cfg.prepTime > 0) {
            steps.push({
              type: 'prep',
              label: `PREPARACIÓN — LÍNEA ${turnName}`,
              durationSec: cfg.prepTime,
              warnSec: 0,
              colorState: 'state-red',
              startBeeps: 2,
              enableCountdownPips: false,
              lineBadge: `ORDEN: ${order[0]} → ${order[1]}`,
              metrics: [
                { label: 'TANDA / END', value: `${endNum}` },
                { label: 'ENTRA A LÍNEA', value: turnName },
                { label: 'TURNO', value: `${idx + 1} / 2` },
              ],
            });
          }
          steps.push({
            type: 'shoot',
            label: `TIRANDO — LÍNEA ${turnName}`,
            durationSec: cfg.shootTime,
            warnSec: cfg.warnTime,
            colorState: 'state-green',
            startBeeps: 1,
            enableCountdownPips: false,
            lineBadge: `ORDEN: ${order[0]} → ${order[1]}`,
            metrics: [
              { label: 'TANDA / END', value: `${endNum}` },
              { label: 'LÍNEA ACTIVA', value: turnName },
              { label: 'TURNO', value: `${idx + 1} / 2` },
            ],
          });
        });
      } else if (cfg.format === 'alternating') {
        const first = cfg.altFirstArcher === 'B' ? 'B' : 'A';
        const second = first === 'A' ? 'B' : 'A';
        const arrows = Math.max(1, cfg.altArrowsPerArcher);
        const totalTurns = arrows * 2;

        if (cfg.prepTime > 0) {
          steps.push({
            type: 'prep',
            label: `PREPARACIÓN SET — INICIA ARQUERO ${first}`,
            durationSec: cfg.prepTime,
            warnSec: 0,
            colorState: 'state-red',
            startBeeps: 2,
            enableCountdownPips: false,
            lineBadge: `TIRO ALTERNO (${first} → ${second})`,
            metrics: [
              { label: 'SET / END', value: `${endNum}` },
              { label: 'INICIA', value: `ARQ. ${first}` },
              { label: 'FLECHAS', value: `0 / ${totalTurns}` },
            ],
          });
        }

        for (let t = 0; t < totalTurns; t++) {
          const archer = t % 2 === 0 ? first : second;
          const arrowNum = Math.floor(t / 2) + 1;

          if (t > 0 && cfg.altBufferTime > 0) {
            steps.push({
              type: 'buffer',
              label: `CAMBIO DE TURNO → ARQUERO ${archer}`,
              durationSec: cfg.altBufferTime,
              warnSec: 0,
              colorState: 'state-red',
              startBeeps: 0,
              enableCountdownPips: false,
              lineBadge: 'TIRO ALTERNO',
              metrics: [
                { label: 'SIGUIENTE', value: `ARQ. ${archer}` },
                { label: 'FLECHA #', value: `${arrowNum} / ${arrows}` },
                { label: 'TURNO SET', value: `${t + 1} / ${totalTurns}` },
              ],
            });
          }

          steps.push({
            type: 'shoot',
            label: `TURNO ARQUERO ${archer} — FLECHA ${arrowNum}`,
            durationSec: cfg.shootTime,
            warnSec: cfg.warnTime,
            colorState: 'state-green',
            startBeeps: 1,
            enableCountdownPips: false,
            lineBadge: 'MATCH PLAY ALTERNO',
            metrics: [
              { label: 'TURNO ACTIVO', value: `ARQ. ${archer}` },
              { label: 'FLECHA ARQ.', value: `${arrowNum} / ${arrows}` },
              { label: 'TURNO SET', value: `${t + 1} / ${totalTurns}` },
            ],
          });
        }
      }
    } else if (state.currentMode === 'holding') {
      const cfg = state.holding;
      const totalSeries = Math.max(1, cfg.seriesCount);

      if (cfg.prepTime > 0) {
        steps.push({
          type: 'prep',
          label: 'PREPARACIÓN — TOMAR ARCO',
          durationSec: cfg.prepTime,
          warnSec: 0,
          colorState: 'state-red',
          startBeeps: 2,
          enableCountdownPips: true,
          lineBadge: 'BOWTRAINING MANTENCIONES',
          metrics: [
            { label: 'SERIE ACTUAL', value: `1 / ${totalSeries}` },
            { label: 'MANTENCIÓN', value: `${cfg.workTime}s` },
            { label: 'DESCANSO', value: `${cfg.restTime}s` },
          ],
        });
      }

      for (let s = 1; s <= totalSeries; s++) {
        steps.push({
          type: 'hold',
          label: `MANTENER APERTURA — SERIE ${s} DE ${totalSeries}`,
          durationSec: cfg.workTime,
          warnSec: 0,
          colorState: 'state-green',
          startBeeps: 1,
          enableCountdownPips: true,
          lineBadge: 'ABRIR Y ANCLAR',
          metrics: [
            { label: 'SERIE', value: `${s} / ${totalSeries}` },
            { label: 'ACCIÓN', value: 'MANTENER' },
            { label: 'SIGUIENTE', value: s < totalSeries ? `DESC. ${cfg.restTime}s` : 'FIN' },
          ],
        });

        if (s < totalSeries) {
          steps.push({
            type: 'rest',
            label: `DESCANSO — BAJAR ARCO (${s} / ${totalSeries})`,
            durationSec: cfg.restTime,
            warnSec: 0,
            colorState: 'state-amber',
            startBeeps: 'rest_tone',
            enableCountdownPips: true,
            lineBadge: 'RECUPERACIÓN',
            metrics: [
              { label: 'COMPLETADAS', value: `${s} / ${totalSeries}` },
              { label: 'ACCIÓN', value: 'DESCANSAR' },
              { label: 'PRÓXIMA', value: `SERIE ${s + 1}` },
            ],
          });
        }
      }
    } else if (state.currentMode === 'nested7x3') {
      const cfg = state.nested7x3;
      const A = Math.max(1, cfg.roundsA);
      const B = Math.max(1, cfg.repsB);

      if (cfg.prepTime > 0) {
        steps.push({
          type: 'prep',
          label: 'PREPARACIÓN — BOWTRAINING 7×3',
          durationSec: cfg.prepTime,
          warnSec: 0,
          colorState: 'state-red',
          startBeeps: 2,
          enableCountdownPips: true,
          lineBadge: `${A} RONDAS × ${B} REPETICIONES`,
          metrics: [
            { label: 'RONDA MAYOR', value: `1 / ${A}` },
            { label: 'SERIE MENOR', value: `1 / ${B}` },
            { label: 'CICLO', value: `${cfg.holdX}s / ${cfg.restY}s` },
          ],
        });
      }

      for (let r = 1; r <= A; r++) {
        for (let rep = 1; rep <= B; rep++) {
          steps.push({
            type: 'hold',
            label: `MANTENER APERTURA — RONDA ${r}/${A} · REP ${rep}/${B}`,
            durationSec: cfg.holdX,
            warnSec: 0,
            colorState: 'state-green',
            startBeeps: 1,
            enableCountdownPips: true,
            lineBadge: `RONDA ${r} DE ${A}`,
            metrics: [
              { label: 'RONDA MAYOR', value: `${r} / ${A}` },
              { label: 'SERIE MENOR', value: `${rep} / ${B}` },
              { label: 'ESTADO', value: 'MANTENER' },
            ],
          });

          if (rep < B) {
            steps.push({
              type: 'rest',
              label: `MICRO-DESCANSO (${cfg.restY}s) — RONDA ${r}/${A}`,
              durationSec: cfg.restY,
              warnSec: 0,
              colorState: 'state-amber',
              startBeeps: 'rest_tone',
              enableCountdownPips: true,
              lineBadge: `RONDA ${r} DE ${A}`,
              metrics: [
                { label: 'RONDA MAYOR', value: `${r} / ${A}` },
                { label: 'SERIE MENOR', value: `${rep} / ${B}` },
                { label: 'SIGUIENTE', value: `REP ${rep + 1}` },
              ],
            });
          }
        }

        if (r < A) {
          steps.push({
            type: 'macro_rest',
            label: `DESCANSO ENTRE RONDAS — FIN RONDA ${r} DE ${A}`,
            durationSec: cfg.macroRestC,
            warnSec: 0,
            colorState: 'state-blue',
            startBeeps: 2,
            enableCountdownPips: true,
            lineBadge: 'DESCANSO DE RONDA MAYOR',
            metrics: [
              { label: 'RONDA FIN.', value: `${r} / ${A}` },
              { label: 'ESTADO', value: 'PAUSA LARGA' },
              { label: 'PRÓXIMA', value: `RONDA ${r + 1}` },
            ],
          });
        }
      }
    }

    return steps;
  }

  Domain.buildSessionSteps = buildSessionSteps;
})(window.AimTimer.Domain);

