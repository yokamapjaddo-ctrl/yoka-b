// YOKA Web版 設定ファイル
// Supabase の「Project URL」と「anon public key」を入力してください。
// anon key はブラウザに公開される前提のキーです（RLSでデータを保護します）。
// service_role key は絶対にここへ書かないでください。
window.YOKA_CONFIG = {
  supabaseUrl: '',      // 例: 'https://xxxxxxxx.supabase.co'
  supabaseAnonKey: '',  // 例: 'eyJhbGciOi...'
  // メール認証・パスワード再設定後に戻るURL（空なら現在のページ）
  siteUrl: ''
};
