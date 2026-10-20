import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import { GoogleGenAI } from '@google/genai';
import { spawn } from 'child_process';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKSPACE_DIR = path.join(__dirname, 'workspace');

if (!fs.existsSync(WORKSPACE_DIR)) {
  fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
}

// Seed default workspace files if empty
const defaultFiles: Record<string, string> = {
  'README.md': '# Eclipse Theia IDE\n\nWelcome to Theia IDE, an extensible cloud development environment and AI agent platform.\n\n## Features\n- Multi-Agent AI Assistance (@Coder, @Architect, @GitHub, @AppTester)\n- Full workspace file tree and code editing\n- Integrated terminal with shell execution\n- Command palette (Ctrl+Shift+P)',
  'package.json': '{\n  "name": "theia-workspace",\n  "version": "1.76.0",\n  "dependencies": {\n    "@theia/core": "1.76.0",\n    "@theia/monaco": "1.76.0"\n  }\n}',
  'src/index.ts': 'import { TheiaApp } from "./app";\n\nconst app = new TheiaApp();\napp.start();\nconsole.log("Theia IDE runtime ready.");',
  'src/app.ts': 'export class TheiaApp {\n  start(): void {\n    console.log("Starting Theia runtime contributions...");\n  }\n}',
  'configs/settings.json': '{\n  "editor.fontSize": 14,\n  "editor.tabSize": 2,\n  "workbench.colorTheme": "theia-dark-plus"\n}'
};

for (const [relPath, content] of Object.entries(defaultFiles)) {
  const fullPath = path.join(WORKSPACE_DIR, relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, content);
  }
}

// Helper to recursively read directory
async function getFilesRecursively(dir: string, baseDir: string = dir): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  if (!fs.existsSync(dir)) return result;
  const entries = await fsPromises.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await getFilesRecursively(fullPath, baseDir);
      Object.assign(result, nested);
    } else if (entry.isFile()) {
      const relPath = path.relative(baseDir, fullPath);
      result[relPath] = await fsPromises.readFile(fullPath, 'utf-8');
    }
  }
  return result;
}

async function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.json());

  // Initialize Gemini
  const ai = new GoogleGenAI();

  // File System Routes
  app.get('/api/files', async (req, res) => {
    try {
      const files = await getFilesRecursively(WORKSPACE_DIR);
      res.json(files);
    } catch (err) {
      console.error('Error reading workspace:', err);
      res.status(500).json({ error: 'Failed to read workspace' });
    }
  });

  app.post('/api/files', async (req, res) => {
    const { path: filePath, content } = req.body;
    if (!filePath) {
      return res.status(400).json({ error: 'Path is required' });
    }
    try {
      const fullPath = path.join(WORKSPACE_DIR, filePath);
      await fsPromises.mkdir(path.dirname(fullPath), { recursive: true });
      await fsPromises.writeFile(fullPath, content || '');
      const files = await getFilesRecursively(WORKSPACE_DIR);
      res.json({ success: true, files });
    } catch (err) {
      console.error('Error saving file:', err);
      res.status(500).json({ error: 'Failed to save file' });
    }
  });

  // Terminal Route
  app.post('/api/terminal', (req, res) => {
    const { command } = req.body;
    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }
    const child = spawn(command, { shell: true, cwd: WORKSPACE_DIR });
    let output = '';
    child.stdout.on('data', (data) => output += data.toString());
    child.stderr.on('data', (data) => output += data.toString());
    child.on('close', (code) => {
      res.json({ output: output || (code === 0 ? 'Command finished successfully' : `Process exited with code ${code}`) });
    });
  });

  // AI Chat Route
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const { prompt, codeContext, agent } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }
      const modelName = 'gemini-2.5-flash';
      const systemInstruction = `You are Theia AI (${agent || 'Coder'} Agent), an expert software engineering assistant embedded inside Eclipse Theia IDE. Help the user plan, code, test, and debug their software project with precision.`;
      const fullPrompt = codeContext 
        ? `Workspace Context:\n\`\`\`\n${codeContext}\n\`\`\`\n\nUser Request: ${prompt}`
        : prompt;

      const response = await ai.models.generateContent({
        model: modelName,
        contents: fullPrompt,
        config: { systemInstruction, temperature: 0.7 }
      });
      res.json({ text: response.text });
    } catch (error: any) {
      console.error('AI error:', error);
      res.status(500).json({ error: error.message || 'AI generation failed' });
    }
  });

  // Static files or Vite dev middleware
  const distPath = path.join(__dirname, 'dist');
  if (fs.existsSync(distPath) && fs.existsSync(path.join(distPath, 'index.html'))) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  const server = app.listen(Number(port), '0.0.0.0', () => {
    console.log(`Theia IDE server running on http://0.0.0.0:${port}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} already in use`);
      process.exit(1);
    } else {
      throw err;
    }
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
