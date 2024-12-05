import { exec } from 'node:child_process';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 检查端口是否被占用
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.listen(port, '127.0.0.1')
      .on('error', () => resolve(true))
      .on('listening', () => {
        server.close();
        resolve(false);
      });
  });
}

// 查找可用端口
async function findAvailablePort(startPort) {
  let port = startPort;
  while (await isPortInUse(port)) {
    port++;
  }
  return port;
}

async function startServer() {
  try {
    // 找到可用端口
    const port = await findAvailablePort(8788);
    console.log(`Server starting on port: ${port}`);

    // 修改命令，减少日志输出
    const command = `wrangler pages dev build --port ${port} --persist-to .wrangler/state --log-level error`;
    
    const childProcess = exec(command, {
      env: {
        ...process.env,
        NO_D1_WARNING: 'true',
        WRANGLER_LOG: 'error'  // 只显示错误日志
      }
    });

    // 只输出重要信息
    childProcess.stdout.on('data', (data) => {
      const message = data.toString().trim();
      // 只输出特定的重要信息
      if (
        message.includes('Ready') || 
        message.includes('Error') || 
        message.includes('Failed') ||
        message.includes('Successfully')
      ) {
        console.log(message);
      }
    });

    childProcess.stderr.on('data', (data) => {
      console.error(data.toString().trim());
    });

    childProcess.on('error', (error) => {
      console.error('Error:', error.message);
    });

    childProcess.on('exit', (code) => {
      if (code !== 0) {
        console.error(`Server exited with code ${code}`);
      }
    });

    // 处理进程终止信号
    process.on('SIGINT', () => {
      console.log('\nGracefully shutting down...');
      childProcess.kill();
      process.exit(0);
    });

  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

console.log('Starting development server...');
startServer();