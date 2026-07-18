const { app, BrowserWindow, dialog } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');
const fs = require('fs');

let mainWindow;
let splashWindow;
let backendProcess;
let backendExited = false;

// Path to the Spring Boot JAR
// - In production (packaged app): bundled under resourcesPath/backend
// - In dev mode (electron .): read straight from the Maven build output
const JAR_PATH = app.isPackaged
   ? path.join(process.resourcesPath, 'backend', 'f1-dashboard-backend-1.0.0.jar')
   : path.join(__dirname, '..', 'backend', 'target', 'f1-dashboard-backend-1.0.0.jar');

const BACKEND_PORT = 8080;
const BACKEND_URL = `http://localhost:${BACKEND_PORT}`;

// Setup logging
const logFile = path.join(app.getPath('userData'), 'backend.log');
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

function logMsg(msg) {
   const line = `[${new Date().toISOString()}] ${msg}\n`;
   console.log(msg);
   logStream.write(line);
}

/**
 * Locate a working Java executable.
 */
function getJavaExecutable() {
   const javaHome = process.env.JAVA_HOME;
   if (javaHome) {
      const javaExe = path.join(javaHome, 'bin', 'java.exe');
      if (fs.existsSync(javaExe)) return javaExe;
   }
   const knownPath = 'C:\\Program Files\\Java\\jdk-21.0.11\\bin\\java.exe';
   if (fs.existsSync(knownPath)) return knownPath;
   return 'java';
}

/**
 * Starts the Spring Boot backend as a child process.
 * - The H2 database is written to the Electron userData directory (always writable).
 * - The server port is enforced via a command-line argument.
 */
function startBackend() {
   logMsg(`Resolved JAR_PATH: ${JAR_PATH}`);
   logMsg(`app.isPackaged: ${app.isPackaged}`);
   logMsg(`process.resourcesPath: ${process.resourcesPath}`);
   logMsg(`__dirname: ${__dirname}`);

   if (!fs.existsSync(JAR_PATH)) {
      logMsg(`JAR not found at: ${JAR_PATH}`);
      dialog.showErrorBox(
         'Backend Not Found',
         `Could not find the backend JAR at:\n${JAR_PATH}\n\nHave you built the Spring Boot backend (mvn package)?`
      );
      app.quit();
      return;
   }

   // Place the H2 database file in a writable location (Electron userData)
   const dbDir = path.join(app.getPath('userData'), 'db');
   if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
   }
   const dbPath = path.join(dbDir, 'f1-data').replace(/\\/g, '/');
   const datasourceUrl = `jdbc:h2:file:${dbPath};DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE;AUTO_RECONNECT=TRUE`;

   logMsg(`H2 database path: ${dbPath}`);
   logMsg(`Datasource URL: ${datasourceUrl}`);

   const javaExe = getJavaExecutable();
   logMsg(`Starting Spring Boot backend with Java: ${javaExe}`);

   backendProcess = spawn(
      javaExe,
      [
         `-Dserver.port=${BACKEND_PORT}`,
         `-Dspring.datasource.url=${datasourceUrl}`,
         '-jar', JAR_PATH,
      ],
      {
         cwd: app.getPath('userData'),
         env: { ...process.env },
      }
   );

   backendProcess.on('error', (err) => {
      logMsg(`Failed to start Java backend process: ${err.message}`);
      dialog.showErrorBox(
         'Java Not Found',
         'This application requires Java to run. Please install Java (JRE or JDK 21+) and ensure it is in your system PATH.'
      );
      app.quit();
   });

   backendProcess.stdout.on('data', (data) => logMsg(`[Backend OUT] ${data}`));
   backendProcess.stderr.on('data', (data) => logMsg(`[Backend ERR] ${data}`));
   backendProcess.on('close', (code) => {
      logMsg(`Backend exited with code ${code}`);
      backendExited = true;
   });
}

/**
 * Polls the backend health endpoint until it responds.
 * Immediately rejects if the backend process exits during startup.
 */
function waitForBackend(maxRetries = 60, intervalMs = 1000) {
   return new Promise((resolve, reject) => {
      let attempts = 0;
      const check = () => {
         // If the backend process already exited, fail fast
         if (backendExited) {
            return reject(new Error('Backend process exited before becoming healthy.'));
         }

         attempts++;
         logMsg(`Health check attempt ${attempts}/${maxRetries}...`);

         http.get(`${BACKEND_URL}/actuator/health`, (res) => {
            if (res.statusCode === 200) {
               logMsg('Backend is healthy!');
               resolve();
            } else if (attempts < maxRetries) {
               setTimeout(check, intervalMs);
            } else {
               reject(new Error('Backend failed to start (HTTP status ' + res.statusCode + ')'));
            }
         }).on('error', () => {
            if (attempts < maxRetries) setTimeout(check, intervalMs);
            else reject(new Error('Backend failed to start: health endpoint unreachable after ' + maxRetries + ' attempts.'));
         });
      };
      check();
   });
}

function createSplashWindow() {
   splashWindow = new BrowserWindow({
      width: 400,
      height: 300,
      transparent: true,
      frame: false,
      alwaysOnTop: true,
      icon: path.join(__dirname, 'icons', 'icon.png'),
      webPreferences: {
         nodeIntegration: false,
         contextIsolation: true
      }
   });
   splashWindow.loadFile(path.join(__dirname, 'splash.html'));
}

function createWindow() {
   mainWindow = new BrowserWindow({
      width: 1280,
      height: 720,
      minWidth: 1280,
      minHeight: 720,
      center: true,
      title: 'F1 Dashboard',
      icon: path.join(__dirname, 'icons', 'icon.png'),
      backgroundColor: '#15151E',
      webPreferences: {
         nodeIntegration: false,
         contextIsolation: true,
         preload: path.join(__dirname, 'preload.js')
      },
      autoHideMenuBar: false,
      show: false,
   });

   mainWindow.loadURL(BACKEND_URL);

   mainWindow.once('ready-to-show', () => {
      if (splashWindow && !splashWindow.isDestroyed()) {
         splashWindow.close();
      }
      mainWindow.show();
   });

   mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(async () => {
   createSplashWindow();
   startBackend();
   try {
      await waitForBackend();
      createWindow();
   } catch (err) {
      logMsg(`Failed to start backend: ${err.message}`);
      if (splashWindow && !splashWindow.isDestroyed()) {
         splashWindow.close();
      }
      dialog.showErrorBox(
         'Backend Failed to Start',
         `The embedded Spring Boot backend failed to start in time.\n\nError: ${err.message}\n\nPlease check the log file for details:\n${logFile}`
      );
      app.quit();
   }
});

app.on('window-all-closed', () => {
   if (backendProcess) backendProcess.kill();
   if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
   if (backendProcess) backendProcess.kill();
});