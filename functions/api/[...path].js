// functions/api/[...path].js

export async function onRequest(context) {
    // 获取原始请求的路径
    const url = new URL(context.request.url);
    const targetPath = url.pathname.replace('/api/', '');
    
    // 构建目标 API URL
    const targetUrl = `https://todo.knowivf.ac.cn/${targetPath}`;
    
    try {
      // 复制原始请求的方法和内容
      const requestInit = {
        method: context.request.method,
        headers: {
          'Content-Type': 'application/json',
        }
      };
  
      // 如果是 POST 或 PUT 请求，需要转发请求体
      if (['POST', 'PUT'].includes(context.request.method)) {
        requestInit.body = await context.request.text();
      }
  
      // 发起请求到目标 API
      const response = await fetch(targetUrl, requestInit);
      
      // 获取响应内容
      const data = await response.text();
  
      // 返回响应给客户端
      return new Response(data, {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          // 允许跨域访问
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error) {
      // 错误处理
      return new Response(JSON.stringify({ error: '请求失败' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  }
  
  // 处理 OPTIONS 请求，支持 CORS
  export function onRequestOptions() {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }