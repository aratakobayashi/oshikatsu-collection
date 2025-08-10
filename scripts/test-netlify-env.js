// Netlify環境変数確認用テストファイル
// これをNetlifyにデプロイして環境変数を確認できます

console.log('🔍 Netlify環境変数テスト');
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ 設定済み' : '❌ 未設定');
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ 設定済み' : '❌ 未設定');
console.log('VITE_ENVIRONMENT:', import.meta.env.VITE_ENVIRONMENT || 'なし');

// ページに表示
document.body.innerHTML = `
<div style="padding: 20px; font-family: monospace;">
  <h1>🔍 Netlify環境変数テスト</h1>
  <p><strong>VITE_SUPABASE_URL:</strong> ${import.meta.env.VITE_SUPABASE_URL ? '✅ 設定済み' : '❌ 未設定'}</p>
  <p><strong>VITE_SUPABASE_ANON_KEY:</strong> ${import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ 設定済み (...' + (import.meta.env.VITE_SUPABASE_ANON_KEY || '').slice(-20) + ')' : '❌ 未設定'}</p>
  <p><strong>VITE_ENVIRONMENT:</strong> ${import.meta.env.VITE_ENVIRONMENT || 'なし'}</p>
  <p><strong>現在のURL:</strong> ${window.location.href}</p>
</div>
`;