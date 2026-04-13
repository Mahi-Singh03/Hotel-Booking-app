"use client";
import { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from '@/src/app/context/ThemeContext';

export default function CodeSpace() {
  const { theme, activeTheme, mounted } = useTheme();
  const isLight = theme === 'light';
  const [pyodide, setPyodide] = useState(null);
  const [pyodideReady, setPyodideReady] = useState(false);

  // Available languages configuration
  const languages = {
    html: {
      name: 'HTML',
      extension: '.html',
      icon: '🌐',
      defaultCode: `<!DOCTYPE html>
<html>
<head>
  <title>HTML Preview</title>
</head>
<body>
  <h1>Hello World!</h1>
  <p>Start coding HTML here...</p>
</body>
</html>`
    },
    css: {
      name: 'CSS',
      extension: '.css',
      icon: '🎨',
      defaultCode: `body {
  font-family: system-ui, -apple-system, sans-serif;
  margin: 0;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

h1 {
  color: white;
  text-align: center;
}`
    },
    javascript: {
      name: 'JavaScript',
      extension: '.js',
      icon: '📜',
      defaultCode: `// JavaScript Playground
console.log('Hello from JavaScript!');

function greet(name) {
  return \`Welcome, \${name}!\`;
}

console.log(greet('Developer'));

// Try writing your code here
`
    },
    python: {
      name: 'Python',
      extension: '.py',
      icon: '🐍',
      defaultCode: `# Python Playground
print("Hello from Python!")

def calculate_sum(a, b):
    return a + b

result = calculate_sum(10, 20)
print(f"Sum: {result}")

# Write your Python code here
`
    },
    c: {
      name: 'C',
      extension: '.c',
      icon: '⚡',
      defaultCode: `#include <stdio.h>

int main() {
    printf("Hello from C!\\n");
    
    int numbers[] = {1, 2, 3, 4, 5};
    int sum = 0;
    
    for(int i = 0; i < 5; i++) {
        sum += numbers[i];
    }
    
    printf("Sum: %d\\n", sum);
    
    return 0;
}`
    }
  };

  const [activeLanguage, setActiveLanguage] = useState('html');
  const [code, setCode] = useState({});
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [executionTime, setExecutionTime] = useState(null);
  const iframeRef = useRef(null);

  // Initialize code states
  useEffect(() => {
    const initialCode = {};
    Object.keys(languages).forEach(lang => {
      initialCode[lang] = languages[lang].defaultCode;
    });
    setCode(initialCode);
  }, []);

  // Load Pyodide for Python execution
  useEffect(() => {
    const loadPyodide = async () => {
      try {
        // Load Pyodide script
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js';
        script.async = true;
        script.onload = async () => {
          if (window.loadPyodide) {
            const py = await window.loadPyodide();
            setPyodide(py);
            setPyodideReady(true);
          }
        };
        document.head.appendChild(script);
      } catch (error) {
        console.error('Failed to load Pyodide:', error);
        setPyodideReady(false);
      }
    };

    loadPyodide();
  }, []);

  // Get colors from active theme
  const getThemeColors = () => {
    const colors = activeTheme?.colors || {};
    
    return {
      bgMain: isLight ? '#ffffff' : '#1e1e1e',
      bgSidebar: isLight ? '#f3f3f3' : '#252526',
      bgActivityBar: isLight ? (colors.primary || '#2c2c2c') : '#333333',
      bgTitleBar: isLight ? '#dddddd' : '#323233',
      border: isLight ? (colors.border || '#cccccc') : '#444444',
      textMain: isLight ? (colors.text || '#333333') : '#cccccc',
      textMuted: isLight ? (colors.muted || '#666666') : '#888888',
      hoverBg: isLight ? (colors.accent ? `${colors.accent}20` : '#e4e6f1') : '#2a2d2e',
      activeItemBg: isLight ? (colors.accent ? `${colors.accent}30` : '#e4e6f1') : '#37373d',
      activeTabBorder: colors.secondary || colors.accent || '#007acc',
      statusBar: colors.primary || '#007acc',
      accentColor: colors.accent || colors.secondary || '#007acc',
      successColor: colors.success || '#10B981',
      warningColor: colors.warning || '#F59E0B',
      errorColor: colors.error || '#EF4444',
    };
  };

  const uiColors = getThemeColors();

  const handleCodeChange = (value) => {
    setCode(prev => ({
      ...prev,
      [activeLanguage]: value
    }));
  };

  const clearConsole = () => {
    setConsoleLogs([]);
    setOutput('');
  };

  const runCode = async () => {
    setIsRunning(true);
    clearConsole();
    const startTime = performance.now();

    try {
      if (activeLanguage === 'html' || activeLanguage === 'css' || activeLanguage === 'javascript') {
        // Web languages execution
        const iframe = iframeRef.current;
        if (iframe) {
          const htmlContent = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="UTF-8">
                <style>${code.css || ''}</style>
              </head>
              <body>
                ${code.html || ''}
                <script>
                  (function() {
                    const methods = ['log', 'error', 'warn', 'info'];
                    const originalConsole = {};
                    
                    methods.forEach(method => {
                      originalConsole[method] = console[method];
                      console[method] = function(...args) {
                        window.parent.postMessage({ 
                          type: 'console', 
                          method: method, 
                          message: args.map(arg => {
                            if (typeof arg === 'object') {
                              try {
                                return JSON.stringify(arg);
                              } catch(e) {
                                return String(arg);
                              }
                            }
                            return String(arg);
                          }).join(' ')
                        }, '*');
                        originalConsole[method].apply(console, args);
                      };
                    });

                    window.onerror = function(message) {
                      console.error(message);
                      return true;
                    };

                    try {
                      ${code.javascript || ''}
                    } catch(error) {
                      console.error('Error:', error.message);
                    }
                  })();
                </script>
              </body>
            </html>
          `;
          iframe.srcdoc = htmlContent;
        }
      } else if (activeLanguage === 'python') {
        // Python execution using Pyodide (in-browser)
        if (!pyodideReady || !pyodide) {
          setConsoleLogs([{
            method: 'error',
            message: 'Python runtime is loading. Please wait a moment and try again.',
            timestamp: new Date().toLocaleTimeString()
          }]);
          return;
        }

        try {
          // Wrap user code to capture output
          const wrappedCode = `
import sys
from io import StringIO

# Capture output
old_stdout = sys.stdout
captured_output = StringIO()
sys.stdout = captured_output

try:
${code.python.split('\n').map(line => '    ' + line).join('\n')}
except Exception as e:
    import traceback
    traceback.print_exc()

# Restore stdout and get the output
sys.stdout = old_stdout
final_output = captured_output.getvalue()
final_output
`;
          
          const result = pyodide.runPython(wrappedCode);
          const output = result?.toString() || '';
          
          if (output.trim()) {
            setConsoleLogs([{
              method: 'log',
              message: output,
              timestamp: new Date().toLocaleTimeString()
            }]);
          } else {
            setConsoleLogs([{
              method: 'log',
              message: 'Code executed successfully (no output)',
              timestamp: new Date().toLocaleTimeString()
            }]);
          }
        } catch (error) {
          setConsoleLogs([{
            method: 'error',
            message: error.toString(),
            timestamp: new Date().toLocaleTimeString()
          }]);
        }
      } else if (activeLanguage === 'c') {
        // C execution via backend API (Wandbox compiler)
        try {
          const response = await fetch('/api/execute', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              language: 'c',
              code: code.c
            }),
          });

          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }

          const result = await response.json();
          
          if (result.output) {
            setConsoleLogs([{
              method: 'log',
              message: result.output,
              timestamp: new Date().toLocaleTimeString()
            }]);
          }
          
          if (result.error) {
            setConsoleLogs(prev => [...prev, {
              method: 'error',
              message: result.error,
              timestamp: new Date().toLocaleTimeString()
            }]);
          }

          if (!result.output && !result.error) {
            setConsoleLogs([{
              method: 'log',
              message: 'Code executed successfully (no output)',
              timestamp: new Date().toLocaleTimeString()
            }]);
          }
        } catch (error) {
          setConsoleLogs([{
            method: 'error',
            message: `C Execution Error: ${error.message}`,
            timestamp: new Date().toLocaleTimeString()
          }]);
        }
      } else {
        // Other languages fallback
        setConsoleLogs([{
          method: 'error',
          message: `Execution not supported for ${activeLanguage}`,
          timestamp: new Date().toLocaleTimeString()
        }]);
      }
    } catch (error) {
      setConsoleLogs([{
        method: 'error',
        message: `Execution error: ${error.message}`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      const endTime = performance.now();
      setExecutionTime((endTime - startTime).toFixed(2));
      setIsRunning(false);
    }
  };

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'console') {
        setConsoleLogs((prev) => [...prev, { 
          method: event.data.method, 
          message: event.data.message,
          timestamp: new Date().toLocaleTimeString()
        }]);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (mounted && activeLanguage !== 'python') {
      runCode();
    } else if (mounted && activeLanguage === 'python' && pyodideReady) {
      runCode();
    }
  }, [mounted, activeLanguage, pyodideReady]);

  const getLanguageForEditor = () => {
    const languageMap = {
      html: 'html',
      css: 'css',
      javascript: 'javascript',
      python: 'python',
      c: 'c'
    };
    return languageMap[activeLanguage] || 'plaintext';
  };

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 93px)',
      marginTop: '20px',
      width: '100%',
      backgroundColor: uiColors.bgMain,
      color: uiColors.textMain,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      overflow: 'hidden',
      transition: 'background-color 0.3s ease, color 0.3s ease'
    },
    titleBar: {
      height: '35px',
      backgroundColor: uiColors.bgTitleBar,
      display: 'flex',
      alignItems: 'center',
      padding: '0 10px',
      borderBottom: `1px solid ${uiColors.border}`,
      flexShrink: 0,
      transition: 'background-color 0.3s ease, border-color 0.3s ease'
    },
    middleSection: {
      display: 'flex',
      flex: 1,
      overflow: 'hidden'
    },
    windowControls: {
      display: 'flex',
      gap: '8px',
      marginRight: '16px'
    },
    windowControl: {
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      display: 'inline-block'
    },
    titleBarContent: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      flex: 1
    },
    activityBar: {
      width: '48px',
      backgroundColor: uiColors.bgActivityBar,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '10px 0',
      borderRight: `1px solid ${uiColors.border}`,
      flexShrink: 0,
      transition: 'background-color 0.3s ease'
    },
    activityIcon: {
      width: '48px',
      height: '48px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px',
      cursor: 'pointer',
      transition: 'opacity 0.2s',
      opacity: 0.6,
    },
    mainContent: {
      display: 'flex',
      flex: 1,
      overflow: 'hidden'
    },
    sidebar: {
      width: '250px',
      backgroundColor: uiColors.bgSidebar,
      borderRight: `1px solid ${uiColors.border}`,
      display: 'flex',
      flexDirection: 'column',
      transition: 'background-color 0.3s ease, border-color 0.3s ease'
    },
    sidebarHeader: {
      padding: '12px 16px',
      fontSize: '11px',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      color: uiColors.textMuted,
      borderBottom: `1px solid ${uiColors.border}`
    },
    fileList: {
      flex: 1,
      overflowY: 'auto'
    },
    editorContainer: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    },
    tabsContainer: {
      display: 'flex',
      backgroundColor: uiColors.bgSidebar,
      borderBottom: `1px solid ${uiColors.border}`,
      padding: '0 8px',
      alignItems: 'center',
      transition: 'background-color 0.3s ease, border-color 0.3s ease',
      overflowX: 'auto'
    },
    outputContainer: {
      width: '45%',
      display: 'flex',
      flexDirection: 'column',
      borderLeft: `1px solid ${uiColors.border}`,
      backgroundColor: uiColors.bgMain,
      transition: 'background-color 0.3s ease, border-color 0.3s ease'
    },
    outputHeader: {
      padding: '8px 16px',
      backgroundColor: uiColors.bgSidebar,
      borderBottom: `1px solid ${uiColors.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      transition: 'background-color 0.3s ease, border-color 0.3s ease'
    },
    runButton: {
      padding: '6px 16px',
      backgroundColor: uiColors.accentColor,
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: 500,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      transition: 'all 0.2s ease',
      boxShadow: `0 2px 4px ${uiColors.accentColor}40`
    },
    outputArea: {
      flex: 1,
      backgroundColor: isLight ? '#f8f9fa' : '#1e1e1e',
      overflow: 'auto',
      padding: '16px',
      fontFamily: 'Consolas, Monaco, "Courier New", monospace',
      fontSize: '13px',
      lineHeight: '1.6'
    },
    consoleContainer: {
      height: '200px',
      backgroundColor: uiColors.bgSidebar,
      borderTop: `1px solid ${uiColors.border}`,
      display: 'flex',
      flexDirection: 'column',
      transition: 'background-color 0.3s ease, border-color 0.3s ease'
    },
    consoleHeader: {
      padding: '8px 16px',
      backgroundColor: uiColors.bgTitleBar,
      borderBottom: `1px solid ${uiColors.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      transition: 'background-color 0.3s ease, border-color 0.3s ease'
    },
    clearButton: {
      padding: '4px 12px',
      backgroundColor: 'transparent',
      color: uiColors.textMain,
      border: `1px solid ${uiColors.border}`,
      borderRadius: '4px',
      fontSize: '11px',
      cursor: 'pointer',
      transition: 'all 0.15s ease'
    },
    consoleOutput: {
      flex: 1,
      overflowY: 'auto',
      padding: '12px 16px',
      fontFamily: 'Consolas, Monaco, "Courier New", monospace',
      fontSize: '12px',
      lineHeight: '1.5',
      color: uiColors.textMain
    },
    statusBar: {
      height: '22px',
      backgroundColor: uiColors.statusBar,
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      padding: '0 12px',
      fontSize: '12px',
      flexShrink: 0,
      transition: 'background-color 0.3s ease'
    },
    statusBarItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      marginRight: '16px'
    }
  };

  const getTabStyle = (lang) => ({
    padding: '8px 16px',
    fontSize: '13px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    borderBottom: `2px solid ${activeLanguage === lang ? uiColors.activeTabBorder : 'transparent'}`,
    transition: 'all 0.15s ease',
    color: activeLanguage === lang ? uiColors.textMain : uiColors.textMuted,
    backgroundColor: activeLanguage === lang ? `${uiColors.accentColor}10` : 'transparent',
    whiteSpace: 'nowrap'
  });

  const getFileItemStyle = (lang) => ({
    padding: '8px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'all 0.15s ease',
    backgroundColor: activeLanguage === lang ? uiColors.activeItemBg : 'transparent',
    color: activeLanguage === lang ? uiColors.textMain : uiColors.textMuted,
    borderLeft: activeLanguage === lang ? `3px solid ${uiColors.activeTabBorder}` : '3px solid transparent'
  });

  if (!mounted) {
    return (
      <div style={{
        height: 'calc(100vh - 93px)',
        marginTop: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isLight ? '#ffffff' : '#1e1e1e'
      }}>
        <div style={{ fontSize: '14px', color: isLight ? '#666' : '#999' }}>
          Loading CodeSpace...
        </div>
      </div>
    );
  }

  const showPreview = ['html', 'css', 'javascript'].includes(activeLanguage);

  return (
    <div style={styles.container}>
      {/* Title Bar */}
      <div style={styles.titleBar}>
        <div style={styles.windowControls}>
          <span style={{...styles.windowControl, backgroundColor: '#ff5f56'}} />
          <span style={{...styles.windowControl, backgroundColor: '#ffbd2e'}} />
          <span style={{...styles.windowControl, backgroundColor: '#27c93f'}} />
        </div>
        <div style={styles.titleBarContent}>
          <span>{languages[activeLanguage].icon}</span>
          <span style={{ fontSize: '13px', color: uiColors.textMain, fontWeight: 500 }}>
            CodeSpace - {languages[activeLanguage].name} Playground
          </span>
        </div>
      </div>

      {/* Middle Section */}
      <div style={styles.middleSection}>
        {/* Activity Bar */}
        <div style={styles.activityBar}>
          <div style={styles.activityIcon}>📁</div>
          <div style={styles.activityIcon}>🔍</div>
          <div style={styles.activityIcon}>🔧</div>
          <div style={styles.activityIcon}>📦</div>
        </div>

        {/* Main Content */}
        <div style={styles.mainContent}>
          {/* Sidebar with file explorer */}
          <div style={styles.sidebar}>
            <div style={styles.sidebarHeader}>
              EXPLORER
            </div>
            <div style={styles.fileList}>
              {Object.entries(languages).map(([lang, config]) => (
                <div 
                  key={lang}
                  style={getFileItemStyle(lang)}
                  onClick={() => setActiveLanguage(lang)}
                  onMouseEnter={(e) => {
                    if (activeLanguage !== lang) e.currentTarget.style.backgroundColor = uiColors.hoverBg;
                  }}
                  onMouseLeave={(e) => {
                    if (activeLanguage !== lang) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <span>{config.icon}</span>
                  <span>playground{config.extension}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Editor Area */}
          <div style={styles.editorContainer}>
            {/* Tabs */}
            <div style={styles.tabsContainer}>
              {Object.entries(languages).map(([lang, config]) => (
                <div 
                  key={lang}
                  style={getTabStyle(lang)} 
                  onClick={() => setActiveLanguage(lang)}
                >
                  <span>{config.icon}</span>
                  <span>{config.name}</span>
                </div>
              ))}
            </div>

            {/* Editor */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <Editor
                height="100%"
                language={getLanguageForEditor()}
                theme={isLight ? "light" : "vs-dark"}
                value={code[activeLanguage]}
                onChange={handleCodeChange}
                options={{
                  automaticLayout: true,
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                  lineNumbers: 'on',
                  glyphMargin: false,
                  folding: true,
                  scrollBeyondLastLine: false,
                  renderWhitespace: 'selection',
                  tabSize: 2,
                  wordWrap: 'on',
                  padding: { top: 16, bottom: 16 },
                  smoothScrolling: true,
                  cursorBlinking: 'smooth',
                  formatOnPaste: true,
                  formatOnType: true,
                }}
              />
            </div>
          </div>

          {/* Output Panel */}
          <div style={styles.outputContainer}>
            <div style={styles.outputHeader}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: uiColors.textMain }}>
                Output
              </span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {executionTime && (
                  <span style={{ fontSize: '11px', color: uiColors.textMuted }}>
                    {executionTime}ms
                  </span>
                )}
                <button 
                  style={styles.runButton}
                  onClick={runCode}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.filter = 'brightness(1.1)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.filter = 'brightness(1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                  disabled={isRunning}
                >
                  <span>{isRunning ? '⏳' : '▶'}</span>
                  <span>{isRunning ? 'Running...' : 'Run'}</span>
                </button>
              </div>
            </div>
            
            {/* Output Area */}
            {showPreview ? (
              <iframe
                ref={iframeRef}
                title="output"
                style={{ 
                  flex: 1,
                  width: '100%', 
                  border: 'none',
                  backgroundColor: 'white'
                }}
                sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
              />
            ) : (
              <div style={styles.outputArea}>
                {output ? (
                  <pre style={{ 
                    margin: 0, 
                    color: uiColors.textMain,
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word'
                  }}>
                    {output}
                  </pre>
                ) : (
                  <div style={{ color: uiColors.textMuted, fontStyle: 'italic' }}>
                    Run your code to see output...
                  </div>
                )}
              </div>
            )}

            {/* Console Output */}
            <div style={styles.consoleContainer}>
              <div style={styles.consoleHeader}>
                <span style={{ fontSize: '12px', fontWeight: 500, color: uiColors.textMain }}>
                  Console
                </span>
                <button 
                  style={styles.clearButton}
                  onClick={clearConsole}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = uiColors.hoverBg;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Clear
                </button>
              </div>
              <div style={styles.consoleOutput}>
                {consoleLogs.length === 0 ? (
                  <div style={{ color: uiColors.textMuted, fontStyle: 'italic' }}>
                    No console output
                  </div>
                ) : (
                  consoleLogs.map((log, index) => (
                    <div key={index} style={{ 
                      marginBottom: '4px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px'
                    }}>
                      <span style={{ 
                        color: uiColors.textMuted,
                        fontSize: '11px',
                        userSelect: 'none'
                      }}>
                        {log.timestamp}
                      </span>
                      <span style={{ 
                        color: log.method === 'error' ? uiColors.errorColor : 
                               log.method === 'warn' ? uiColors.warningColor : 
                               uiColors.textMain
                      }}>
                        {log.method === 'error' && '❌ '}
                        {log.method === 'warn' && '⚠️ '}
                        {log.message}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div style={styles.statusBar}>
        <div style={styles.statusBarItem}>
          <span>{languages[activeLanguage].icon}</span>
          <span>{languages[activeLanguage].name}</span>
        </div>
        <div style={styles.statusBarItem}>
          <span>{isRunning ? '⏳' : '✅'}</span>
          <span>{isRunning ? 'Running' : 'Ready'}</span>
        </div>
        <div style={{...styles.statusBarItem, marginLeft: 'auto'}}>
          <span>UTF-8</span>
        </div>
        <div style={styles.statusBarItem}>
          <span>Ln 1, Col 1</span>
        </div>
      </div>
    </div>
  );
}