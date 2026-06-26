# Development Guidelines (shrimp-rules.md)

## 1. Project Overview
- **Project**: WebcamViewer (로컬 실물화상기 앱)
- **Tech Stack**: Electron, React, TypeScript, Vite, TailwindCSS, electron-builder
- **Constraints**: 100% Offline & Local Execution. No database, no cloud services, no remote APIs, and no telemetry. All video processing and capture savings must remain on the user's PC.

## 2. Project Architecture & Directory Structure
Follow the structure defined in `implementation_plan.md`:
- `electron/main.ts`: Main process, manages window and local PNG saving IPC.
- `electron/preload.ts`: Preload script, exposes a minimal, safe IPC bridge.
- `src/components/`: Reusable components (e.g. `CameraViewer`, `Toolbar`, `CameraSelector`, `StatusBar`).
- `src/hooks/`: Modularized React hooks (e.g. `useCamera`, `useViewerTransform`, `useFullscreen`, `useCapture`, `useKeyboardShortcuts`).
- `src/utils/`: Pure utilities (e.g. `canvas.ts`, `stream.ts`, `fileName.ts`, `cn.ts`).

## 3. Code Standards
- **Naming Conventions**:
  - React Components & Files: PascalCase (e.g. `CameraViewer.tsx`).
  - Hooks: camelCase starting with `use` (e.g. `useCamera.ts`).
  - Functions & Variables: camelCase.
  - Utilities: camelCase.
- **TypeScript**: Strict typing mode must be maintained. Define interface types in `src/types/` where appropriate.
- **TailwindCSS**: Use responsive layout utilities. Touch buttons must be at least 48px in size (touch target requirement).

## 4. Key Rules and Implementation Standards
- **Camera Stream Cleanup**:
  - Whenever switching cameras or stopping the webcam feed, you MUST call `.stop()` on every active `MediaStreamTrack` in the current stream. Failing to do so will keep the camera hardware active/locked.
- **Security Constraints**:
  - `nodeIntegration` must be set to `false`.
  - `contextIsolation` must be set to `true`.
  - Do NOT call Node.js functions directly in the Renderer process. Use `window.electronAPI`.
- **Transforms & Capture Alignment**:
  - The canvas rendering for image saving must mathematically align with the CSS transforms (zoom, rotation, flip). Apply the exact coordinate transformations (`translate`, `scale`, `rotate`) inside `utils/canvas.ts`.
- **Keyboard Shortcuts**:
  - Bind keydowns globally via capturing phase (`useCapture: true`) to ensure shortcuts work even if an element loses focus or during fullscreen mode.

## 5. Prohibited Actions
- DO NOT use external CDNs or remote URLs. All scripts and stylesheets must be packaged locally.
- DO NOT add database integrations (SQLite, lowdb, etc.) or networking libraries (Axios, Fetch to external URLs).
- DO NOT leave active camera tracks running in the background when the viewer component is unmounted.
