---
name: WPT Asignaciones
scope: src/
mode: operate
origin: Adaptado del sistema del panel de RanobeClub (KyudenProyect/frontend/DESIGN.md)
colors:
  surface: "#070e1d"
  surface-container-lowest: "#000000"
  surface-container-low: "#0b1323"
  surface-container: "#11192b"
  surface-container-high: "#161f33"
  surface-container-highest: "#1b263b"
  on-surface: "#dfe5fa"
  on-surface-variant: "#a4abbf"
  outline: "#6e7588"
  outline-variant: "#414859"
  primary: "#cfbdfb"
  primary-dim: "#c1afec"
  primary-on-container: "#28194c"
  error: "#ff6e84"
  good-news: "#6ee7b7"
  attention: "#fcd34d"
  task-traduccion: "#93c5fd"
  task-proofreading: "#c4b5fd"
  task-clean: "#5eead4"
  task-type: "#fdba74"
typography:
  family: "Plus Jakarta Sans, system-ui, sans-serif"
  headline: { size: 24px, line: 32px, weight: 700, tracking: -0.025em }
  metric: { size: 20px, weight: 700, numerals: tabular }
  title: { size: 14px, weight: 600 }
  body: { size: 14px }
  caption: { size: 12px }
  label: { size: 11px, weight: 600 }
rounded:
  sm: 4px
  DEFAULT: 8px
  md: 12px
  lg: 16px
  xl: 24px
  full: 9999px
spacing: [4px, 8px, 12px, 16px, 20px, 32px]
---

# WPT Asignaciones: sistema de diseño

## Overview

**North Star: «La mesa de trabajo».** WPT es donde el equipo ve qué le toca, qué está parado y qué espera revisión o subida. Primero lo que espera a alguien, después el avance de cada serie. No es un escaparate: se usa todos los días y la herramienta tiene que desaparecer detrás de la tarea.

Es el **mismo mundo visual que RanobeClub** (azul noche, lavanda, Plus Jakarta Sans), tomado de su panel de administración. Modo **Operate**, estrategia de color **Restrained**: neutros por capas y color solo cuando significa algo.

Los valores viven en `src/theme/tokens.js` y el tema de MUI en `src/theme/theme.js`. Ningún componente debe escribir un hex a mano: se importa de `tokens` o se usa la paleta del tema (`primary.main`, `text.secondary`, `background.paper`...).

## Colors

| Nombre | Token | Hex | Para qué |
|---|---|---|---|
| Azul Noche | `surface` | #070e1d | Fondo de página |
| Negro Pozo | `surface-container-lowest` | #000000 | Barra lateral |
| Pizarra Honda | `surface-container-low` | #0b1323 | Paneles, tarjetas, diálogos |
| Pizarra | `surface-container` | #11192b | Controles, filas internas, campos |
| Pizarra Alta | `surface-container-high` | #161f33 | Fila seleccionada, nav activo, botón neutro |
| Pizarra Cumbre | `surface-container-highest` | #1b263b | Opción activa de un control segmentado, menús |
| Niebla Clara | `on-surface` | #dfe5fa | Texto principal |
| Niebla | `on-surface-variant` | #a4abbf | Texto secundario |
| Humo | `outline` | #6e7588 | Metadatos, iconos inactivos |
| Hilo | `outline-variant` | #414859 | Divisores (al 15 %; al 10 % entre filas) |
| Lavanda Glaciar | `primary` | #cfbdfb | Selección, acción principal, foco |
| Rojo Aviso | `error` | #ff6e84 | Retrasos y acciones destructivas |
| Verde Buena Noticia | `good-news` | #6ee7b7 | Subido, todo al día, variación favorable |
| Ámbar Atención | `attention` | #fcd34d | Espera aprobación, pausado |

**Reglas de color**

