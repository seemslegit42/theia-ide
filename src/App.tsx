import React, { useState, useEffect, useRef } from 'react';
import { 
  FolderTree, Search, GitBranch, Puzzle, Bot, Settings, 
  FileCode, Terminal as TerminalIcon, Play, Save, Plus, 
  Trash2, ChevronRight, ChevronDown, Sparkles, Check, AlertCircle, RefreshCw,
  Sliders, MessageSquare, BookOpen, Layers, Cpu, Shield, Globe, HelpCircle, X, Maximize2, Minimize2
} from 'lucide-react';

export default function App() {
  const [activeView, setActiveView] = useState<'welcome' | 'editor' | 'ai-config' | 'extensions'>('welcome');
  const [sidebarTab, setSidebarTab] = useState<'explorer' | 'search' | 'git' | 'extensions' | 'ai' | 'settings'>('explorer');
  const [files, setFiles] = useState<Record<string, string>>({
    'README.md': '# Eclipse Theia IDE\n\nWelcome to Theia IDE, a flexible and extensible cloud development environment built with TypeScript and React.\n\n## Getting Started\n- Explore files in the explorer sidebar\n- Edit code with syntax highlighting\n- Use the integrated terminal\n- Leverage AI assistance for coding and debugging',
    'package.json': '{\n  "name": "theia-ide-workspace",\n  "version": "1.76.0",\n  "dependencies": {\n    "@theia/core": "1.76.0",\n    "@theia/monaco": "1.76.0",\n    "react": "^19.2.8"\n  }\n}',
    'src/index.ts': 'import { TheiaApp } from "./app";\n\nconst app = new TheiaApp();\napp.start();\nconsole.log("Theia IDE backend initialized.");',
    'src/app.ts': 'export class TheiaApp {\n  start(): void {\n    console.log("Starting Theia IDE runtime...");\n  }\n}',
    'configs/settings.json': '{\n  "editor.fontSize": 14,\n  "editor.tabSize": 2,\n  "workbench.colorTheme": "theia-dark-plus"\n}'
  });
  const [openFiles, setOpenFiles] = useState<string[]>(['README.md', 'src/index.ts']);
  const [activeFile, setActiveFile] = useState<string>('src/index.ts');
  const [fileContent, setFileContent] = useState<string>('');
  const [bottomPanelTab, setBottomPanelTab] = useState<'terminal' | 'problems' | 'output' | 'debug'>('terminal');
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState<boolean>(true);
  
  // AI State
  const [selectedAgent, setSelectedAgent] = useState<string>('Coder');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');
  const [reasoningLevel, setReasoningLevel] = useState<string>('Medium');
  const [capabilities, setCapabilities] = useState<{ shell: boolean; github: boolean; appTester: boolean; memory: boolean }>({
    shell: true,
    github: false,
    appTester: false,
    memory: true
  });
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [aiChat, setAiChat] = useState<{ role: 'user' | 'assistant'; text: string; agent: string; model: string }[]>([
    { role: 'assistant', text: 'Hello! I am Theia Coder, your AI assistant. How can I help you architect or code your project today?', agent: 'Coder', model: 'gemini-2.5-flash' }
  ]);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Terminal State
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'Eclipse Theia IDE v1.76.0 (Browser Edition)',
    'Root directory: /workspace',
    'Type "help" for available commands or use the AI chat for intelligent assistance.',
    '$ npm run dev',
    'Theia backend listening on http://0.0.0.0:3000'
  ]);
  const [terminalInput, setTerminalInput] = useState<string>('');

  // Command Palette State
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [commandQuery, setCommandQuery] = useState<string>('');

  // Top Menu Bar Dropdown & Toast State
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [aboutDialogOpen, setAboutDialogOpen] = useState<boolean>(false);
  const [statusToast, setStatusToast] = useState<string | null>(null);
  const [newFileCounter, setNewFileCounter] = useState<number>(1);
  const menuBarRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => {
      setStatusToast(prev => (prev === msg ? null : prev));
    }, 2500);
  };

  const handleCreateNewFile = () => {
    const filename = `src/untitled-${newFileCounter}.ts`;
    setNewFileCounter(c => c + 1);
    const initialCode = `// ${filename}\nexport function execute(): void {\n  console.log("Theia IDE: executed successfully.");\n}\n`;
    setFiles(prev => ({ ...prev, [filename]: initialCode }));
    setOpenFiles(prev => (prev.includes(filename) ? prev : [...prev, filename]));
    setActiveFile(filename);
    setFileContent(initialCode);
    setActiveView('editor');
    showToast(`Created ${filename}`);
  };

  const handleRunTerminalCommand = (cmd: string) => {
    setIsBottomPanelOpen(true);
    setBottomPanelTab('terminal');
    setTerminalLogs(prev => [...prev, `$ ${cmd}`]);
    setTimeout(() => {
      if (cmd === 'npm run build' || cmd === 'build') {
        setTerminalLogs(prev => [
          ...prev,
          '[theia-build] Bundling TypeScript browser application...',
          '✓ Build successful: /dist bundle generated (0 errors, 0 warnings)'
        ]);
        showToast('Build task finished');
      } else if (cmd === 'npm test' || cmd === 'test') {
        setTerminalLogs(prev => [
          ...prev,
          'PASS src/app.spec.ts',
          '✓ TheiaApp runtime initializes successfully',
          '✓ Multi-agent communications registered (35 extensions)',
          'Tests: 2 passed, 2 total'
        ]);
        showToast('Tests passed: 2/2');
      } else if (cmd.includes('inspect') || cmd.includes('debug')) {
        setTerminalLogs(prev => [
          ...prev,
          'Debugger listening on ws://127.0.0.1:9229',
          'Debugger session attached to process 42',
          'Ready for breakpoints'
        ]);
        showToast('Debugger attached');
      } else {
        setTerminalLogs(prev => [...prev, `Process exited with code 0.`]);
        showToast(`Executed: ${cmd}`);
      }
    }, 250);
  };

  useEffect(() => {
    if (activeFile && files[activeFile] !== undefined) {
      setFileContent(files[activeFile]);
    }
  }, [activeFile, files]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      } else if ((e.metaKey || e.ctrlKey) && e.key === '`') {
        e.preventDefault();
        setIsBottomPanelOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        setActiveMenu(null);
        setIsCommandPaletteOpen(false);
        setAboutDialogOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFile, fileContent]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSave = async () => {
    if (!activeFile) return;
    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: activeFile, content: fileContent })
      });
      const data = await res.json();
      if (data.success) {
        setFiles(data.files);
        showToast(`Saved ${activeFile}`);
      }
    } catch (err) {
      console.error('Save failed:', err);
      showToast(`Saved ${activeFile} (local)`);
    }
  };

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim() || isAiLoading) return;

    const userMsg = aiPrompt;
    setAiPrompt('');
    setAiChat(prev => [...prev, { role: 'user', text: userMsg, agent: selectedAgent, model: selectedModel }]);
    setIsAiLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMsg, codeContext: fileContent, agent: selectedAgent, model: selectedModel })
      });
      const data = await res.json();
      setAiChat(prev => [...prev, { role: 'assistant', text: data.text || 'No response generated.', agent: selectedAgent, model: selectedModel }]);
    } catch (err) {
      setAiChat(prev => [...prev, { role: 'assistant', text: 'Error connecting to Gemini AI provider.', agent: selectedAgent, model: selectedModel }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    const cmd = terminalInput.trim();
    setTerminalLogs(prev => [...prev, `$ ${cmd}`]);
    setTerminalInput('');

    setTimeout(() => {
      if (cmd === 'help') {
        setTerminalLogs(prev => [...prev, 'Available commands: build, test, status, clear, node, npm, agents']);
      } else if (cmd === 'clear') {
        setTerminalLogs(['Eclipse Theia IDE v1.76.0']);
      } else if (cmd === 'agents') {
        setTerminalLogs(prev => [...prev, 'Active Agents: @Coder, @Architect, @Universal, @GitHub, @AppTester']);
      } else if (cmd === 'build' || cmd === 'npm run build') {
        setTerminalLogs(prev => [...prev, 'Building TypeScript bundle...', 'Webpack / esbuild compilation complete.', '0 errors, 0 warnings.']);
      } else if (cmd === 'test') {
        setTerminalLogs(prev => [...prev, 'Running test suite...', 'PASS src/app.spec.ts', 'Test Suites: 1 passed, 1 total']);
      } else if (cmd === 'status' || cmd === 'git status') {
        setTerminalLogs(prev => [...prev, 'On branch main', 'Your branch is up to date with origin/main.', 'Changes to be committed:', '  (use "git restore --staged <file>..." to unstage)', '\tmodified:   src/index.ts']);
      } else {
        setTerminalLogs(prev => [...prev, `Command executed: ${cmd}. Process exited with code 0.`]);
      }
    }, 250);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0D0E12] text-zinc-200 font-sans select-none border border-zinc-800/50 backdrop-blur-2xl shadow-2xl">
      {/* Top Application Header / Menu Bar */}
      <div className="flex items-center justify-between h-9 px-3 bg-[#1f1f23] border-b border-zinc-800 text-xs text-zinc-400">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 font-heading font-bold text-white text-sm">
            <div className="w-5 h-5 bg-gradient-to-br from-purple-600 to-indigo-600 rounded flex items-center justify-center text-white text-xs font-bold shadow-md shadow-purple-500/20">Θ</div>
            <span className="tracking-wide">Theia IDE</span>
          </div>
          <div ref={menuBarRef} className="hidden md:flex items-center space-x-1 text-zinc-300 text-[11px] relative">
            {/* 1. File Menu */}
            <span 
              className={`relative px-2 py-1 rounded cursor-pointer transition-all select-none ${activeMenu === 'file' ? 'bg-purple-600/25 text-white shadow-sm ring-1 ring-purple-400/40' : 'hover:text-white hover:bg-zinc-800/80'}`}
              onClick={() => setActiveMenu(activeMenu === 'file' ? null : 'file')}
              onMouseEnter={() => { if (activeMenu) setActiveMenu('file'); }}
            >
              <span>File</span>
              {activeMenu === 'file' && (
                <div 
                  className="absolute top-full left-0 mt-1 w-60 bg-[#12141A]/95 backdrop-blur-2xl border border-zinc-700/70 rounded-lg shadow-2xl py-1.5 z-50 text-xs text-zinc-300 font-sans"
                  onClick={e => e.stopPropagation()}
                >
                  <div 
                    onClick={() => { handleCreateNewFile(); setActiveMenu(null); }}
                    className="flex items-center justify-between px-3 py-1.5 hover:bg-purple-600/30 hover:text-white cursor-pointer transition-colors"
                  >
                    <span>New File</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Ctrl+N</span>
                  </div>
                  <div 
                    onClick={() => { setActiveView('editor'); setSidebarTab('explorer'); setActiveMenu(null); showToast('Opened workspace file tree'); }}
                    className="flex items-center justify-between px-3 py-1.5 hover:bg-purple-600/30 hover:text-white cursor-pointer transition-colors"
                  >
                    <span>Open Workspace...</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Ctrl+O</span>
                  </div>
                  <div className="h-[1px] bg-zinc-800 my-1"></div>
                  <div 
                    onClick={() => { handleSave(); setActiveMenu(null); }}
                    className="flex items-center justify-between px-3 py-1.5 hover:bg-purple-600/30 hover:text-white cursor-pointer transition-colors"
                  >
                    <span>Save</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Ctrl+S</span>
                  </div>
                  <div 
                    onClick={() => { handleSave(); setActiveMenu(null); showToast('All workspace files saved'); }}
                    className="flex items-center justify-between px-3 py-1.5 hover:bg-purple-600/30 hover:text-white cursor-pointer transition-colors"
                  >
                    <span>Save All</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Ctrl+K S</span>
                  </div>
                  <div className="h-[1px] bg-zinc-800 my-1"></div>
                  <div 
                    onClick={() => { setActiveView('welcome'); setActiveMenu(null); }}
                    className="flex items-center justify-between px-3 py-1.5 hover:bg-purple-600/30 hover:text-white cursor-pointer transition-colors"
                  >
                    <span>Welcome Page</span>
                  </div>
                  <div 
                    onClick={() => { setActiveView('ai-config'); setActiveMenu(null); }}
                    className="flex items-center justify-between px-3 py-1.5 hover:bg-purple-600/30 hover:text-white cursor-pointer transition-colors"
                  >
                    <span>AI Configuration</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Alt+A</span>
                  </div>
                  <div 
                    onClick={() => { setActiveView('editor'); setSidebarTab('settings'); setActiveMenu(null); }}
                    className="flex items-center justify-between px-3 py-1.5 hover:bg-purple-600/30 hover:text-white cursor-pointer transition-colors"
                  >
                    <span>Preferences: Settings</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Ctrl+,</span>
                  </div>
                  <div className="h-[1px] bg-zinc-800 my-1"></div>
                  <div 
                    onClick={() => {
                      if (activeFile) {
                        const nextOpen = openFiles.filter(f => f !== activeFile);
                        setOpenFiles(nextOpen);
                        if (nextOpen.length > 0) setActiveFile(nextOpen[0]);
                      }
                      setActiveMenu(null);
                    }}
                    className="flex items-center justify-between px-3 py-1.5 hover:bg-purple-600/30 hover:text-white cursor-pointer transition-colors"
                  >
                    <span>Close Editor</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Ctrl+W</span>
                  </div>
                </div>
              )}
            </span>

            {/* 2. Edit Menu */}
            <span 
              className={`relative px-2 py-1 rounded cursor-pointer transition-all select-none ${activeMenu === 'edit' ? 'bg-purple-600/25 text-white shadow-sm ring-1 ring-purple-400/40' : 'hover:text-white hover:bg-zinc-800/80'}`}
              onClick={() => setActiveMenu(activeMenu === 'edit' ? null : 'edit')}
              onMouseEnter={() => { if (activeMenu) setActiveMenu('edit'); }}
            >
              <span>Edit</span>
              {activeMenu === 'edit' && (
                <div 
                  className="absolute top-full left-0 mt-1 w-56 bg-[#12141A]/95 backdrop-blur-2xl border border-zinc-700/70 rounded-lg shadow-2xl py-1.5 z-50 text-xs text-zinc-300 font-sans"
                  onClick={e => e.stopPropagation()}
                >
                  <div 
                    onClick={() => { showToast('Undo action triggered'); setActiveMenu(null); }}
                    className="flex items-center justify-between px-3 py-1.5 hover:bg-purple-600/30 hover:text-white cursor-pointer transition-colors"
                  >
                    <span>Undo</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Ctrl+Z</span>
                  </div>
                  <div 
                    onClick={() => { showToast('Redo action triggered'); setActiveMenu(null); }}
                    className="flex items-center justify-between px-3 py-1.5 hover:bg-purple-600/30 hover:text-white cursor-pointer transition-colors"
                  >
                    <span>Redo</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Ctrl+Y</span>
                  </div>
                  <div className="h-[1px] bg-zinc-800 my-1"></div>
                  <div 
                    onClick={() => { setActiveView('editor'); setSidebarTab('search'); setActiveMenu(null); }}
                    className="flex items-center justify-between px-3 py-1.5 hover:bg-purple-600/30 hover:text-white cursor-pointer transition-colors"
                  >
                    <span>Find in Files</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Ctrl+Shift+F</span>
                  </div>
                  <div 
                    onClick={() => {
                      if (activeFile.endsWith('.json')) {
                        try {
                          const formatted = JSON.stringify(JSON.parse(fileContent), null, 2);
                          setFileContent(formatted);
                          showToast('JSON formatted successfully');
                        } catch {
                          showToast('Invalid JSON format');
                        }
                      } else {
                        showToast('Document reformatted');
                      }
                      setActiveMenu(null);
                    }}
                    className="flex items-center justify-between px-3 py-1.5 hover:bg-purple-600/30 hover:text-white cursor-pointer transition-colors"
                  >
                    <span>Format Document</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Shift+Alt+F</span>
                  </div>
                  <div className="h-[1px] bg-zinc-800 my-1"></div>
                  <div 
                    onClick={() => { showToast('Copied to clipboard'); setActiveMenu(null); }}
                    className="flex items-center justify-between px-3 py-1.5 hover:bg-purple-600/30 hover:text-white cursor-pointer transition-colors"
                  >
                    <span>Copy</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Ctrl+C</span>
                  </div>
                </div>
              )}
            </span>

            {/* 3. Selection Menu */}
            <span 
              className={`relative px-2 py-1 rounded cursor-pointer transition-all select-none ${activeMenu === 'selection' ? 'bg-purple-600/25 text-white shadow-sm ring-1 ring-purple-400/40' : 'hover:text-white hover:bg-zinc-800/80'}`}
              onClick={() => setActiveMenu(activeMenu === 'selection' ? null : 'selection')}
              onMouseEnter={() => { if (activeMenu) setActiveMenu('selection'); }}
            >
              <span>Selection</span>
              {activeMenu === 'selection' && (
                <div 
                  className="absolute top-full left-0 mt-1 w-56 bg-[#12141A]/95 backdrop-blur-2xl border border-zinc-700/70 rounded-lg shadow-2xl py-1.5 z-50 text-xs text-zinc-300 font-sans"
                  onClick={e => e.stopPropagation()}
                >
                  <div 
                    onClick={() => { showToast('All text selected'); setActiveMenu(null); }}
                    className="flex items-center justify-between px-3 py-1.5 hover:bg-purple-600/30 hover:text-white cursor-pointer transition-colors"
                  >
                    <span>Select All</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Ctrl+A</span>
                  </div>
                  <div 
                    onClick={() => { showToast('Selection expanded'); setActiveMenu(null); }}
                    className="flex items-center justify-between px-3 py-1.5 hover:bg-purple-600/30 hover:text-white cursor-pointer transition-colors"
                  >
                    <span>Expand Selection</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Shift+Alt+Right</span>
                  </div>
                  <div 
                    onClick={() => { showToast('Selection shrunk'); setActiveMenu(null); }}
                    className="flex items-center justify-between px-3 py-1.5 hover:bg-purple-600/30 hover:text-white cursor-pointer transition-colors"
                  >
                    <span>Shrink Selection</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Shift+Alt+Left</span>
                  </div>
                  <div className="h-[1px] bg-zinc-800 my-1"></div>
                  <div 
                    onClick={() => {
                      setFileContent(prev => prev + '\n' + (prev.split('\n').pop() || ''));
                      showToast('Line duplicated down');
                      setActiveMenu(null);
                    }}
                    className="flex items-center justify-between px-3 py-1.5 hover:bg-purple-600/30 hover:text-white cursor-pointer transition-colors"
                  >
                    <span>Copy Line Down</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Shift+Alt+Down</span>
                  </div>
                </div>
              )}
            </span>

            {/* 4. View Menu */}
            <span 
              className={`relative px-2 py-1 rounded cursor-pointer transition-all select-none ${activeMenu === 'view' ? 'bg-purple-600/25 text-white shadow-sm ring-1 ring-purple-400/40' : 'hover:text-white hover:bg-zinc-800/80'}`}
              onClick={() => setActiveMenu(activeMenu === 'view' ? null : 'view')}
              onMouseEnter={() => { if (activeMenu) setActiveMenu('view'); }}
            >
              <span>View</span>
              {activeMenu === 'view' && (
                <div 
                  className="absolute top-full left-0 mt-1 w-60 bg-[#12141A]/95 backdrop-blur-2xl border border-zinc-700/70 rounded-lg shadow-2xl py-1.5 z-50 text-xs text-zinc-300 font-sans"
                  onClick={e => e.stopPropagation()}
                >
                  <div 
                    onClick={() => { setActiveView('welcome'); setActiveMenu(null); }}
                    className="flex items-center justify-between px-3 py-1.5 hover:bg-purple-600/30 hover:text-white cursor-pointer transition-colors"
                  >
                    <span>Welcome & Walkthrough</span>
                  </div>
                  <div 
                    onClick={() => { setActiveView('ai-config'); setActiveMenu(null); }}
                    className="flex items-center justify-between px-3 py-1.5 hover:bg-purple-600/30 hover:text-white cursor-pointer transition-colors"
                  >
                    <span>AI Configuration View</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Alt+A</span>
                  </div>
                  <div 
                    onClick={() => { setActiveView('editor'); setActiveMenu(null); }}
                    className="flex items-center justify-between px-3 py-1.5 hover:bg-purple-600/30 hover:text-white cursor-pointer transition-colors"
                  >
                    <span>Code Editor</span>
                  </div>
                  <div className="h-[1px] bg-zinc-800 my-1"></div>
                  <div 
                    onClick={() => { setActiveView('editor'); setSidebarTab('explorer'); setActiveMenu(null); }}
                    className="flex items-center justify-between px-3 py-1.5 hover:bg-purple-600/30 hover:text-white cursor-pointer transition-colors"
                  >
                    <span>Explorer</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Ctrl+Shift+E</span>
                  </div>
                  <div 
                    onClick={() => { setActiveView('editor'); setSidebarTab('search'); setActiveMenu(null); }}
                    className="flex items-center justify-between px-3 py-1.5 hover:bg-purple-600/30 hover:text-white cursor-pointer transition-colors"
                  >
                    <span>Search</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Ctrl+Shift+F</span>
                  </div>
                  <div 
                    onClick={() => { setActiveView('editor'); setSidebarTab('git'); setActiveMenu(null); }}
                    className="flex items-center justify-between px-3 py-1.5 hover:bg-purple-600/30 hover:text-white cursor-pointer transition-colors"
                  >
                    <span>Source Control</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Ctrl+Shift+G</span>
                  </div>
                  <div 
                    onClick={() => { setActiveView('extensions'); setActiveMenu(null); }}
                    className="flex items-center justify-between px-3 py-1.5 hover:bg-purple-600/30 hover:text-white cursor-pointer transition-colors"
                  >
                    <span>Extensions & AI Registry</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Ctrl+Shift+X</span>
                  </div>
                  <div 
                    onClick={() => { setActiveView('editor'); setSidebarTab('ai'); setActiveMenu(null); }}
                    className="flex items-center justify-between px-3 py-1.5 hover:bg-purple-600/30 hover:text-white cursor-pointer transition-colors"
                  >
                    <span>Theia AI Chat</span>
                  </div>
                  <div className="h-[1px] bg-zinc-800 my-1"></div>
                  <div 
                    onClick={() => { setIsBottomPanelOpen(prev => !prev); setActiveMenu(null); }}
                    className="flex items-center justify-between px-3 py-1.5 hover:bg-purple-600/30 hover:text-white cursor-pointer transition-colors"
                  >
                    <span>Toggle Terminal Panel</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Ctrl+`</span>
                  </div>
                </div>
              )}
            </span>

            {/* 5. AI Tools / Go Menu */}
            <span 
              className={`relative px-2 py-1 rounded cursor-pointer transition-all select-none ${activeMenu === 'ai-tools' ? 'bg-purple-600/25 text-white shadow-sm ring-1 ring-purple-400/40' : 'hover:text-white hover:bg-zinc-800/80'}`}
              onClick={() => setActiveMenu(activeMenu === 'ai-tools' ? null : 'ai-tools')}
              onMouseEnter={() => { if (activeMenu) setActiveMenu('ai-tools'); }}
            >
              <span>AI Tools</span>
              {activeMenu === 'ai-tools' && (
                <div 
                  className="absolute top-full left-0 mt-1 w-64 bg-[#12141A]/95 backdrop-blur-2xl border border-zinc-700/70 rounded-lg shadow-2xl py-1.5 z-50 text-xs text-zinc-300 font-sans"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="px-3 py-1 text-[10px] font-bold text-purple-400 uppercase tracking-wider">Theia Agents</div>
                  <div 
                    onClick={() => { setSelectedAgent('Coder'); setActiveView('editor'); setSidebarTab('ai'); setActiveMenu(null); showToast('Switched to @Coder'); }}
                    className="flex items-center justify-between px-3 py-1.5 hover:bg-purple-600/30 hover:text-white cursor-pointer transition-colors"
                  >
                    <span className="font-medium text-white">@Coder (Code Assistant)</span>
                    {selectedAgent === 'Coder' && <span className="text-emerald-400 text-[10px]">● Active</span>}
                  </div>
                  <div 
                    onClick={() => { setSelectedAgent('Architect'); setActiveView('editor'); setSidebarTab('ai'); setActiveMenu(null); showToast('Switched to @Architect'); }}
                    className="flex items-center justify-between px-3 py-1.5 hover:bg-purple-600/30 hover:text-white cursor-pointer transition-colors"
                  >
                    <span className="font-medium text-white">@Architect (Planning & Task)</span>
                    {selectedAgent === 'Architect' && <span className="text-emerald-400 text-[10px]">● Active</span>}
                  </div>
                  <div 
                    onClick={() => { setSelectedAgent('GitHub'); setActiveView('editor'); setSidebarTab('ai'); setActiveMenu(null); showToast('Switched to @GitHub'); }}
                    className="flex items-center justify-between px-3 py-1.5 hover:bg-purple-600/30 hover:text-white cursor-pointer transition-colors"
                  >
                    <span className="font-medium text-white">@GitHub (MCP Agent)</span>
                    {selectedAgent === 'GitHub' && <span className="text-emerald-400 text-[10px]">● Active</span>}
                  </div>
                  <div 
                    onClick={() => { setSelectedAgent('AppTester'); setActiveView('editor'); setSidebarTab('ai'); setActiveMenu(null); showToast('Switched to @AppTester'); }}
                    className="flex items-center justify-between px-3 py-1.5 hover:bg-purple-600/30 hover:text-white cursor-pointer transition-colors"
                  >
                    <span className="font-medium text-white">@AppTester (E2E Testing)</span>
                    {selectedAgent === 'AppTester' && <span className="text-emerald-400 text-[10px]">● Active</span>}
                  </div>
                  <div className="h-[1px] bg-zinc-800 my-1"></div>
                  <div 
                    onClick={() => { setActiveView('ai-config'); setActiveMenu(null); }}
                    className="flex items-center justify-between px-3 py-1.5 hover:bg-purple-600/30 hover:text-white cursor-pointer transition-colors"
                  >
                    <span>AI Configuration Overview</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Alt+A</span>
                  </div>
                  <div 
                    onClick={() => { setIsCommandPaletteOpen(true); setActiveMenu(null); }}
                    className="flex items-center justify-between px-3 py-1.5 hover:bg-purple-600/30 hover:text-white cursor-pointer transition-colors"
                  >
                    <span>Quick Open / Go to File...</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Ctrl+P</span>
                  </div>
                </div>
              )}
            </span>

            {/* 6. Run Menu */}
            <span 
              className={`relative px-2 py-1 rounded cursor-pointer transition-all select-none ${activeMenu === 'run' ? 'bg-purple-600/25 text-white shadow-sm ring-1 ring-purple-400/40' : 'hover:text-white hover:bg-zinc-800/80'}`}
              onClick={() => setActiveMenu(activeMenu === 'run' ? null : 'run')}
              onMouseEnter={() => { if (activeMenu) setActiveMenu('run'); }}
            >
              <span>Run</span>
              {activeMenu === 'run' && (
                <div 
                  className="absolute top-full left-0 mt-1 w-56 bg-[#12141A]/95 backdrop-blur-2xl border border-zinc-700/70 rounded-lg shadow-2xl py-1.5 z-50 text-xs text-zinc-300 font-sans"
                  onClick={e => e.stopPropagation()}
                >
                  <div 
                    onClick={() => { handleRunTerminalCommand('node --inspect src/index.ts'); setActiveMenu(null); }}
                    className="flex items-center justify-between px-3 py-1.5 hover:bg-purple-600/30 hover:text-white cursor-pointer transition-colors"
                  >
                    <span>Start Debugging</span>
                    <span className="text-[10px] text-zinc-500 font-mono">F5</span>
                  </div>
                  <div 
                    onClick={() => { handleRunTerminalCommand('npm run dev'); setActiveMenu(null); }}
                    className="flex items-center justify-between px-3 py-1.5 hover:bg-purple-600/30 hover:text-white cursor-pointer transition-colors"
                  >
                    <span>Run Without Debugging</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Ctrl+F5</span>
                  </div>
                  <div className="h-[1px] bg-zinc-800 my-1"></div>
                  <div 
                    onClick={() => { handleRunTerminalCommand('npm run build'); setActiveMenu(null); }}
                    className="flex items-center justify-between px-3 py-1.5 hover:bg-purple-600/30 hover:text-white cursor-pointer transition-colors"
                  >
                    <span>Run Build Task</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Ctrl+Shift+B</span>
                  </div>
                  <div 
                    onClick={() => { handleRunTerminalCommand('npm test'); setActiveMenu(null); }}
                    className="flex items-center justify-between px-3 py-1.5 hover:bg-purple-600/30 hover:text-white cursor-pointer transition-colors"
                  >
                    <span>Run Test Task</span>
                  </div>
                </div>
              )}
            </span>

            {/* 7. Terminal Menu */}
            <span 
              className={`relative px-2 py-1 rounded cursor-pointer transition-all select-none ${activeMenu === 'terminal' ? 'bg-purple-600/25 text-white shadow-sm ring-1 ring-purple-400/40' : 'hover:text-white hover:bg-zinc-800/80'}`}
              onClick={() => setActiveMenu(activeMenu === 'terminal' ? null : 'terminal')}
              onMouseEnter={() => { if (activeMenu) setActiveMenu('terminal'); }}
            >
              <span>Terminal</span>
              {activeMenu === 'terminal' && (
                <div 
                  className="absolute top-full left-0 mt-1 w-56 bg-[#12141A]/95 backdrop-blur-2xl border border-zinc-700/70 rounded-lg shadow-2xl py-1.5 z-50 text-xs text-zinc-300 font-sans"
                  onClick={e => e.stopPropagation()}
                >
                  <div 
                    onClick={() => { setIsBottomPanelOpen(true); setBottomPanelTab('terminal'); setActiveMenu(null); showToast('Terminal ready'); }}
                    className="flex items-center justify-between px-3 py-1.5 hover:bg-purple-600/30 hover:text-white cursor-pointer transition-colors"
                  >
                    <span>New Terminal</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Ctrl+Shift+`</span>
                  </div>
                  <div 
                    onClick={() => { setTerminalLogs(['Eclipse Theia IDE v1.76.0']); showToast('Terminal cleared'); setActiveMenu(null); }}
                    className="flex items-center justify-between px-3 py-1.5 hover:bg-purple-600/30 hover:text-white cursor-pointer transition-colors"
                  >
                    <span>Clear Terminal</span>
                  </div>
                  <div className="h-[1px] bg-zinc-800 my-1"></div>
                  <div 
                    onClick={() => { handleRunTerminalCommand('npm run build'); setActiveMenu(null); }}
                    className="flex items-center justify-between px-3 py-1.5 hover:bg-purple-600/30 hover:text-white cursor-pointer transition-colors"
                  >
                    <span>Run Build in Terminal</span>
                  </div>
                  <div 
                    onClick={() => { handleRunTerminalCommand('npm test'); setActiveMenu(null); }}
                    className="flex items-center justify-between px-3 py-1.5 hover:bg-purple-600/30 hover:text-white cursor-pointer transition-colors"
                  >
                    <span>Run Tests in Terminal</span>
                  </div>
                  <div 
                    onClick={() => { handleRunTerminalCommand('git status'); setActiveMenu(null); }}
                    className="flex items-center justify-between px-3 py-1.5 hover:bg-purple-600/30 hover:text-white cursor-pointer transition-colors"
                  >
                    <span>Run Git Status</span>
                  </div>
                </div>
              )}
            </span>

            {/* 8. Help Menu */}
            <span 
              className={`relative px-2 py-1 rounded cursor-pointer transition-all select-none ${activeMenu === 'help' ? 'bg-purple-600/25 text-white shadow-sm ring-1 ring-purple-400/40' : 'hover:text-white hover:bg-zinc-800/80'}`}
              onClick={() => setActiveMenu(activeMenu === 'help' ? null : 'help')}
              onMouseEnter={() => { if (activeMenu) setActiveMenu('help'); }}
            >
              <span>Help</span>
              {activeMenu === 'help' && (
                <div 
                  className="absolute top-full left-0 mt-1 w-60 bg-[#12141A]/95 backdrop-blur-2xl border border-zinc-700/70 rounded-lg shadow-2xl py-1.5 z-50 text-xs text-zinc-300 font-sans"
                  onClick={e => e.stopPropagation()}
                >
                  <div 
                    onClick={() => { setActiveView('welcome'); setActiveMenu(null); }}
                    className="flex items-center justify-between px-3 py-1.5 hover:bg-purple-600/30 hover:text-white cursor-pointer transition-colors"
                  >
                    <span>Welcome & Walkthrough</span>
                  </div>
                  <div 
                    onClick={() => { setActiveView('ai-config'); setActiveMenu(null); }}
                    className="flex items-center justify-between px-3 py-1.5 hover:bg-purple-600/30 hover:text-white cursor-pointer transition-colors"
                  >
                    <span>Getting Started with Theia AI</span>
                  </div>
                  <div className="h-[1px] bg-zinc-800 my-1"></div>
                  <div 
                    onClick={() => { setIsCommandPaletteOpen(true); setActiveMenu(null); }}
                    className="flex items-center justify-between px-3 py-1.5 hover:bg-purple-600/30 hover:text-white cursor-pointer transition-colors"
                  >
                    <span>Command Palette...</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Ctrl+Shift+P</span>
                  </div>
                  <div className="h-[1px] bg-zinc-800 my-1"></div>
                  <div 
                    onClick={() => { setAboutDialogOpen(true); setActiveMenu(null); }}
                    className="flex items-center justify-between px-3 py-1.5 hover:bg-purple-600/30 hover:text-white cursor-pointer transition-colors font-medium text-white"
                  >
                    <span>About Eclipse Theia IDE</span>
                  </div>
                </div>
              )}
            </span>
          </div>
        </div>
        
        {/* Quick Command Search Bar */}
        <div 
          onClick={() => setIsCommandPaletteOpen(true)}
          className="flex items-center space-x-2 bg-zinc-900 border border-zinc-700/60 rounded-md px-3 py-1 text-zinc-400 hover:text-white cursor-pointer w-64 md:w-80 transition-colors shadow-inner"
        >
          <Search size={12} className="text-purple-400" />
          <span className="text-[11px] flex-1 truncate">Type a command or search...</span>
          <kbd className="bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded text-[9px] border border-zinc-700">Ctrl+Shift+P</kbd>
        </div>

        <div className="flex items-center space-x-3">
          <span className="hidden lg:inline text-purple-400 font-medium">✨ Theia AI Enabled</span>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse"></div>
        </div>
      </div>

      {/* Main Workbench Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Activity Bar */}
        <div className="w-12 bg-[#18181b] flex flex-col items-center py-2 space-y-3 border-r border-zinc-800 text-zinc-400 z-20">
          <button 
            onClick={() => { setActiveView('editor'); setSidebarTab('explorer'); }} 
            className={`p-2.5 rounded-lg transition-all ${activeView === 'editor' && sidebarTab === 'explorer' ? 'text-white bg-zinc-800 border-l-2 border-purple-500 shadow-sm' : 'hover:text-zinc-200 hover:bg-zinc-800/50'}`}
            title="Explorer"
          >
            <FolderTree size={20} />
          </button>
          <button 
            onClick={() => { setActiveView('editor'); setSidebarTab('search'); }} 
            className={`p-2.5 rounded-lg transition-all ${sidebarTab === 'search' ? 'text-white bg-zinc-800 border-l-2 border-purple-500 shadow-sm' : 'hover:text-zinc-200 hover:bg-zinc-800/50'}`}
            title="Search"
          >
            <Search size={20} />
          </button>
          <button 
            onClick={() => { setActiveView('editor'); setSidebarTab('git'); }} 
            className={`p-2.5 rounded-lg transition-all ${sidebarTab === 'git' ? 'text-white bg-zinc-800 border-l-2 border-purple-500 shadow-sm' : 'hover:text-zinc-200 hover:bg-zinc-800/50'}`}
            title="Source Control"
          >
            <GitBranch size={20} />
          </button>
          <button 
            onClick={() => setActiveView('extensions')} 
            className={`p-2.5 rounded-lg transition-all ${activeView === 'extensions' ? 'text-white bg-zinc-800 border-l-2 border-purple-500 shadow-sm' : 'hover:text-zinc-200 hover:bg-zinc-800/50'}`}
            title="Extensions & AI Registry"
          >
            <Puzzle size={20} />
          </button>
          <button 
            onClick={() => { setActiveView('editor'); setSidebarTab('ai'); }} 
            className={`p-2.5 rounded-lg transition-all ${sidebarTab === 'ai' ? 'text-white bg-zinc-800 border-l-2 border-purple-500 shadow-sm' : 'hover:text-zinc-200 hover:bg-zinc-800/50'}`}
            title="AI Chat & Agents"
          >
            <Bot size={20} className="text-purple-400 animate-pulse" />
          </button>
          <div className="flex-1"></div>
          <button 
            onClick={() => setActiveView('ai-config')} 
            className={`p-2.5 rounded-lg transition-all ${activeView === 'ai-config' ? 'text-white bg-zinc-800 border-l-2 border-purple-500 shadow-sm' : 'hover:text-zinc-200 hover:bg-zinc-800/50'}`}
            title="AI Configuration View"
          >
            <Sliders size={20} />
          </button>
          <button 
            onClick={() => { setActiveView('editor'); setSidebarTab('settings'); }} 
            className={`p-2.5 rounded-lg transition-all ${sidebarTab === 'settings' ? 'text-white bg-zinc-800 border-l-2 border-purple-500 shadow-sm' : 'hover:text-zinc-200 hover:bg-zinc-800/50'}`}
            title="Settings"
          >
            <Settings size={20} />
          </button>
        </div>

        {/* Primary Sidebar */}
        {activeView === 'editor' && (
          <div className="w-64 bg-[#1f1f23] border-r border-zinc-800 flex flex-col z-10">
            <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-800 flex items-center justify-between">
              <span>{sidebarTab === 'explorer' ? 'Explorer' : sidebarTab === 'ai' ? 'Theia AI Chat' : sidebarTab.toUpperCase()}</span>
              {sidebarTab === 'explorer' && (
                <button onClick={() => {}} className="text-zinc-400 hover:text-white" title="Refresh">
                  <RefreshCw size={13} />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {sidebarTab === 'explorer' && (
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-zinc-400 px-2 py-1 flex items-center space-x-1">
                    <ChevronDown size={14} />
                    <span>THEIA-IDE-WORKSPACE</span>
                  </div>
                  {Object.keys(files).map(filename => (
                    <button
                      key={filename}
                      onClick={() => { setActiveFile(filename); if (!openFiles.includes(filename)) setOpenFiles([...openFiles, filename]); }}
                      className={`w-full flex items-center space-x-2 px-3 py-1.5 rounded text-xs text-left transition-colors ${activeFile === filename ? 'bg-purple-600/20 text-purple-300 font-medium' : 'text-zinc-300 hover:bg-zinc-800'}`}
                    >
                      <FileCode size={14} className="text-purple-400 shrink-0" />
                      <span className="truncate">{filename}</span>
                    </button>
                  ))}
                </div>
              )}

              {sidebarTab === 'ai' && (
                <div className="space-y-3 text-xs">
                  <div className="p-2 bg-purple-950/30 border border-purple-500/30 rounded">
                    <div className="font-bold text-purple-300 flex items-center space-x-1">
                      <Sparkles size={12} />
                      <span>Active Agent: @{selectedAgent}</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-1">Model: {selectedModel}</div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase text-zinc-500 font-bold">Switch Agent</label>
                    <div className="grid grid-cols-2 gap-1">
                      {['Coder', 'Architect', 'Universal', 'GitHub', 'AppTester', 'ClaudeCode'].map(agent => (
                        <button
                          key={agent}
                          onClick={() => setSelectedAgent(agent)}
                          className={`px-2 py-1 rounded text-left text-[11px] transition-colors ${selectedAgent === agent ? 'bg-purple-600 text-white font-medium' : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-800'}`}
                        >
                          @{agent}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {sidebarTab === 'git' && (
                <div className="space-y-3 text-xs p-1">
                  <div className="font-bold text-zinc-300 flex items-center justify-between">
                    <span>Changes (1)</span>
                    <button className="bg-purple-600 hover:bg-purple-500 text-white px-2 py-0.5 rounded text-[10px]">Commit AI ✨</button>
                  </div>
                  <div className="flex items-center space-x-2 p-1.5 bg-zinc-900 rounded text-zinc-300">
                    <span className="text-amber-400 font-mono text-[10px]">M</span>
                    <span className="truncate">src/index.ts</span>
                  </div>
                </div>
              )}

              {sidebarTab === 'extensions' && (
                <div className="space-y-2 text-xs">
                  <div className="font-bold text-zinc-300 mb-1">Installed AI Extensions</div>
                  <div className="p-2 bg-zinc-900 rounded border border-zinc-800">
                    <div className="font-bold text-purple-400">Theia AI Core 1.76</div>
                    <div className="text-zinc-400 text-[10px]">Multi-agent orchestration & MCP</div>
                  </div>
                  <div className="p-2 bg-zinc-900 rounded border border-zinc-800">
                    <div className="font-bold text-purple-400">Claude Code Bridge</div>
                    <div className="text-zinc-400 text-[10px]">Native agent integration</div>
                  </div>
                </div>
              )}

              {sidebarTab === 'settings' && (
                <div className="space-y-3 text-xs">
                  <div className="font-bold text-zinc-300">Workspace Settings</div>
                  <div>
                    <label className="text-zinc-400 text-[10px]">Font Size</label>
                    <select className="w-full bg-zinc-900 border border-zinc-700 rounded p-1 mt-1 text-white text-xs">
                      <option>14px</option>
                      <option>16px</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Central Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#18181b]">
          {activeView === 'welcome' && (
            <div className="flex-1 overflow-y-auto p-8 lg:p-12 bg-gradient-to-br from-[#18181b] via-[#1f1f23] to-[#18181b]">
              <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center space-x-6 border-b border-zinc-800 pb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-600 via-indigo-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/20 text-white text-4xl font-bold font-heading">
                    Θ
                  </div>
                  <div>
                    <h1 className="text-3xl font-heading font-bold text-white">Eclipse Theia IDE</h1>
                    <p className="text-zinc-400 text-sm mt-1">AI-Powered Cloud Development Environment & Extension Platform (v1.76.0)</p>
                  </div>
                </div>

                {/* Walkthrough Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-[#1f1f23] border border-zinc-800 rounded-xl p-6 hover:border-purple-500/50 transition-all group cursor-pointer" onClick={() => setActiveView('editor')}>
                    <div className="flex items-center space-x-3 text-purple-400 mb-3">
                      <Sparkles size={20} />
                      <h3 className="font-heading font-bold text-white text-base">Get Started with AI</h3>
                    </div>
                    <p className="text-zinc-400 text-xs leading-relaxed">
                      Explore AI-driven coding with full control, multi-agent reasoning, task context planning, and model discovery.
                    </p>
                    <div className="mt-4 flex items-center text-purple-400 text-xs font-semibold group-hover:translate-x-1 transition-transform">
                      <span>Launch Workbench</span>
                      <ChevronRight size={14} className="ml-1" />
                    </div>
                  </div>

                  <div className="bg-[#1f1f23] border border-zinc-800 rounded-xl p-6 hover:border-purple-500/50 transition-all group cursor-pointer" onClick={() => setActiveView('ai-config')}>
                    <div className="flex items-center space-x-3 text-cyan-400 mb-3">
                      <Sliders size={20} />
                      <h3 className="font-heading font-bold text-white text-base">AI Configuration & Providers</h3>
                    </div>
                    <p className="text-zinc-400 text-xs leading-relaxed">
                      Configure Gemini, OpenAI, Anthropic, Ollama, and MCP servers with real-time model discovery and request settings.
                    </p>
                    <div className="mt-4 flex items-center text-cyan-400 text-xs font-semibold group-hover:translate-x-1 transition-transform">
                      <span>Configure Providers</span>
                      <ChevronRight size={14} className="ml-1" />
                    </div>
                  </div>

                  <div className="bg-[#1f1f23] border border-zinc-800 rounded-xl p-6 hover:border-purple-500/50 transition-all group cursor-pointer" onClick={() => { setActiveView('editor'); setSidebarTab('ai'); }}>
                    <div className="flex items-center space-x-3 text-emerald-400 mb-3">
                      <Bot size={20} />
                      <h3 className="font-heading font-bold text-white text-base">Theia Coder & Agents</h3>
                    </div>
                    <p className="text-zinc-400 text-xs leading-relaxed">
                      Chat with specialized agents (@Coder, @Architect, @GitHub, @AppTester) to plan, build, and test applications.
                    </p>
                    <div className="mt-4 flex items-center text-emerald-400 text-xs font-semibold group-hover:translate-x-1 transition-transform">
                      <span>Open AI Chat</span>
                      <ChevronRight size={14} className="ml-1" />
                    </div>
                  </div>

                  <div className="bg-[#1f1f23] border border-zinc-800 rounded-xl p-6 hover:border-purple-500/50 transition-all group cursor-pointer" onClick={() => setActiveView('extensions')}>
                    <div className="flex items-center space-x-3 text-amber-400 mb-3">
                      <Puzzle size={20} />
                      <h3 className="font-heading font-bold text-white text-base">Extensions & AI Registry</h3>
                    </div>
                    <p className="text-zinc-400 text-xs leading-relaxed">
                      Discover and install Eclipse Foundation AI Registry MCP servers, skills, and agent plugins.
                    </p>
                    <div className="mt-4 flex items-center text-amber-400 text-xs font-semibold group-hover:translate-x-1 transition-transform">
                      <span>Browse Registry</span>
                      <ChevronRight size={14} className="ml-1" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'editor' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Editor Tabs & Breadcrumbs */}
              <div className="flex items-center bg-[#1f1f23] border-b border-zinc-800 overflow-x-auto">
                {openFiles.map(filename => (
                  <div
                    key={filename}
                    onClick={() => setActiveFile(filename)}
                    className={`flex items-center space-x-2 px-4 py-2 border-r border-zinc-800 text-xs cursor-pointer ${activeFile === filename ? 'bg-[#18181b] text-purple-300 border-t-2 border-t-purple-500 font-medium' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'}`}
                  >
                    <span>{filename}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const nextOpen = openFiles.filter(f => f !== filename);
                        setOpenFiles(nextOpen);
                        if (activeFile === filename && nextOpen.length > 0) setActiveFile(nextOpen[0]);
                      }}
                      className="hover:text-white"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {/* Split Editor & AI Chat Panel */}
              <div className="flex-1 flex overflow-hidden">
                {/* Code Editor */}
                <div className="flex-1 flex flex-col bg-[#1e1e24] border-r border-zinc-800 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-1.5 bg-[#18181b] border-b border-zinc-800 text-xs text-zinc-400">
                    <span className="font-mono text-[11px] text-zinc-300">{activeFile}</span>
                    <button
                      onClick={handleSave}
                      className="flex items-center space-x-1 bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded text-xs transition-colors shadow-sm"
                    >
                      <Save size={12} />
                      <span>Save Changes</span>
                    </button>
                  </div>
                  <div className="flex-1 flex overflow-hidden font-mono text-xs">
                    <div className="w-12 bg-[#18181b]/60 text-zinc-600 py-4 pr-3 text-right select-none border-r border-zinc-800 space-y-1">
                      {fileContent.split('\n').map((_, i) => (
                        <div key={i}>{i + 1}</div>
                      ))}
                    </div>
                    <textarea
                      value={fileContent}
                      onChange={e => setFileContent(e.target.value)}
                      className="flex-1 bg-transparent text-zinc-200 p-4 resize-none focus:outline-none font-mono text-xs leading-relaxed"
                      spellCheck="false"
                    />
                  </div>
                </div>

                {/* Theia AI Chat Drawer (Right Pane) */}
                <div className="w-96 bg-[#1f1f23] flex flex-col border-l border-zinc-800">
                  <div className="px-4 py-3 bg-[#18181b] border-b border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bot size={16} className="text-purple-400" />
                      <span className="font-heading font-bold text-white text-xs">Theia AI Chat</span>
                    </div>
                    <span className="text-[10px] bg-purple-600/30 text-purple-300 px-2 py-0.5 rounded-full font-medium">@{selectedAgent}</span>
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {aiChat.map((msg, idx) => (
                      <div key={idx} className={`p-3 rounded-lg text-xs ${msg.role === 'user' ? 'bg-purple-950/40 text-purple-100 ml-3 border border-purple-500/20' : 'bg-zinc-800/80 text-zinc-200 mr-3 border border-zinc-700/50'}`}>
                        <div className="flex items-center justify-between mb-1.5 text-[10px] text-zinc-400 font-semibold">
                          <span>{msg.role === 'user' ? 'You' : `@${msg.agent}`}</span>
                          <span className="text-[9px] bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-400">{msg.model}</span>
                        </div>
                        <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                      </div>
                    ))}
                    {isAiLoading && (
                      <div className="p-3 bg-zinc-800/80 text-purple-300 rounded-lg text-xs animate-pulse flex items-center space-x-2">
                        <Sparkles size={14} className="animate-spin" />
                        <span>@{selectedAgent} is thinking ({reasoningLevel} reasoning)...</span>
                      </div>
                    )}
                  </div>

                  {/* Capability Chips */}
                  <div className="px-3 py-2 bg-[#18181b] border-t border-zinc-800 flex flex-wrap gap-1.5">
                    <button 
                      onClick={() => setCapabilities(c => ({ ...c, shell: !c.shell }))}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${capabilities.shell ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                    >
                      ⚡ Shell
                    </button>
                    <button 
                      onClick={() => setCapabilities(c => ({ ...c, github: !c.github }))}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${capabilities.github ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                    >
                      🐙 GitHub
                    </button>
                    <button 
                      onClick={() => setCapabilities(c => ({ ...c, appTester: !c.appTester }))}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${capabilities.appTester ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                    >
                      🧪 AppTester
                    </button>
                    <button 
                      onClick={() => setCapabilities(c => ({ ...c, memory: !c.memory }))}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${capabilities.memory ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                    >
                      🧠 Memory
                    </button>
                  </div>

                  {/* Chat Input */}
                  <form onSubmit={handleAiSubmit} className="p-3 bg-[#1f1f23] border-t border-zinc-800">
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-2 text-[10px] text-zinc-400">
                        <span>Model:</span>
                        <select 
                          value={selectedModel} 
                          onChange={e => setSelectedModel(e.target.value)}
                          className="bg-zinc-900 border border-zinc-700 rounded px-1.5 py-0.5 text-white"
                        >
                          <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                          <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                          <option value="gpt-4o">GPT-4o</option>
                        </select>
                        <span>Reasoning:</span>
                        <select 
                          value={reasoningLevel} 
                          onChange={e => setReasoningLevel(e.target.value)}
                          className="bg-zinc-900 border border-zinc-700 rounded px-1.5 py-0.5 text-white"
                        >
                          <option>Off</option>
                          <option>Low</option>
                          <option>Medium</option>
                          <option>High</option>
                        </select>
                      </div>
                      <div className="flex space-x-1.5">
                        <input
                          type="text"
                          value={aiPrompt}
                          onChange={e => setAiPrompt(e.target.value)}
                          placeholder={`Ask @${selectedAgent} or type /help...`}
                          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                        />
                        <button type="submit" disabled={isAiLoading} className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-md text-xs font-semibold shadow-md">
                          Send
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {activeView === 'ai-config' && (
            <div className="flex-1 overflow-y-auto p-8 lg:p-12 bg-[#18181b]">
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="border-b border-zinc-800 pb-4">
                  <h1 className="text-2xl font-heading font-bold text-white">AI Configuration View</h1>
                  <p className="text-zinc-400 text-xs mt-1">Manage LLM providers, model discovery, agent settings, tool confirmations, and MCP servers.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-[#1f1f23] border border-zinc-800 rounded-lg p-5">
                    <h3 className="font-heading font-bold text-white text-sm mb-2 text-purple-400">Google AI (Gemini)</h3>
                    <p className="text-zinc-400 text-xs mb-3">API Key configured via environment variables / server proxy.</p>
                    <span className="inline-block bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-semibold">Active Provider</span>
                  </div>
                  <div className="bg-[#1f1f23] border border-zinc-800 rounded-lg p-5">
                    <h3 className="font-heading font-bold text-white text-sm mb-2 text-purple-400">Anthropic Claude</h3>
                    <p className="text-zinc-400 text-xs mb-3">Model discovery active for Claude 3.5 & Claude Code.</p>
                    <span className="inline-block bg-zinc-800 text-zinc-300 text-[10px] px-2 py-0.5 rounded font-semibold">Ready</span>
                  </div>
                  <div className="bg-[#1f1f23] border border-zinc-800 rounded-lg p-5">
                    <h3 className="font-heading font-bold text-white text-sm mb-2 text-purple-400">OpenAI Compatible</h3>
                    <p className="text-zinc-400 text-xs mb-3">Connect custom endpoints, VLLM, or Ollama models.</p>
                    <span className="inline-block bg-zinc-800 text-zinc-300 text-[10px] px-2 py-0.5 rounded font-semibold">Configurable</span>
                  </div>
                </div>

                <div className="bg-[#1f1f23] border border-zinc-800 rounded-lg p-6 space-y-4">
                  <h3 className="font-heading font-bold text-white text-base">Model Aliases & Defaults</h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between p-3 bg-zinc-900 rounded border border-zinc-800">
                      <div>
                        <div className="font-bold text-white">default/universal</div>
                        <div className="text-zinc-400 text-[10px]">Conversational chat & general-purpose interactions</div>
                      </div>
                      <span className="text-purple-400 font-mono">gemini-2.5-flash</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-zinc-900 rounded border border-zinc-800">
                      <div>
                        <div className="font-bold text-white">default/code</div>
                        <div className="text-zinc-400 text-[10px]">Coding-focused tasks and Theia Coder agent</div>
                      </div>
                      <span className="text-purple-400 font-mono">claude-3-5-sonnet</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'extensions' && (
            <div className="flex-1 overflow-y-auto p-8 lg:p-12 bg-[#18181b]">
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="border-b border-zinc-800 pb-4 flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-heading font-bold text-white">Extensions & AI Registry</h1>
                    <p className="text-zinc-400 text-xs mt-1">Eclipse Foundation AI Registry for approved MCP servers, skills, and agent plugins.</p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="bg-purple-600 text-white px-3 py-1.5 rounded text-xs font-semibold">Add Local MCP</button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-[#1f1f23] border border-zinc-800 rounded-lg p-5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-sm">GitHub MCP Server</span>
                        <span className="bg-purple-600/30 text-purple-300 text-[10px] px-2 py-0.5 rounded">MCP Server</span>
                      </div>
                      <p className="text-zinc-400 text-xs mt-1">Official GitHub integration for issues, pull requests, and repositories.</p>
                    </div>
                    <button className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-1.5 rounded text-xs font-semibold transition-colors">Install</button>
                  </div>

                  <div className="bg-[#1f1f23] border border-zinc-800 rounded-lg p-5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-sm">Code Review Skill</span>
                        <span className="bg-emerald-600/30 text-emerald-300 text-[10px] px-2 py-0.5 rounded">Skill</span>
                      </div>
                      <p className="text-zinc-400 text-xs mt-1">Provides comprehensive guidelines for thorough code quality and security reviews.</p>
                    </div>
                    <button className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-1.5 rounded text-xs font-semibold transition-colors">Install</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Panel (Terminal) */}
          {activeView === 'editor' && isBottomPanelOpen && (
            <div className="h-44 bg-[#18181b] border-t border-zinc-800 flex flex-col z-20">
              <div className="flex items-center justify-between px-4 py-1.5 bg-[#1f1f23] border-b border-zinc-800 text-xs text-zinc-400">
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => setBottomPanelTab('terminal')}
                    className={`flex items-center space-x-1.5 pb-1 border-b-2 font-medium transition-colors ${bottomPanelTab === 'terminal' ? 'text-white border-purple-500' : 'border-transparent hover:text-zinc-300'}`}
                  >
                    <TerminalIcon size={13} />
                    <span>Terminal</span>
                  </button>
                  <button 
                    onClick={() => setBottomPanelTab('problems')}
                    className={`flex items-center space-x-1.5 pb-1 border-b-2 font-medium transition-colors ${bottomPanelTab === 'problems' ? 'text-white border-purple-500' : 'border-transparent hover:text-zinc-300'}`}
                  >
                    <AlertCircle size={13} />
                    <span>Problems (0)</span>
                  </button>
                  <button 
                    onClick={() => setBottomPanelTab('output')}
                    className={`flex items-center space-x-1.5 pb-1 border-b-2 font-medium transition-colors ${bottomPanelTab === 'output' ? 'text-white border-purple-500' : 'border-transparent hover:text-zinc-300'}`}
                  >
                    <Layers size={13} />
                    <span>Output</span>
                  </button>
                </div>
                <button onClick={() => setIsBottomPanelOpen(false)} className="hover:text-white" title="Close Panel">
                  <X size={14} />
                </button>
              </div>

              {bottomPanelTab === 'terminal' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 p-3 overflow-y-auto font-mono text-xs text-zinc-300 space-y-1">
                    {terminalLogs.map((log, idx) => (
                      <div key={idx} className={log.startsWith('$') ? 'text-purple-300 font-semibold' : 'text-zinc-400'}>
                        {log}
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleTerminalSubmit} className="px-3 py-1.5 bg-[#1f1f23] border-t border-zinc-800 flex items-center space-x-2">
                    <span className="text-purple-400 font-mono text-xs">$</span>
                    <input
                      type="text"
                      value={terminalInput}
                      onChange={e => setTerminalInput(e.target.value)}
                      placeholder="Type a terminal command..."
                      className="flex-1 bg-transparent text-xs text-white font-mono focus:outline-none"
                    />
                  </form>
                </div>
              )}

              {bottomPanelTab === 'problems' && (
                <div className="flex-1 p-4 text-xs text-zinc-400 flex items-center justify-center">
                  No problems have been detected in the workspace.
                </div>
              )}

              {bottomPanelTab === 'output' && (
                <div className="flex-1 p-3 font-mono text-xs text-zinc-400 overflow-y-auto">
                  [Theia Application Manager] Initialized backend contributions successfully.<br/>
                  [Theia AI] Connected to Google GenAI provider (gemini-2.5-flash).<br/>
                  [Workspace] Watching for file changes in /workspace.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between h-6 px-3 bg-purple-900 text-white text-[11px] shrink-0 z-30 shadow-inner">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 font-medium cursor-pointer hover:bg-purple-800 px-1 rounded">
            <GitBranch size={11} />
            <span>main</span>
          </div>
          <span className="flex items-center space-x-1 cursor-pointer hover:bg-purple-800 px-1 rounded">
            <span>0 </span>
            <AlertCircle size={11} />
            <span> 0</span>
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="cursor-pointer hover:bg-purple-800 px-1 rounded">Ln 1, Col 1</span>
          <span className="cursor-pointer hover:bg-purple-800 px-1 rounded">Spaces: 2</span>
          <span className="cursor-pointer hover:bg-purple-800 px-1 rounded">UTF-8</span>
          <span className="cursor-pointer hover:bg-purple-800 px-1 rounded font-medium">TypeScript JSX</span>
          <span className="cursor-pointer hover:bg-purple-800 px-1 rounded flex items-center space-x-1">
            <Sparkles size={11} />
            <span>Theia AI</span>
          </span>
        </div>
      </div>

      {/* Command Palette Modal */}
      {isCommandPaletteOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-24" onClick={() => setIsCommandPaletteOpen(false)}>
          <div className="w-[520px] bg-[#1f1f23] border border-zinc-700 rounded-xl shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-3 border-b border-zinc-800 flex items-center space-x-2">
              <Search size={16} className="text-purple-400" />
              <input
                type="text"
                autoFocus
                value={commandQuery}
                onChange={e => setCommandQuery(e.target.value)}
                placeholder="Type a command (e.g. Open AI Configuration, Build, Welcome)..."
                className="flex-1 bg-transparent text-sm text-white focus:outline-none"
              />
              <button onClick={() => setIsCommandPaletteOpen(false)} className="text-zinc-400 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto p-2 space-y-1 text-xs">
              {[
                { name: 'View: Welcome / Getting Started', action: () => { setActiveView('welcome'); setIsCommandPaletteOpen(false); } },
                { name: 'AI: Open AI Configuration View', action: () => { setActiveView('ai-config'); setIsCommandPaletteOpen(false); } },
                { name: 'AI: Toggle Theia Coder Chat', action: () => { setActiveView('editor'); setSidebarTab('ai'); setIsCommandPaletteOpen(false); } },
                { name: 'View: Extensions & AI Registry', action: () => { setActiveView('extensions'); setIsCommandPaletteOpen(false); } },
                { name: 'Terminal: Clear Terminal', action: () => { setTerminalLogs(['Eclipse Theia IDE v1.76.0']); setIsCommandPaletteOpen(false); } },
                { name: 'File: Save Current File', action: () => { handleSave(); setIsCommandPaletteOpen(false); } },
              ].filter(c => c.name.toLowerCase().includes(commandQuery.toLowerCase())).map((cmd, i) => (
                <div
                  key={i}
                  onClick={cmd.action}
                  className="px-3 py-2 rounded-lg text-zinc-300 hover:bg-purple-600 hover:text-white cursor-pointer flex items-center justify-between transition-colors"
                >
                  <span>{cmd.name}</span>
                  <span className="text-[10px] opacity-60">Command</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* About Theia IDE Modal */}
      {aboutDialogOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setAboutDialogOpen(false)}>
          <div className="w-[460px] bg-[#12141A]/95 border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 via-indigo-600 to-cyan-500 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-purple-500/30">
                  Θ
                </div>
                <div>
                  <h2 className="text-lg font-heading font-bold text-white">Eclipse Theia IDE</h2>
                  <p className="text-zinc-400 text-xs">Version 1.76.0 (Browser Edition)</p>
                </div>
              </div>
              <button onClick={() => setAboutDialogOpen(false)} className="text-zinc-400 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>
            <div className="bg-zinc-900/80 rounded-lg p-3 border border-zinc-800 text-xs space-y-1.5 text-zinc-300 font-mono">
              <div className="flex justify-between"><span className="text-zinc-500">Platform:</span><span>Browser Web Platform</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">AI Framework:</span><span className="text-purple-400">Theia AI (Gemini 2.5)</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Extensions:</span><span>35 Built-in</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Workspace:</span><span>/workspace</span></div>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Eclipse Theia is an extensible, vendor-neutral platform to build full-fledged multi-language cloud & desktop IDEs with modern web technologies.
            </p>
            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setAboutDialogOpen(false)}
                className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-1.5 rounded-lg text-xs font-semibold shadow-md transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Status Toast */}
      {statusToast && (
        <div className="fixed bottom-10 right-6 z-50 flex items-center space-x-2 bg-[#12141A]/95 text-zinc-100 border border-purple-500/40 rounded-lg px-4 py-2.5 shadow-2xl backdrop-blur-xl">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
          <span className="text-xs font-medium">{statusToast}</span>
        </div>
      )}

      {/* Brand Signature */}
      <div className="fixed bottom-2 left-2 z-50 pointer-events-none opacity-40 mix-blend-overlay text-[10px]">
        <div className="font-heading font-bold text-purple-400">ΛΞV Inc</div>
        <div className="font-sans font-light tracking-[0.2em] text-[8px] text-zinc-300">THE FUTURE NEEDS CONTEXT</div>
      </div>
    </div>
  );
}
