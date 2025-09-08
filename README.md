# Fragments

A Node.js Express API server with logging, security middleware, and development tools.

## Prerequisites

- Node.js (v18 or higher recommended)
- npm (comes with Node.js)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Mannatpreet22/Fragments.git
   cd Fragments
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Available Scripts

### `npm start`
Runs the server in production mode.
```bash
npm start
```
- Starts the server on port 8080 (or PORT environment variable)
- Uses production logging configuration
- Server runs until manually stopped (Ctrl+C)

### `npm run dev`
Runs the server in development mode with auto-restart.
```bash
npm run dev
```
- Loads environment variables from `debug.env`
- Auto-restarts when files change (--watch)
- Uses debug logging level for detailed output
- Perfect for active development

### `npm run debug`
Runs the server in debug mode with Node.js inspector.
```bash
npm run debug
```
- Loads environment variables from `debug.env`
- Enables Node.js debugger on port 9229
- Auto-restarts when files change (--watch)
- Connect debugger to `localhost:9229` in VS Code or Chrome DevTools

### `npm run lint`
Runs ESLint to check code quality and style.
```bash
npm run lint
```
- Checks all JavaScript files in `src/` directory
- Reports syntax errors and style violations
- Fixes auto-fixable issues

## Environment Variables

Create a `debug.env` file for development:
```bash
# debug.env
LOG_LEVEL=debug
PORT=8080
```

## API Endpoints

### Health Check
- **GET** `/` - Returns server status and metadata
  ```json
  {
    "status": "ok",
    "author": "Mannatpreet Singh Khurana",
    "githubUrl": "https://github.com/Mannatpreet22/Fragments",
    "version": "0.0.1"
  }
  ```

### Error Handling
- **404** - Resource not found
- **500** - Internal server error

## Development Setup

1. **VS Code Debugging**: Use the included `.vscode/launch.json` configuration
2. **Code Formatting**: Prettier is configured with `.prettierrc`
3. **Linting**: ESLint is configured with `eslint.config.mjs`
4. **Git**: `.gitignore` excludes `node_modules/` and other build artifacts

## Project Structure

```
src/
├── app.js          # Express app configuration and routes
├── logger.js       # Pino logger setup
└── server.js       # Server startup and graceful shutdown

.vscode/
├── launch.json     # VS Code debug configurations
└── settings.json   # VS Code workspace settings

debug.env           # Development environment variables
eslint.config.mjs   # ESLint configuration
.prettierrc         # Prettier configuration
```

## Troubleshooting

- **Port already in use**: Change PORT in `debug.env` or kill the process using port 8080
- **Module not found**: Run `npm install` to ensure all dependencies are installed
- **Lint errors**: Run `npm run lint` to see specific issues and fix them
- **Debugger not connecting**: Ensure port 9229 is available and VS Code is configured properly

## Contributing

1. Make your changes
2. Run `npm run lint` to check code quality
3. Test your changes with `npm run dev`
4. Commit your changes with a descriptive message