- **Lavanda Escasa.** Marca selección, la acción principal (una por vista) y el foco. Nunca decora.
- **Rojo Espera.** Solo para lo que necesita respuesta ya (capítulo retrasado) o destruye (eliminar). Ser administrador no es rojo.
- **Tono en el Icono.** En listas y registros el tono tiñe solo el icono o la insignia; el texto se queda en los colores de lectura.
- Texto sobre lavanda: siempre `primary-on-container` (#28194c), nunca blanco.

### Estados de asignación

| Estado | Tono | Lectura |
|---|---|---|
| Sin asignar, Pendiente | Humo | Nadie trabaja en ello todavía |
| En progreso | Niebla Clara | Trabajo en marcha, sin alarma |
| Esperando aprobación | Ámbar | Espera a un jefe |
| Aprobado, Completado | Lavanda | Listo para el siguiente paso |
| Subido | Verde | Terminado y publicado |
| Retrasado | Rojo | Espera respuesta ya |

Insignia: texto en el tono, fondo del mismo tono al 10 %, radio 12 px (`md`), etiqueta 11 px / 600.

### Tipos de tarea

Los cuatro tipos son categorías, no estados. Tonos pastel de la misma luminosidad, elegidos para no chocar con verde, ámbar ni rojo:

| Tipo | Token | Hex |
|---|---|---|
| Traducción | `task-traduccion` | #93c5fd |
| Proofreading | `task-proofreading` | #c4b5fd |
| Clean/Redrawer | `task-clean` | #5eead4 |
| Typesetting | `task-type` | #fdba74 |

## Typography

Una sola familia, **Plus Jakarta Sans**, para todo. Escala fija en rem.

| Rol | Tamaño / peso | Uso |
|---|---|---|
| headline | 24/32, 700, tracking −0.025em | Título de página |
| metric | 20, 700, tabular | Cifra de una métrica |
| title | 14, 600 | Títulos de sección y de tarjeta |
| body | 14 | Texto general |
| caption | 12 | Metadatos, fechas, contexto |
| label | 11, 600 | Insignias de estado |

- **Cifra Tabular.** Toda cifra que se compara lleva `tabular-nums`.
- **Caja de Frase.** Etiquetas, botones y cabeceras de tabla en caja de frase. Nada de mayúsculas con tracking ancho.

## Layout

- **Barra lateral** de 240 px (68 px contraída) en fondo Negro Pozo, agrupada en Trabajo · Gestión. Por debajo de `lg` es un cajón de 256 px con barra superior de 56 px.
- **Contenido** con máximo de 1440 px y márgenes 16/24/32 px.
- Ritmo de espaciado de 4 px; objetivos táctiles de 36 a 44 px (44 en acciones principales).

## Elevation & Depth

**Capa Tonal.** La profundidad sale de las capas de superficie (lowest → highest), no de sombras. Paneles sin sombra ni borde; divisores `outline-variant` al 15 %. Solo flotan con sombra los menús, diálogos y cajones.

## Shapes

24 px (`xl`) en paneles grandes, 16 px (`lg`) en botones y campos, 12 px (`md`) en insignias y tarjetas internas, círculo en avatares y contadores.

## Components

- **Botones.** Principal en lavanda con texto `primary-on-container` (uno por vista), destructivo en rojo, neutro en Pizarra Alta, discreto sin fondo. Alto 40 px.
- **Control segmentado** (filtros, periodo): fondo Pizarra; la opción activa sube a Pizarra Cumbre. Nunca lavanda.
- **Campos:** Pizarra con borde `outline-variant` al 30 %, 40 px de alto, foco con contorno lavanda de 2 px.
- **Navegación:** elemento activo en Pizarra Alta con el icono en lavanda; contador de revisiones pendientes en círculo ámbar.
- **Pestañas:** texto en Niebla; la activa en Niebla Clara con línea lavanda de 2 px debajo.
- **Tablas:** cabecera en caption 12 px / 600 en Niebla, caja de frase; filas separadas por Hilo al 10 %.

## Do's and Don'ts

**Sí**

- Empezar por lo que espera a alguien.
- Enfocar con `outline` de 2 px en lavanda.
- Confirmar lo destructivo en línea.
- Importar colores de `src/theme/tokens.js`.

**No**

- Hex escritos a mano en componentes.
- Una fila de tarjetas-KPI iguales como estructura de página.
- Lavanda decorativa o más de un botón principal por vista.
- Rojo para lo que no es urgente ni destructivo.
- Sombras en paneles, gradientes de texto, cristal decorativo.
- Mayúsculas con tracking ancho, *eyebrows*.
- Texto blanco sobre lavanda.

## Migración (estado)

- Fase 1 (base): tokens, tema MUI, fuente, CSS global, barra lateral. Hecha.
- Fase 2 (páginas): pendiente. Las páginas todavía tienen colores escritos a mano del diseño anterior (`#6a9eff` y compañía); se migran una a una.
