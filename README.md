# F1 Dashboard

A standalone Windows desktop application for F1 Race Weekend Data, built with React, Spring Boot, and Electron.

## Architecture
The application runs entirely locally on your machine.
- **Frontend**: React + Vite
- **Backend**: Spring Boot (embedded JAR)
- **Shell**: Electron (manages the lifecycle, UI window, and bundles the Java backend)

## Development Workflow

1. **Install Dependencies**
   From the project root, install all dependencies:
   ```bash
   npm install --prefix electron
   npm install --prefix frontend
   ```

2. **Run Backend (Development)**
   In one terminal, start the Spring Boot backend:
   ```bash
   npm run build:backend
   ```
   *Note: In development, you can also run `mvn spring-boot:run` in the `backend` directory.*

3. **Run Frontend (Development)**
   In a second terminal, start the Vite development server:
   ```bash
   cd frontend
   npm run dev
   ```

4. **Run Electron App (Development)**
   In a third terminal, run the electron shell which will hook into the backend automatically:
   ```bash
   npm run electron-dev
   ```

## Building the Desktop Application

The project root `package.json` contains scripts to fully automate the production build.

1. **Full Build**
   To compile the React frontend, package the Spring Boot backend, and build the Electron application into a Windows installer:
   ```bash
   npm run package
   ```
   *(Alternatively, use `npm run make-installer` or `npm run electron-build`)*

2. **Output**
   Once the build completes, check the `installers/` folder at the root of the project. You will find:
   - `F1 Dashboard Setup.exe` (Standard Windows Installer)
   - `F1 Dashboard Portable.exe` (Portable executable, no installation required)

## Troubleshooting
- **Backend Fails to Start**: Ensure Java 21+ is installed and available in your system `PATH`.
- **Logs**: If the app fails to start or shows an error, check the local log file located at `%APPDATA%\f1-dashboard-desktop\backend.log` for detailed Java exceptions and outputs.
