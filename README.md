# 🎯 AimTimer — Temporizador de Tiro con Arco

**AimTimer** es una aplicación web minimalista y responsiva diseñada para competencias oficiales de tiro con arco (**World Archery**) y sesiones de entrenamiento físico específico (**Bowtraining**).

---

## ✨ Funcionalidades Principales

### 1. 🏆 Modo Competencia (World Archery)
Temporizador oficial con semáforo visual y señales acústicas reglamentarias:
- **Presets Oficiales WA**:
  - **240s** (6 flechas — Ronda Clasificatoria Aire Libre)
  - **120s** (3 flechas — Sala / Eliminatorias)
  - **80s** (Equipo Mixto — 4 flechas)
  - **20s** (Match Play Alternado — 1 flecha por turno)
  - **Personalizado** (tiempos de preparación, tiro y advertencia ámbar configurables)
- **Secuencias de Línea de Tiro**: Línea única, rotación **AB / CD**, rotación **A / B** y duelo **Alternado (Arquero A ↔ B)**.
- **Semáforo Visual y Sonoro Oficial**:
  - 🔴 **Rojo** (`2 pitidos` al iniciar preparación / `3 pitidos` al finalizar tanda)
  - 🟢 **Verde** (`1 pitido` al iniciar turno de tiro)
  - 🟡 **Ámbar** (últimos segundos de advertencia antes del cierre)
  - Sincronización exacta del pitido de cierre al mostrar `0` en pantalla (`< 1s`).

### 2. 🖥️ Proyección Multipantalla (`display.html`)
- Permite abrir **de 1 a 4 pantallas externas** sincronizadas en tiempo real al iniciar el temporizador de competencia.
- Cada ventana proyectada muestra únicamente el reloj en pantalla completa sin botones ni controles, ideal para monitores o televisores conectados en la línea de tiro.

### 3. 💪 Modo Mantenciones (Bowtraining Tabata)
Entrenamiento de resistencia isométrica para apertura de arco o banda elástica:
- Configuración de tiempo de **Preparación**, **Mantención (Apertura)**, **Descanso** y **Total de Series**.
- Alertas sonoras `3-2-1` sincronizadas segundo a segundo antes de cada cambio de fase.

### 4. 🔥 Modo Serie 7×3 (Bloques Anidados)
Entrenamiento estructurado por bloques (**Macro Series × Micro Repeticiones**):
- Presets rápidos (**Estándar 7s/3s**, **Potencia 10s/5s**, **Resistencia 15s/5s**).
- Configuración de rondas macro, repeticiones por bloque, tiempo de mantención, micro-descanso y **descanso largo entre bloques** (indicado en color 🔵 **Azul**).

### 5. 🔊 Motor de Sonido y Personalización
- Sintetizador de audio integrado (Web Audio API) sin necesidad de conexión a internet:
  - **Danage DOM** (Buzzer piezoeléctrico 850Hz)
  - **Chronotir Klaxon** (Bocina de campo)
  - **World Archery TV** (Tono limpio 1000Hz)
  - **Silbato Juez DOS**
  - Soporte para cargar **archivo de audio propio** (`.mp3` / `.wav`).
- **Mis Rutinas**: Guarda configuraciones personalizadas en el navegador (`localStorage`) con opción de exportar e importar en formato `.json`.
- **Tema Oscuro / Claro** y **Modo Pantalla Completa (HUD)** automático.

---

## ⌨️ Atajos de Teclado

| Tecla | Acción |
| :--- | :--- |
| `Espacio` | Iniciar / Pausar / Reanudar temporizador |
| `N` o `→` | Saltar a la siguiente fase o turno de línea |
| `R` | Reiniciar sesión actual |
| `F` | Alternar vista de Pantalla Completa |

---

## 🗂️ Estructura del Proyecto

```text
aim-timer/
├── index.html                  # Interfaz principal de control y entrenamiento
├── display.html                # Vista limpia de proyección para pantallas externas
├── assets/                     # Isotipo e íconos de la aplicación
├── styles/                     # Hojas de estilo modulares (base, layout, stage, components)
└── src/
    ├── domain/                 # Presets oficiales WA y generador de secuencias de tiempo
    ├── infrastructure/         # Motor de audio Web Audio API, persistencia y sincronización multipantalla
    ├── application/            # Servicios del temporizador y gestión de rutinas
    └── presentation/           # Controladores del DOM y vista del escenario
```

---

## 📱 Versión Móvil

**AimTimer** también cuenta con versión para dispositivos móviles disponible en **Google Play**.

---

## 👩‍💻 Autor

Creado por **[kamuk-on](https://github.com/kamuk-on)** — Versión `v1.0.0`.

