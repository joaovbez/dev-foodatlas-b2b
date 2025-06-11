import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

interface ProcessResult {
  error?: string;
  [key: string]: any;
}

<<<<<<< HEAD
=======
/**
 * Salva o conteúdo do arquivo em um arquivo temporário.
 */
>>>>>>> c4ab1e42fce547a2b9eff6931444865f90d205e5
function saveTempFile(fileContent: Buffer | string, originalFilename: string = 'tempfile'): Promise<string> {
  return new Promise((resolve, reject) => {
    const ext = path.extname(originalFilename) || '.tmp';
    const tempFilePath = path.join(os.tmpdir(), `temp-${Date.now()}${ext}`);
    
    fs.writeFile(tempFilePath, fileContent, (err) => {
      if (err) {
        return reject(err);
      }
      resolve(tempFilePath);
    });
  });
}

<<<<<<< HEAD
=======
/**
 * Invoca o script Python passando o caminho do arquivo temporário.
 */
>>>>>>> c4ab1e42fce547a2b9eff6931444865f90d205e5
function runPythonScript(filePath: string): Promise<ProcessResult> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(__dirname, 'processFile.py'); // Certifique-se de que esse caminho está correto
    const pythonProcess = spawn('python', [scriptPath, filePath]);

    let stdoutData = '';
    let stderrData = '';

    pythonProcess.stdout.on('data', (data: Buffer) => {
      stdoutData += data.toString();
    });

    pythonProcess.stderr.on('data', (data: Buffer) => {
      stderrData += data.toString();
    });

    pythonProcess.on('close', (code: number) => {
      // Remove o arquivo temporário após o processamento
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error(`Erro ao remover arquivo temporário: ${unlinkErr}`);
        }
      });
      
      if (code !== 0) {
        return reject(new Error(`O script Python finalizou com o código ${code}: ${stderrData}`));
      }
      try {
        const result = JSON.parse(stdoutData);
        resolve(result);
      } catch (err) {
        reject(new Error(`Erro ao converter a saída JSON: ${err}`));
      }
    });
  });
}

<<<<<<< HEAD

=======
/**
 * Função que integra o fluxo:
 * - Recebe o conteúdo do arquivo (como variável)
 * - Salva temporariamente
 * - Invoca o Python para processar
 * - Retorna o resultado (JSON)
 */
>>>>>>> c4ab1e42fce547a2b9eff6931444865f90d205e5
export async function processFile(fileContent: Buffer | string, originalFilename: string): Promise<ProcessResult> {
  try {
    const tempFilePath = await saveTempFile(fileContent, originalFilename);
    const result = await runPythonScript(tempFilePath);
    return result;
  } catch (error) {
    throw new Error(`Erro no processamento com Python: ${error}`);
  }
}
