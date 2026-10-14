import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { exec, spawn } from 'child_process';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json());

  // API 1: Live C++ Ping via real compiled binary
  app.post('/api/ipc/ping', (req, res) => {
    const candidatePaths = [
      path.join(__dirname, 'cpp-engine/build/bin/task_engine'),
      path.join(__dirname, 'cpp-engine/build/bin/task_engine.exe'),
      path.join(__dirname, 'bin/task_engine'),
      path.join(__dirname, 'bin/task_engine.exe')
    ];

    let enginePath: string | null = null;
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        enginePath = p;
        break;
      }
    }

    if (!enginePath) {
      return res.json({
        status: 'FALLBACK',
        message: 'C++ binary not compiled on server yet. Run "make all" or scripts/build.bat.',
        latencyMs: 1.0,
        stdout: '{"status":"FALLBACK","engine":"Java/TypeScript Simulation"}'
      });
    }

    const start = performance.now();
    exec(`"${enginePath}" --ping`, (error, stdout, stderr) => {
      const latencyMs = +(performance.now() - start).toFixed(2);
      if (error) {
        return res.json({
          status: 'ERROR',
          message: error.message,
          stderr,
          latencyMs
        });
      }
      return res.json({
        status: 'OK',
        stdout: stdout.trim(),
        enginePath,
        latencyMs
      });
    });
  });

  // API 2: Run JSON command through C++ Engine standard input/output
  app.post('/api/ipc/command', (req, res) => {
    const candidatePaths = [
      path.join(__dirname, 'cpp-engine/build/bin/task_engine'),
      path.join(__dirname, 'cpp-engine/build/bin/task_engine.exe'),
      path.join(__dirname, 'bin/task_engine')
    ];

    let enginePath: string | null = null;
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        enginePath = p;
        break;
      }
    }

    const jsonInput = JSON.stringify(req.body);

    if (!enginePath) {
      return res.json({
        status: 'FALLBACK',
        message: 'C++ engine binary not found. Java fallback mode active.',
        responsePayload: '{"status":"FALLBACK"}'
      });
    }

    const start = performance.now();
    const proc = spawn(enginePath, []);

    let stdoutData = '';
    let stderrData = '';

    proc.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    proc.on('close', (code) => {
      const latencyMs = +(performance.now() - start).toFixed(2);
      res.json({
        status: code === 0 ? 'OK' : 'ERROR',
        exitCode: code,
        stdout: stdoutData.trim(),
        stderr: stderrData.trim(),
        latencyMs
      });
    });

    proc.stdin.write(jsonInput + '\n');
    proc.stdin.end();
  });

  // API 3: Execute Real Test Suites (C++ test_engine + Java TaskServiceTest)
  app.post('/api/run-tests', (req, res) => {
    const testCmd = 'make test';
    exec(testCmd, { cwd: __dirname }, (error, stdout, stderr) => {
      res.json({
        success: !error,
        output: stdout,
        error: error ? error.message : null,
        stderr
      });
    });
  });

  // API 4: Get tasks directly from data/tasks.csv
  app.get('/api/tasks-csv', (req, res) => {
    const csvPath = path.join(__dirname, 'data/tasks.csv');
    if (fs.existsSync(csvPath)) {
      const content = fs.readFileSync(csvPath, 'utf8');
      res.send(content);
    } else {
      res.status(404).send('No data/tasks.csv found');
    }
  });

  // Mount Vite development middlewares
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[TaskFlow Server] Full-Stack server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[TaskFlow Server] Failed to start:', err);
  process.exit(1);
});
