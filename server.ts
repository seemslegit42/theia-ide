import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import { GoogleGenAI } from '@google/genai';
import { spawn } from 'child_process';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKSPACE_DIR = path.join(__dirname, 'workspace');

if (!fs.existsSync(WORKSPACE_DIR)) {
  fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
}

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Initialize Gemini
const ai = new GoogleGenAI();

// File System Routes
app.get('/api/files', async (req, res) => {
  console.log('GET /api/files');
  try {
    const files = await fsPromises.readdir(WORKSPACE_DIR);
    const fileData: Record<string, string> = {};
    for (const file of files) {
      fileData[file] = await fsPromises.readFile(path.join(WORKSPACE_DIR, file), 'utf-8');
    }
    res.json(fileData);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read workspace' });
  }
});

app.post('/api/files', async (req, res) => {
  console.log('POST /api/files', req.body.path);
  const { path: filePath, content } = req.body;
  try {
    await fsPromises.writeFile(path.join(WORKSPACE_DIR, filePath), content);
    
    // Return updated files
    const files = await fsPromises.readdir(WORKSPACE_DIR);
    const fileData: Record<string, string> = {};
    for (const file of files) {
      fileData[file] = await fsPromises.readFile(path.join(WORKSPACE_DIR, file), 'utf-8');
    }
    res.json({ success: true, files: fileData });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save file' });
  }
});

// Terminal Route
app.post('/api/terminal', (req, res) => {
  console.log('POST /api/terminal', req.body.command);
  const { command } = req.body;
  const child = spawn(command, { shell: true, cwd: WORKSPACE_DIR });
  
  let output = '';
  child.stdout.on('data', (data) => output += data.toString());
  child.stderr.on('data', (data) => output += data.toString());
  
  child.on('close', (code) => {
    res.json({ output: output || (code === 0 ? 'Command finished successfully' : `Finished with code ${code}`) });
  });
});

// AI Chat Route
app.post('/api/ai/chat', async (req, res) => {
  console.log('POST /api/ai/chat');
  try {
    const { prompt, codeContext } = req.body;
    const modelName = 'gemini-2.5-flash';
    const response = await ai.models.generateContent({
      model: modelName,
      contents: codeContext ? `Context:\n${codeContext}\n\nQuery: ${prompt}` : prompt,
      config: { systemInstruction: 'You are Theia AI Assistant.', temperature: 0.7 }
    });
    res.json({ text: response.text });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Theia IDE server running on http://0.0.0.0:${port}`);
});

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    process.exit(1);
  } else {
    throw err;
  }
});
