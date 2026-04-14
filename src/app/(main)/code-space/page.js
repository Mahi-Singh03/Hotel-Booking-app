"use client";
import { useState, useRef, useEffect, useCallback, useContext } from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from '@/src/app/context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { UserContext } from "@/src/app/components/additionals/userContext";
import ProtectedRoute from "@/src/app/components/additionals/protectedRoute";

function CodeSpaceContent() {
  const { isAuthenticated, loading: authLoading } = useContext(UserContext);
  const router = useRouter();

  const { theme, activeTheme, mounted } = useTheme();
  const isLight = theme === 'light';
  const [pyodide, setPyodide] = useState(null);
  const [pyodideReady, setPyodideReady] = useState(false);
  
  // Resizable panels state
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [outputWidth, setOutputWidth] = useState(45);
  const [consoleHeight, setConsoleHeight] = useState(250);
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const [isDraggingOutput, setIsDraggingOutput] = useState(false);
  const [isDraggingConsole, setIsDraggingConsole] = useState(false);

  // Available languages configuration with enhanced metadata
  const languages = {
    html: {
      name: 'HTML',
      extension: '.html',
      icon: '🌐',
      color: '#E34F26',
      category: 'Web',
      defaultCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interactive Preview</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    
    .card {
      background: white;
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      text-align: center;
      max-width: 500px;
      animation: fadeInUp 0.6s ease-out;
    }
    
    h1 {
      color: #333;
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }
    
    p {
      color: #666;
      line-height: 1.6;
    }
    
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>✨ Welcome to CodeSpace</h1>
    <p>Start building amazing things with HTML, CSS, and JavaScript</p>
  </div>
</body>
</html>`
    },
    css: {
      name: 'CSS',
      extension: '.css',
      icon: '🎨',
      color: '#264DE4',
      category: 'Web',
      defaultCode: `/* Modern CSS Playground */
:root {
  --primary: #667eea;
  --secondary: #764ba2;
  --dark: #1a1a2e;
  --light: #f5f5f5;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.glass-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 30px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.2);
  text-align: center;
  animation: float 3s ease-in-out infinite;
}

h1 {
  font-size: 3rem;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin-bottom: 1rem;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}

.button {
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 50px;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 0.2s;
}

.button:hover {
  transform: scale(1.05);
}`
    },
    javascript: {
      name: 'JavaScript',
      extension: '.js',
      icon: '📜',
      color: '#F7DF1E',
      category: 'Web',
      defaultCode: `// 🚀 Interactive JavaScript Playground
console.log('🎉 Welcome to the JavaScript Playground!');

// Modern JavaScript Features
const greetUser = (name = 'Developer') => {
  return \`✨ Hello, \${name}! Ready to code?\`;
};

// Async/Await Example
const fetchMockData = async () => {
  console.log('📡 Fetching data...');
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        user: 'John Doe',
        status: 'active',
        timestamp: new Date().toISOString()
      });
    }, 1000);
  });
};

// Array Methods Showcase
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
const sum = numbers.reduce((acc, curr) => acc + curr, 0);

console.log('🔢 Numbers:', numbers);
console.log('✨ Doubled:', doubled);
console.log('➕ Sum:', sum);

// DOM Manipulation (when running in browser)
const createCard = () => {
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = \`
    <h3>🎯 Interactive Card</h3>
    <p>Created at: \${new Date().toLocaleTimeString()}</p>
  \`;
  document.body.appendChild(card);
};

// Try it out!
greetUser('Coder');
fetchMockData().then(data => console.log('✅ Data received:', data));

// Event Loop Demo
setTimeout(() => {
  console.log('⏰ This runs after 1 second');
}, 1000);

console.log('🚀 Code execution in progress...');`
    },
    python: {
      name: 'Python',
      extension: '.py',
      icon: '🐍',
      color: '#3776AB',
      category: 'Backend',
      defaultCode: `# 🐍 Python Interactive Playground
import sys
import json
from datetime import datetime

print("🎉 Welcome to Python Playground!")
print(f"Python Version: {sys.version}")

# Data Structures Demo
class DataAnalyzer:
    def __init__(self, data):
        self.data = data
    
    def analyze(self):
        return {
            'length': len(self.data),
            'sum': sum(self.data),
            'average': sum(self.data) / len(self.data),
            'max': max(self.data),
            'min': min(self.data)
        }
    
    def transform(self, func):
        return [func(x) for x in self.data]

# Create sample data
numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
analyzer = DataAnalyzer(numbers)

# Perform analysis
analysis = analyzer.analyze()
print("\\n📊 Data Analysis Results:")
for key, value in analysis.items():
    print(f"  {key}: {value}")

# Transformations
squared = analyzer.transform(lambda x: x ** 2)
even_numbers = [x for x in numbers if x % 2 == 0]

print(f"\\n✨ Squared numbers: {squared}")
print(f"🎯 Even numbers: {even_numbers}")

# Dictionary comprehension
squares_dict = {x: x**2 for x in range(1, 6)}
print(f"\\n📚 Squares dictionary: {squares_dict}")

# Working with JSON
sample_data = {
    "name": "Python Playground",
    "timestamp": datetime.now().isoformat(),
    "features": ["dynamic", "versatile", "powerful"]
}
print(f"\\n📦 JSON Output:\\n{json.dumps(sample_data, indent=2)}")

print("\\n✅ Python execution completed successfully!")`
    },
    c: {
      name: 'C',
      extension: '.c',
      icon: '⚡',
      color: '#A8B9CC',
      category: 'System',
      defaultCode: `#include <stdio.h>
#include <stdlib.h>

// Function prototypes
void printHeader();
int calculateFactorial(int n);
void demonstrateArrays();
void demonstratePointers();

int main() {
    printHeader();
    
    // Basic operations
    int a = 10, b = 20;
    printf("\\n📐 Basic Math:\\n");
    printf("  %d + %d = %d\\n", a, b, a + b);
    printf("  %d * %d = %d\\n", a, b, a * b);
    
    // Factorial calculation
    int num = 5;
    int fact = calculateFactorial(num);
    printf("\\n🔢 Factorial of %d is %d\\n", num, fact);
    
    // Array demonstration
    demonstrateArrays();
    
    // Pointer demonstration
    demonstratePointers();
    
    // Loop examples
    printf("\\n🔄 Multiplication Table of 7:\\n");
    for(int i = 1; i <= 10; i++) {
        printf("  7 x %2d = %2d\\n", i, 7 * i);
    }
    
    printf("\\n✅ C program executed successfully!\\n");
    return 0;
}

void printHeader() {
    printf("=======================================\\n");
    printf("     ⚡ C Programming Playground       \\n");
    printf("=======================================\\n");
}

int calculateFactorial(int n) {
    if (n <= 1) return 1;
    return n * calculateFactorial(n - 1);
}

void demonstrateArrays() {
    printf("\\n📊 Array Operations:\\n");
    int numbers[] = {10, 20, 30, 40, 50};
    int size = sizeof(numbers) / sizeof(numbers[0]);
    int sum = 0;
    
    printf("  Numbers: ");
    for(int i = 0; i < size; i++) {
        printf("%d ", numbers[i]);
        sum += numbers[i];
    }
    printf("\\n  Sum: %d\\n", sum);
    printf("  Average: %.2f\\n", (float)sum / size);
}

void demonstratePointers() {
    printf("\\n🔍 Pointer Operations:\\n");
    int value = 100;
    int *ptr = &value;
    
    printf("  Value: %d\\n", value);
    printf("  Address: %p\\n", (void*)ptr);
    printf("  Dereferenced: %d\\n", *ptr);
    
    // Modify through pointer
    *ptr = 200;
    printf("  Modified value: %d\\n", value);
}`
    }
  };

  const [activeLanguage, setActiveLanguage] = useState('html');
  const [code, setCode] = useState({});
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [executionTime, setExecutionTime] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [editorFontSize, setEditorFontSize] = useState(14);
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
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js';
        script.async = true;
        script.onload = async () => {
          if (window.loadPyodide) {
            const py = await window.loadPyodide({
              indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.23.4/full/',
            });
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

  // Resize handlers
  const handleSidebarResize = useCallback((e) => {
    if (isDraggingSidebar) {
      const newWidth = e.clientX;
      if (newWidth >= 200 && newWidth <= 500) {
        setSidebarWidth(newWidth);
      }
    }
  }, [isDraggingSidebar]);

  const handleOutputResize = useCallback((e) => {
    if (isDraggingOutput) {
      const containerWidth = window.innerWidth;
      const newWidth = ((containerWidth - e.clientX) / containerWidth) * 100;
      if (newWidth >= 25 && newWidth <= 70) {
        setOutputWidth(newWidth);
      }
    }
  }, [isDraggingOutput]);

  const handleConsoleResize = useCallback((e) => {
    if (isDraggingConsole) {
      const containerRect = document.querySelector('[data-output-container]')?.getBoundingClientRect();
      if (containerRect) {
        const newHeight = containerRect.bottom - e.clientY;
        if (newHeight >= 150 && newHeight <= 600) {
          setConsoleHeight(newHeight);
        }
      }
    }
  }, [isDraggingConsole]);

  useEffect(() => {
    if (isDraggingSidebar || isDraggingOutput || isDraggingConsole) {
      const handleMouseMove = isDraggingSidebar ? handleSidebarResize : 
                             isDraggingOutput ? handleOutputResize : 
                             handleConsoleResize;
      const handleMouseUp = () => {
        setIsDraggingSidebar(false);
        setIsDraggingOutput(false);
        setIsDraggingConsole(false);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingSidebar, isDraggingOutput, isDraggingConsole, handleSidebarResize, handleOutputResize, handleConsoleResize]);

  // Get CSS variables from theme
  const getThemeStyles = () => {
    if (typeof window === 'undefined') return {
      background: 'var(--background)',
      foreground: 'var(--foreground)',
      primary: 'var(--primary)',
      secondary: 'var(--secondary)',
      accent: 'var(--accent)',
      muted: 'var(--muted)',
      border: 'var(--border)',
      card: 'var(--card-bg, var(--background))',
    };
    
    return {
      background: 'var(--background)',
      foreground: 'var(--foreground)',
      primary: 'var(--primary)',
      secondary: 'var(--secondary)',
      accent: 'var(--accent)',
      muted: 'var(--muted)',
      border: 'var(--border)',
      card: 'var(--card-bg, var(--background))',
    };
  };

  const themeStyles = getThemeStyles();

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
        const iframe = iframeRef.current;
        if (iframe) {
          const htmlContent = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                  * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                  }
                  ${code.css || ''}
                </style>
              </head>
              <body>
                ${code.html || ''}
                <script>
                  (function() {
                    const methods = ['log', 'error', 'warn', 'info', 'debug', 'table'];
                    const originalConsole = {};
                    
                    methods.forEach(method => {
                      originalConsole[method] = console[method];
                      console[method] = function(...args) {
                        window.parent.postMessage({ 
                          type: 'console', 
                          method: method, 
                          message: args.map(arg => {
                            if (arg === null) return 'null';
                            if (arg === undefined) return 'undefined';
                            if (typeof arg === 'object') {
                              try {
                                return JSON.stringify(arg, null, 2);
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

                    window.onerror = function(message, source, lineno, colno, error) {
                      console.error(\`\${message} (line \${lineno}, col \${colno})\`);
                      return true;
                    };

                    try {
                      ${code.javascript || ''}
                    } catch(error) {
                      console.error('Runtime Error:', error.message);
                    }
                  })();
                </script>
              </body>
            </html>
          `;
          iframe.srcdoc = htmlContent;
        }
      } else if (activeLanguage === 'python') {
        if (!pyodideReady || !pyodide) {
          setConsoleLogs([{
            method: 'error',
            message: '🐍 Python runtime is loading. Please wait a moment and try again.',
            timestamp: new Date().toLocaleTimeString()
          }]);
          return;
        }

        try {
          const wrappedCode = `
import sys
from io import StringIO

old_stdout = sys.stdout
old_stderr = sys.stderr
captured_output = StringIO()
sys.stdout = captured_output
sys.stderr = captured_output

try:
${code.python.split('\n').map(line => '    ' + line).join('\n')}
except Exception as e:
    import traceback
    traceback.print_exc()

sys.stdout = old_stdout
sys.stderr = old_stderr
final_output = captured_output.getvalue()
final_output
`;
          
          const result = pyodide.runPython(wrappedCode);
          const output = result?.toString() || '';
          
          if (output.trim()) {
            output.split('\n').forEach(line => {
              if (line.trim()) {
                setConsoleLogs(prev => [...prev, {
                  method: 'log',
                  message: line,
                  timestamp: new Date().toLocaleTimeString()
                }]);
              }
            });
          } else {
            setConsoleLogs([{
              method: 'info',
              message: '✅ Code executed successfully (no output)',
              timestamp: new Date().toLocaleTimeString()
            }]);
          }
        } catch (error) {
          setConsoleLogs([{
            method: 'error',
            message: `❌ Python Error: ${error.toString()}`,
            timestamp: new Date().toLocaleTimeString()
          }]);
        }
      } else if (activeLanguage === 'c') {
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
              message: `❌ C Error: ${result.error}`,
              timestamp: new Date().toLocaleTimeString()
            }]);
          }
        } catch (error) {
          setConsoleLogs([{
            method: 'error',
            message: `❌ C Execution Error: ${error.message}`,
            timestamp: new Date().toLocaleTimeString()
          }]);
        }
      }
    } catch (error) {
      setConsoleLogs([{
        method: 'error',
        message: `❌ Execution error: ${error.message}`,
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

  // Group languages by category
  const groupedLanguages = Object.entries(languages).reduce((acc, [key, value]) => {
    if (!acc[value.category]) acc[value.category] = [];
    acc[value.category].push([key, value]);
    return acc;
  }, {});

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 84px)',
      marginTop: '12px',
      width: '100%',
      backgroundColor: themeStyles.background,
      color: themeStyles.foreground,
      fontFamily: '"Geist Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      overflow: 'hidden',
      borderRadius: '16px',
      boxShadow: '0 24px 64px rgba(0,0,0,0.15), 0 0 0 1px var(--border)',
      position: 'relative'
    },
    titleBar: {
      height: '52px',
      background: `linear-gradient(135deg, var(--card-bg), var(--background))`,
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      borderBottom: `1px solid var(--border)`,
      flexShrink: 0,
      backdropFilter: 'blur(20px)',
      borderTopLeftRadius: '16px',
      borderTopRightRadius: '16px',
      zIndex: 10
    },
    middleSection: {
      display: 'flex',
      flex: 1,
      overflow: 'hidden',
      minHeight: 0,
      position: 'relative'
    },
    windowControls: {
      display: 'flex',
      gap: '8px',
      marginRight: '24px'
    },
    windowControl: {
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      display: 'inline-block',
      transition: 'transform 0.2s ease',
      cursor: 'pointer'
    },
    activityBar: {
      width: '64px',
      background: `var(--card-bg)`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px 0',
      borderRight: `1px solid var(--border)`,
      flexShrink: 0,
      gap: '16px'
    },
    activityIcon: {
      width: '40px',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '22px',
      cursor: 'pointer',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      opacity: 0.6,
      borderRadius: '10px',
      position: 'relative'
    },
    mainContent: {
      display: 'flex',
      flex: 1,
      overflow: 'hidden',
      minWidth: 0
    },
    sidebar: {
      width: sidebarCollapsed ? '0px' : `${sidebarWidth}px`,
      backgroundColor: 'var(--background)',
      borderRight: `1px solid var(--border)`,
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      overflow: 'hidden',
      position: 'relative'
    },
    sidebarResizer: {
      width: '5px',
      backgroundColor: 'transparent',
      cursor: 'col-resize',
      position: 'absolute',
      right: '-2px',
      top: 0,
      bottom: 0,
      zIndex: 10,
      transition: 'background-color 0.2s ease'
    },
    sidebarHeader: {
      padding: '24px 16px 16px',
      fontSize: '12px',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '1.2px',
      color: themeStyles.muted,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    categoryHeader: {
      padding: '16px 20px 8px',
      fontSize: '11px',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '1px',
      color: themeStyles.muted,
      marginTop: '4px'
    },
    fileList: {
      flex: 1,
      overflowY: 'auto',
      padding: '4px 0'
    },
    editorContainer: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      minWidth: 0,
      backgroundColor: themeStyles.background
    },
    outputContainer: {
      width: `${outputWidth}%`,
      display: 'flex',
      flexDirection: 'column',
      borderLeft: `1px solid var(--border)`,
      backgroundColor: themeStyles.background,
      position: 'relative',
      boxShadow: '-4px 0 24px rgba(0,0,0,0.02)'
    },
    outputResizer: {
      width: '5px',
      backgroundColor: 'transparent',
      cursor: 'col-resize',
      position: 'absolute',
      left: '-2px',
      top: 0,
      bottom: 0,
      zIndex: 10,
      transition: 'background-color 0.2s ease'
    },
    consoleResizer: {
      height: '5px',
      backgroundColor: 'transparent',
      cursor: 'row-resize',
      position: 'absolute',
      top: '-2px',
      left: 0,
      right: 0,
      zIndex: 10,
      transition: 'background-color 0.2s ease'
    },
    outputHeader: {
      padding: '12px 24px',
      backgroundColor: 'var(--card-bg)',
      borderBottom: `1px solid var(--border)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '54px',
      flexShrink: 0
    },
    runButton: {
      padding: '8px 24px',
      background: `linear-gradient(135deg, var(--primary), var(--secondary))`,
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: 600,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '0 4px 12px rgba(var(--primary), 0.2)'
    },
    outputArea: {
      flex: 1,
      backgroundColor: themeStyles.background,
      overflow: 'auto',
      padding: '24px',
      fontFamily: '"Geist Mono", Consolas, Monaco, "Courier New", monospace',
      fontSize: '14px',
      lineHeight: '1.7'
    },
    consoleContainer: {
      height: `${consoleHeight}px`,
      backgroundColor: 'var(--card-bg)',
      borderTop: `1px solid var(--border)`,
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    },
    consoleHeader: {
      padding: '12px 24px',
      backgroundColor: 'var(--card-bg)',
      borderBottom: `1px solid var(--border)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '48px',
      flexShrink: 0
    },
    clearButton: {
      padding: '6px 14px',
      backgroundColor: 'transparent',
      color: themeStyles.foreground,
      border: `1px solid var(--border)`,
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    },
    consoleOutput: {
      flex: 1,
      overflowY: 'auto',
      padding: '16px 24px',
      fontFamily: '"Geist Mono", Consolas, Monaco, "Courier New", monospace',
      fontSize: '13px',
      lineHeight: '1.6',
      color: themeStyles.foreground
    },
    statusBar: {
      height: '36px',
      background: `linear-gradient(90deg, var(--primary), var(--secondary))`,
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      fontSize: '12px',
      flexShrink: 0,
      borderBottomLeftRadius: '16px',
      borderBottomRightRadius: '16px',
      fontWeight: 500,
      letterSpacing: '0.3px'
    },
    statusBarItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginRight: '24px',
      padding: '4px 10px',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'background 0.2s ease'
    }
  };

  const getFileItemStyle = (lang, color) => ({
    padding: '12px 20px',
    margin: '4px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    backgroundColor: activeLanguage === lang ? `var(--accent)` : 'transparent',
    color: activeLanguage === lang ? 'var(--foreground)' : themeStyles.foreground,
    borderRadius: '10px',
    borderLeft: activeLanguage === lang ? `4px solid ${color || themeStyles.accent}` : '4px solid transparent',
    position: 'relative'
  });

  // Removed authentication redirect for broader access

  if (!mounted || authLoading) {
    return (
      <div style={{
        height: 'calc(100vh - 93px)',
        marginTop: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${themeStyles.background}, ${themeStyles.card})`,
        borderRadius: '12px'
      }}>
        <div style={{ fontSize: '14px', color: themeStyles.muted }}>
          🚀 Loading CodeSpace...
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
          <div style={{...styles.windowControl, backgroundColor: '#ff5f56'}} 
               onClick={() => window.close?.()} />
          <div style={{...styles.windowControl, backgroundColor: '#ffbd2e'}} 
               onClick={() => window.location.reload()} />
          <div style={{...styles.windowControl, backgroundColor: '#27c93f'}} 
               onClick={() => console.log('Maximize')} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <span style={{ fontSize: '22px' }}>{languages[activeLanguage].icon}</span>
          <span style={{ fontSize: '14px', fontWeight: 600 }}>
            Code Collabe
          </span>
          <span style={{ 
            fontSize: '11px', 
            color: themeStyles.muted,
            background: `${themeStyles.accent}20`,
            padding: '4px 8px',
            borderRadius: '6px'
          }}>
            {languages[activeLanguage].name}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div 
            style={{ cursor: 'pointer', opacity: 0.7 }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = 0.7}
            onClick={() => setShowShortcuts(!showShortcuts)}
          >
            ⌨️
          </div>
          <div 
            style={{ cursor: 'pointer', opacity: 0.7 }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = 0.7}
          >
            ⚙️
          </div>
        </div>
      </div>

      {/* Middle Section */}
      <div style={styles.middleSection}>
        {/* Main Content */}
        <div style={styles.mainContent}>
          {/* Sidebar */}
          <div style={styles.sidebar}>
            {!sidebarCollapsed && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                >
                  <div style={styles.sidebarHeader}>
                    <span>EXPLORER</span>
                    <span style={{ cursor: 'pointer', fontSize: '16px' }}>⋯</span>
                  </div>
                  <div style={styles.fileList}>
                    {Object.entries(groupedLanguages).map(([category, langs]) => (
                      <div key={category}>
                        <div style={styles.categoryHeader}>{category}</div>
                        {langs.map(([lang, config]) => (
                          <motion.div 
                            key={lang}
                            style={getFileItemStyle(lang, config.color)}
                            onClick={() => setActiveLanguage(lang)}
                            whileHover={{ x: 4 }}
                            whileTap={{ scale: 0.98 }}
                            onMouseEnter={(e) => {
                              if (activeLanguage !== lang) {
                                e.currentTarget.style.backgroundColor = `${themeStyles.accent}10`;
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (activeLanguage !== lang) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }
                            }}
                          >
                            <span style={{ fontSize: '18px' }}>{config.icon}</span>
                            <span style={{ flex: 1 }}>playground{config.extension}</span>
                            {activeLanguage === lang && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                style={{ fontSize: '12px', opacity: 0.6 }}
                              >
                                ●
                              </motion.span>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
            <div 
              style={styles.sidebarResizer}
              onMouseDown={() => setIsDraggingSidebar(true)}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = themeStyles.accent}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            />
          </div>

          {/* Editor Area */}
          <div style={styles.editorContainer}>
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
                  fontSize: editorFontSize,
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
                  bracketPairColorization: { enabled: true },
                  renderLineHighlight: 'all',
                  selectionHighlight: true,
                  occurrencesHighlight: true,
                  codeLens: true,
                  quickSuggestions: true
                }}
              />
            </div>
          </div>

          {/* Output Panel */}
          <div style={styles.outputContainer} data-output-container>
            <div 
              style={styles.outputResizer}
              onMouseDown={() => setIsDraggingOutput(true)}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = themeStyles.accent}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            />
            
            <div style={styles.outputHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>
                  {showPreview ? 'Preview' : 'Output'}
                </span>
                {showPreview && (
                  <span style={{ 
                    fontSize: '10px', 
                    padding: '2px 8px', 
                    background: `${themeStyles.accent}20`,
                    borderRadius: '12px'
                  }}>
                    Live
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {executionTime && (
                  <span style={{ fontSize: '11px', fontFamily: 'monospace', color: themeStyles.muted }}>
                    ⚡ {executionTime}ms
                  </span>
                )}
                <motion.button 
                  style={styles.runButton}
                  onClick={runCode}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isRunning}
                >
                  <span>{isRunning ? '⏳' : '▶'}</span>
                  <span>{isRunning ? 'Running...' : 'Run Code'}</span>
                </motion.button>
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
                    color: themeStyles.foreground,
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word'
                  }}>
                    {output}
                  </pre>
                ) : (
                  <div style={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: themeStyles.muted,
                    gap: '12px'
                  }}>
                    <span style={{ fontSize: '48px', opacity: 0.3 }}>🚀</span>
                    <span style={{ fontStyle: 'italic' }}>Click Run to see output...</span>
                  </div>
                )}
              </div>
            )}

            {/* Console Output */}
            <div style={styles.consoleContainer}>
              <div 
                style={styles.consoleResizer}
                onMouseDown={() => setIsDraggingConsole(true)}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = themeStyles.accent}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              />
              
              <div style={styles.consoleHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>Console</span>
                  <span style={{ fontSize: '10px', color: themeStyles.muted }}>
                    {consoleLogs.length} entries
                  </span>
                </div>
                <motion.button 
                  style={styles.clearButton}
                  onClick={clearConsole}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Clear All
                </motion.button>
              </div>
              <div style={styles.consoleOutput}>
                {consoleLogs.length === 0 ? (
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: themeStyles.muted,
                    gap: '8px',
                    fontStyle: 'italic'
                  }}>
                    <span>💻</span>
                    <span>No console output yet</span>
                  </div>
                ) : (
                  consoleLogs.map((log, index) => (
                    <motion.div 
                      key={index} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      style={{ 
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '4px 0',
                        borderBottom: index !== consoleLogs.length - 1 ? `1px solid ${themeStyles.border}30` : 'none'
                      }}
                    >
                      <span style={{ 
                        color: themeStyles.muted,
                        fontSize: '10px',
                        fontFamily: 'monospace',
                        minWidth: '70px'
                      }}>
                        {log.timestamp}
                      </span>
                      <span style={{ 
                        color: log.method === 'error' ? '#EF4444' : 
                               log.method === 'warn' ? '#F59E0B' : 
                               log.method === 'info' ? '#3B82F6' :
                               themeStyles.foreground,
                        flex: 1,
                        fontFamily: 'monospace',
                        fontSize: '12px'
                      }}>
                        {log.method === 'error' && '❌ '}
                        {log.method === 'warn' && '⚠️ '}
                        {log.method === 'info' && 'ℹ️ '}
                        {log.message}
                      </span>
                    </motion.div>
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
          <span style={{ fontWeight: 500 }}>{languages[activeLanguage].name}</span>
        </div>
        <div style={styles.statusBarItem}>
          <span>{isRunning ? '⏳' : '✅'}</span>
          <span>{isRunning ? 'Running' : 'Ready'}</span>
        </div>
        <div style={styles.statusBarItem}>
          <span>🔒</span>
          <span>Secure</span>
        </div>
        <div style={{...styles.statusBarItem, marginLeft: 'auto'}}>
          <span onClick={() => setEditorFontSize(prev => Math.max(10, prev - 1))} style={{ cursor: 'pointer' }}>A-</span>
          <span style={{ margin: '0 4px' }}>{editorFontSize}</span>
          <span onClick={() => setEditorFontSize(prev => Math.min(20, prev + 1))} style={{ cursor: 'pointer' }}>A+</span>
        </div>
        <div style={styles.statusBarItem}>
          <span>UTF-8</span>
        </div>
      </div>

      {/* Keyboard Shortcuts Modal */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}
            onClick={() => setShowShortcuts(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                background: themeStyles.card,
                borderRadius: '12px',
                padding: '24px',
                maxWidth: '500px',
                width: '90%',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
              }}
              onClick={e => e.stopPropagation()}
            >
              <h3 style={{ marginBottom: '20px' }}>⌨️ Keyboard Shortcuts</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div><strong>Ctrl/Cmd + S</strong> - Save code</div>
                <div><strong>Ctrl/Cmd + R</strong> - Run code</div>
                <div><strong>Ctrl/Cmd + /</strong> - Toggle comment</div>
                <div><strong>Ctrl/Cmd + F</strong> - Search</div>
                <div><strong>Ctrl/Cmd + H</strong> - Replace</div>
                <div><strong>Alt + ↑/↓</strong> - Move line up/down</div>
                <div><strong>Ctrl/Cmd + D</strong> - Add selection to next match</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CodeSpace() {
  return (
    <ProtectedRoute>
      <CodeSpaceContent />
    </ProtectedRoute>
  );
}