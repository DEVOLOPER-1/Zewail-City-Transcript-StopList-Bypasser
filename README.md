# Zewail-City-Transcript-StopList-Bypasser

A compact browser extension and viewer that retrieves and renders unofficial transcript JSON from Zewail City SelfService. The project provides a small MV3 extension which uses the active page session to obtain the transcript payload and a sandboxed Brython viewer to render the transcript as readable tables.

This README is camera-ready and concise: it documents what runs and what is used.

What runs
- Browser extension (Manifest V3) located in `extension/`.
- Background service worker: `extension/background.js`.
- Content script: `extension/content_script.js` (runs on the SelfService domain to acquire the transcript using the page session).
- Popup UI: `extension/popup.html` + `extension/popup.js` (triggers fetch and stores the payload in extension local storage).
- Viewer UI: `extension/viewer.html` + `extension/viewer.js` and a sandboxed Brython preview `extension/sandbox.html` (renders payload stored in extension storage).

What is used (runtime / dependencies)
- Brython (client-side Python runtime) — vendored files: `brython.js`, `brython_stdlib.js` (pyproject specifies `brython>=3.14.1`).
- Python tooling: `ruff` is listed in `pyproject.toml` for linting tasks.
- Target platform: Chromium-based browsers (Chrome, Edge) supporting Manifest V3.

Key files
- `pyproject.toml` — project metadata and declared dependencies.
- `extension/manifest.json` — extension metadata and host permissions.
- `extension/popup.html`, `extension/popup.js` — user-facing fetch UI.
- `extension/content_script.js` — in-page fetching helper (runs on `https://sisselfservice.zewailcity.edu.eg/*`).
- `extension/background.js` — stores the fetched transcript and opens the viewer.
- `extension/viewer.html`, `extension/viewer.js` — viewer that renders the payload.
- `extension/sandbox.html` — sandboxed Brython-based preview used for local testing.
- `main.py` — shared parsing and view-model utilities used by Brython code and tests.

Quick local install (developer / internal use)
1. Open chrome://extensions (or edge://extensions).
2. Enable Developer mode.
3. Click "Load unpacked" and select the `extension/` folder from this repository.
4. Sign in to the Zewail City SelfService site in a tab.
5. Click the extension icon and use the popup to fetch the transcript.

Notes
- The extension requires permission to access `https://sisselfservice.zewailcity.edu.eg/*` to read the transcript payload via the page session.
- This repository contains vendored Brython runtime files to allow the viewer to run without external network requests.
- Keep distribution and sharing in line with institutional policies; this tool is intended for internal use.



> ⚠️ **DISCLAIMER & TERMS OF USE**
> This tool is provided for educational purposes and internal use only. By using this extension, you acknowledge that you are accessing your own data via your own authenticated session. The author(s) of this extension are not affiliated with, endorsed by, or connected to Zewail City or its IT department. 
>
> The author(s) assume **ZERO liability** for how you use this tool. You are solely responsible for ensuring that your use of this software complies with Zewail City's IT policies, academic guidelines, and Terms of Service. Any disciplinary actions, account restrictions, or other consequences arising from the use of this tool are strictly the responsibility of the user.
