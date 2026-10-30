/**
 * src/infrastructure/displaySync.js
 * Capa de Infraestructura: Gestor de sincronización y apertura de pantallas externas
 * de proyección para competencias.
 */

window.AimTimer = window.AimTimer || {};
window.AimTimer.Infrastructure = window.AimTimer.Infrastructure || {};

(function (Infrastructure) {
  class DisplaySyncManager {
    constructor() {
      this.windows = [];
      this.lastSnapshot = null;
      this.bc = null;

      try {
        this.bc = new BroadcastChannel('aimtimer_sync_v1');
      } catch (err) {
        this.bc = null;
      }

      // Si una ventana hija recién abierta solicita el estado inicial, enviárselo al instante
      window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'AIMTIMER_REQUEST_SYNC' && this.lastSnapshot) {
          this.broadcast(this.lastSnapshot);
        }
      });
    }

    cleanupClosedWindows() {
      this.windows = this.windows.filter((win) => win && !win.closed);
    }

    /**
     * Abre la cantidad solicitada de pestañas/ventanas de proyección si aún no están abiertas.
     * Reutiliza las que ya estén abiertas para no moverlas de los monitores externos.
     */
    openDisplays(targetCount) {
      const count = Math.max(0, Math.min(6, parseInt(targetCount, 10) || 0));
      if (count === 0) return;

      this.cleanupClosedWindows();
      const missing = count - this.windows.length;

      for (let i = 0; i < missing; i++) {
        const screenNumber = this.windows.length + 1;
        const win = window.open(
          `display.html?screen=${screenNumber}`,
          `AimTimerDisplay_${screenNumber}`
        );
        if (win) {
          this.windows.push(win);
        }
      }

      // Enviar estado inicial tras abrirse
      if (this.lastSnapshot) {
        setTimeout(() => this.broadcast(this.lastSnapshot), 150);
        setTimeout(() => this.broadcast(this.lastSnapshot), 500);
      }
    }

    broadcast(snapshot) {
      const payload = Object.assign({ type: 'AIMTIMER_SYNC' }, snapshot);
      this.lastSnapshot = payload;

      // 1. Envío directo por referencia postMessage (funciona en file:// y http://)
      this.cleanupClosedWindows();
      for (let i = 0; i < this.windows.length; i++) {
        try {
          this.windows[i].postMessage(payload, '*');
        } catch (err) {}
      }

      // 2. Envío por BroadcastChannel
      if (this.bc) {
        try {
          this.bc.postMessage(payload);
        } catch (err) {}
      }

      // 3. Respaldo en localStorage para pestañas abiertas independientemente
      try {
        localStorage.setItem('aimtimer_live_snapshot', JSON.stringify(payload));
      } catch (err) {}
    }
  }

  Infrastructure.DisplaySyncManager = DisplaySyncManager;
})(window.AimTimer.Infrastructure);

