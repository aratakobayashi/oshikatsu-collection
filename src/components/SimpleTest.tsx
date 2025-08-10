export default function SimpleTest() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>🔍 接続テスト</h1>
      <div style={{ backgroundColor: '#f5f5f5', padding: '15px', marginBottom: '20px' }}>
        <h3>📊 環境情報</h3>
        <p><strong>現在のURL:</strong> {window.location.href}</p>
        <p><strong>VITE_SUPABASE_URL:</strong> {import.meta.env.VITE_SUPABASE_URL || '未設定'}</p>
        <p><strong>VITE_SUPABASE_ANON_KEY:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY ? '設定済み' : '未設定'}</p>
      </div>
      <p>サイトが正常に表示されています ✅</p>
    </div>
  )
}