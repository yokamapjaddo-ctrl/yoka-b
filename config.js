// YOKA Web版 設定ファイル
// Supabase の「Project URL」と「anon public key」を入力してください。
// anon key はブラウザに公開される前提のキーです（RLSでデータを保護します）。
// service_role key は絶対にここへ書かないでください。
window.YOKA_CONFIG = {
  supabaseUrl: 'https://fysntpzmlrtqeykdecjq.supabase.co',      // 例: 'https://xxxxxxxx.supabase.co'
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5c250cHptbHJ0cWV5a2RlY2pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI5MDM4ODYsImV4cCI6MjEwODQ3OTg4Nn0.XIal_ctuj-FaOLPj8KC1HUuqx8GTOKLMJhDo7tLYEGg',  // 例: 'eyJhbGciOi...'
  // メール認証・パスワード再設定後に戻るURL（空なら現在のページ）
  siteUrl: ''
};
