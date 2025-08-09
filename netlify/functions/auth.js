/**
 * Netlify Functions - Basic認証
 * staging/preview環境でのみ動作
 */

exports.handler = async (event, context) => {
  // 環境変数から設定を取得
  const appEnv = process.env.APP_ENV || process.env.VITE_ENVIRONMENT
  const basicAuth = process.env.BASIC_AUTH
  
  console.log('Basic Auth Function:', { appEnv, hasAuth: !!basicAuth })
  
  // production環境では認証不要
  if (appEnv === 'production') {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: 'Production environment - no auth required' })
    }
  }
  
  // staging/preview環境でBASIC_AUTHが設定されていない場合は認証不要
  if (!basicAuth) {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: 'No basic auth configured' })
    }
  }
  
  // Authorization ヘッダーをチェック
  const authHeader = event.headers.authorization || event.headers.Authorization
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return {
      statusCode: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Staging Area"',
        'Content-Type': 'text/html',
      },
      body: `
        <!DOCTYPE html>
        <html>
        <head>
          <title>認証が必要です</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0;
              color: white;
            }
            .container {
              text-align: center;
              background: rgba(255, 255, 255, 0.1);
              backdrop-filter: blur(10px);
              padding: 2rem;
              border-radius: 1rem;
              border: 1px solid rgba(255, 255, 255, 0.2);
            }
            h1 { margin-bottom: 1rem; }
            p { opacity: 0.9; }
            .env-badge {
              display: inline-block;
              background: rgba(255, 255, 255, 0.2);
              padding: 0.5rem 1rem;
              border-radius: 2rem;
              font-size: 0.875rem;
              margin-top: 1rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🔐 認証が必要です</h1>
            <p>この環境にアクセスするには認証が必要です。</p>
            <div class="env-badge">環境: ${appEnv.toUpperCase()}</div>
          </div>
        </body>
        </html>
      `
    }
  }
  
  // Base64デコードして認証情報を取得
  const base64Credentials = authHeader.split(' ')[1]
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii')
  
  // 環境変数の認証情報と照合
  if (credentials === basicAuth) {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message: 'Authentication successful',
        environment: appEnv 
      })
    }
  }
  
  // 認証失敗
  return {
    statusCode: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Staging Area"',
      'Content-Type': 'text/html',
    },
    body: `
      <!DOCTYPE html>
      <html>
      <head>
        <title>認証失敗</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0;
            color: white;
          }
          .container {
            text-align: center;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            padding: 2rem;
            border-radius: 1rem;
            border: 1px solid rgba(255, 255, 255, 0.2);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>❌ 認証失敗</h1>
          <p>ユーザー名またはパスワードが正しくありません。</p>
        </div>
      </body>
      </html>
    `
  }
}