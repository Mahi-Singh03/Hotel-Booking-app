// app/api/execute/route.js
import { exec } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import { randomUUID } from 'crypto';
import { join } from 'path';
import { tmpdir } from 'os';

export async function POST(request) {
  try {
    const { language, code } = await request.json();
    
    // Handle C code via Wandbox API (free, no credentials required)
    if (language === 'c') {
      try {
        console.log('Executing C code via Wandbox API...');

        const compilers = ['gcc-11.4.0-c', 'gcc-10.5.0-c', 'clang-17.0.1-c'];
        let lastFailure = null;

        for (const compiler of compilers) {
          const response = await fetch('https://wandbox.org/api/compile.json', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              code,
              compiler,
              options: 'warning,optimize',
              'compiler-option-raw': '-std=c11',
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            lastFailure = `Wandbox API error (${response.status}) with ${compiler}: ${errorText}`;
            continue;
          }

          const result = await response.json();
          console.log('Wandbox result:', JSON.stringify(result, null, 2));

          const compilerError = result.compiler_error || '';
          const programError = result.program_error || '';
          const programOutput = result.program_output || '';

          // Treat warnings as non-fatal if program output exists.
          const hasFatalCompileError = compilerError.trim().length > 0 && !programOutput;

          if (hasFatalCompileError) {
            return Response.json({ output: '', error: `Compilation Error:\n${compilerError}` });
          }

          if (programError.trim().length > 0) {
            return Response.json({ output: '', error: `Runtime Error:\n${programError}` });
          }

          return Response.json({ output: programOutput, error: null });
        }

        throw new Error(lastFailure || 'All Wandbox compilers failed');
      } catch (error) {
        console.error('C execution error:', error);
        return Response.json({ 
          output: '', 
          error: `C Execution Error: ${error.message}` 
        }, { status: 500 });
      }
    }
    
    // Handle local execution (Python, etc.)
    const fileId = randomUUID();
    const tempDir = tmpdir();
    
    let fileName, command;
    
    switch (language) {
      case 'python':
        fileName = join(tempDir, `${fileId}.py`);
        command = `python "${fileName}"`;
        break;
        
      default:
        return Response.json({ error: 'Unsupported language' }, { status: 400 });
    }
    
    // Write code to temporary file
    await writeFile(fileName, code);
    
    // Execute the code
    const result = await new Promise((resolve) => {
      exec(command, { timeout: 5000 }, (error, stdout, stderr) => {
        // Clean up temporary files
        unlink(fileName).catch(err => {
          if (err.code !== 'ENOENT') console.error(err);
        });
        
        if (error) {
          resolve({
            output: stdout,
            error: stderr || error.message
          });
        } else {
          resolve({
            output: stdout,
            error: stderr || null
          });
        }
      });
    });
    
    return Response.json(result);
    
  } catch (error) {
    return Response.json({ 
      error: 'Execution failed: ' + error.message 
    }, { status: 500 });
  }
}