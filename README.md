# F1 Dashboard

A real-time F1 Race Weekend Data analytics dashboard built with React and Spring Boot.

## Architecture
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + Lucide Icons + Nivo / Recharts
- **Backend**: Spring Boot (Java 21) REST API proxying OpenF1 data with in-memory caching and telemetry processing

## Getting Started

### 1. Install Dependencies
```bash
cd frontend && npm install
```

### 2. Run the Application
You can run both the frontend and backend together using the root script:
```bash
npm run dev
```

Or run them individually in separate terminals:
- **Frontend**: `npm run frontend` (available at `http://localhost:5173`)
- **Backend**: `npm run backend` (available at `http://localhost:8080`)

## Production Build
```bash
npm run build
```
This builds both the static frontend assets and the Spring Boot executable JAR.
