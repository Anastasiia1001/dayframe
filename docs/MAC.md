# Dayframe on Mac

## Install the web app now

On macOS Sonoma or later, open the Dayframe site in Safari and choose **File → Add to Dock**. This creates a standalone Dayframe web app with its own window and Dock entry. The project includes a web app manifest and a flower icon. You can also use your browser's Install app / Create shortcut option when offered.

Use the **hosted live workspace** URL for real account connections. The GitHub Pages site supports local personal tasks and demo data. Web-app storage may be separate from browser storage; installing does not migrate or synchronize tasks automatically. There is no service worker or offline-readiness guarantee, and no background reminder process.

## Build the frontend on a Mac

Install Node.js 24, clone the repository, then run:

```sh
npm ci
npm run build
npm start
```

This produces `dist/` and runs the same Node backend as on other systems. For real connections, configure the local OAuth apps and `.env` as described in CONNECTIONS.md.

## Native .app / .dmg

A native distributable is feasible with Electron or Tauri, but this repository does **not** currently produce a .dmg. It requires a desktop shell, testing on macOS/Apple Silicon and Intel where supported, and a compatible system-browser OAuth return flow. Shipping confidential OAuth client secrets inside a desktop application is not acceptable: the desktop version should use the hosted backend or provider-supported public-client flows.

Distribution without Gatekeeper warnings requires Apple Developer signing and notarization. Those credentials and a macOS build machine are not configured here. The Dock web-app route does not require them.
