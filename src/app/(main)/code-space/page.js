"use client";
import { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';

export default function CodeSpace() {
  const [html, setHtml] = useState('<h1>Hello, world!</h1>');
  const [css, setCss] = useState('h1 { color: blue; }');
  const [js, setJs] = useState('console.log("Hello from JS!");');
  const [activeTab, setActiveTab] = useState('html');
  const [consoleLogs, setConsoleLogs] = useState([]);
  const iframeRef = useRef(null);

  const handleEditorChange = (value, language) => {
    if (language === 'html') {
      setHtml(value);
    } else if (language === 'css') {
      setCss(value);
    } else if (language === 'javascript') {
      setJs(value);
    }
  };

  const runCode = () => {
    const iframe = iframeRef.current;
    if (iframe) {
      const logs = [];
      
      const htmlContent = `
        <html>
          <head>
            <style>${css}</style>
          </head>
          <body>
            ${html}
            <script>
              // Capture console output
              window.parent.postMessage({ type: 'console', method: 'log', message: 'Code executed' }, '*');
              
              const originalLog = console.log;
              const originalError = console.error;
              const originalWarn = console.warn;
              
              console.log = function(...args) {
                window.parent.postMessage({ type: 'console', method: 'log', message: args.join(' ') }, '*');
              };
              
              console.error = function(...args) {
                window.parent.postMessage({ type: 'console', method: 'error', message: args.join(' ') }, '*');
              };
              
              console.warn = function(...args) {
                window.parent.postMessage({ type: 'console', method: 'warn', message: args.join(' ') }, '*');
              };
              
              ${js}
            </script>
          </body>
        </html>
      `;
      iframe.srcdoc = htmlContent;
    }
  };

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'console') {
        setConsoleLogs((prev) => [...prev, { method: event.data.method, message: event.data.message }]);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleRunCode = () => {
    setConsoleLogs([]);
    runCode();
  };

  const getEditorValue = () => {
    if (activeTab === 'html') return html;
    if (activeTab === 'css') return css;
    if (activeTab === 'javascript') return js;
  };

  return (
    <div style={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
        <div style={{ padding: '1rem', backgroundColor: '#1e1e1e', color: 'white' }}>
            <h1>Code Space</h1>
            <p>Your in-browser VS Code experience.</p>
        </div>
        <div style={{ display: 'flex', flex: 1 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', backgroundColor: '#252526' }}>
                    <button onClick={() => setActiveTab('html')} style={{ padding: '0.5rem', color: activeTab === 'html' ? 'white' : '#888', background: activeTab === 'html' ? '#1e1e1e' : 'transparent', border: 'none', cursor: 'pointer' }}>
                        HTML
                    </button>
                    <button onClick={() => setActiveTab('css')} style={{ padding: '0.5rem', color: activeTab === 'css' ? 'white' : '#888', background: activeTab === 'css' ? '#1e1e1e' : 'transparent', border: 'none', cursor: 'pointer' }}>
                        CSS
                    </button>
                    <button onClick={() => setActiveTab('javascript')} style={{ padding: '0.5rem', color: activeTab === 'javascript' ? 'white' : '#888', background: activeTab === 'javascript' ? '#1e1e1e' : 'transparent', border: 'none', cursor: 'pointer' }}>
                        JavaScript
                    </button>
                    <button onClick={handleRunCode} style={{ padding: '0.5rem', color: 'white', background: '#0e639c', border: 'none', cursor: 'pointer', marginLeft: 'auto' }}>
                        Run Code
                    </button>
                </div>
                <Editor
                    height="100%"
                    language={activeTab}
                    theme="vs-dark"
                    value={getEditorValue()}
                    onChange={(value) => handleEditorChange(value, activeTab)}
                    options={{
                        automaticLayout: true,
                        minimap: { enabled: false },
                        wordWrap: 'on',
                    }}
                />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderLeft: '1px solid #333' }}>
                <div style={{ flex: 1, borderBottom: '1px solid #333', overflow: 'auto' }}>
                    <iframe
                        ref={iframeRef}
                        title="output"
                        style={{ width: '100%', height: '100%', border: 'none', backgroundColor: 'white' }}
                        sandbox="allow-scripts"
                    />
                </div>
                <div style={{ flex: 0.4, backgroundColor: '#1e1e1e', color: '#d4d4d4', overflow: 'auto', padding: '0.5rem', fontFamily: 'monospace', fontSize: '12px', borderTop: '1px solid #333' }}>
                    <div style={{ marginBottom: '0.5rem', color: '#888' }}>Console Output:</div>
                    {consoleLogs.length === 0 ? (
                        <div style={{ color: '#888' }}>No output yet...</div>
                    ) : (
                        consoleLogs.map((log, index) => (
                            <div key={index} style={{ color: log.method === 'error' ? '#f48771' : log.method === 'warn' ? '#ce9178' : '#d4d4d4', marginBottom: '0.25rem' }}>
                                {log.message}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    </div>
  );
}