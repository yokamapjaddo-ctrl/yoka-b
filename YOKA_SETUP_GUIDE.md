# YOKA_SETUP_GUIDE.md — 環境設定と公開手順

## 1. 必要な外部サービス
| サービス | 必須 | 費用 | 設定 |
| --- | --- | --- | --- |
| GitHub Pages | ○ | 無料 | main / root |
| Supabase | 認証・カレンダー・問い合わせに必要 | 無料枠あり | 下記 |
| Resend | 問い合わせのメール通知に必要 | 無料枠 月3,000通 | 下記 |
| 国土地理院・気象庁・Overpass | ○ | 無料（キー不要） | 設定不要 |

## 2. Supabase 設定
1. https://supabase.com でプロジェクト作成（リージョンは Tokyo 推奨）
2. **SQL Editor** で `supabase/migrations/001_init.sql` の中身を貼り付けて Run（既存テーブルは削除しません）
3. **Authentication → Providers → Email** を有効、「Confirm email」をON
4. **Authentication → URL Configuration**
   - Site URL: `https://yokamapjaddo-ctrl.github.io/yoka-app-prototype/`
   - Redirect URLs に同じURLを追加
5. **Project Settings → API** の `Project URL` と `anon public` キーを `config.js` に記入
   - `service_role` キーは**絶対に**記入・公開しないこと
6. （推奨）Authentication → Emails でメール文面を日本語化、SMTP を独自ドメインに設定（無料枠のメール送信数は少ない）

### 環境変数（config.js）一覧
| キー | 内容 | 公開可否 |
| --- | --- | --- |
| `supabaseUrl` | Project URL | 公開可 |
| `supabaseAnonKey` | anon public key（RLSで保護） | 公開可 |
| `siteUrl` | メール内リンクの戻り先（空なら現在URL） | 公開可 |

### 問い合わせのメール通知（Supabase Edge Function + Resend）
問い合わせは `partner_inquiries` に保存され、同時に運営者へメールが届きます。メールに「返信」すると問い合わせ者に直接返信できます。

1. **Resend** に登録（https://resend.com ・無料枠 月3,000通）→ API Keys でキーを作成
   - 独自ドメインから送る場合は Domains でドメイン認証。未認証の間は Resend に登録した自分のアドレス宛てにのみ送信できます
2. Supabase **Edge Functions → Deploy a new function → Via Editor**
   - 名前：`notify-inquiry`
   - 中身：`supabase/functions/notify-inquiry/index.ts` を貼り付けて Deploy
   - 関数の設定で **Verify JWT を OFF**（代わりに WEBHOOK_SECRET で保護）
3. **Edge Functions → Secrets** に追加

| 名前 | 値 |
| --- | --- |
| `RESEND_API_KEY` | Resend の API キー |
| `NOTIFY_TO` | 受け取るメールアドレス（複数はカンマ区切り） |
| `NOTIFY_FROM` | 例 `YOKA <noreply@独自ドメイン>`（未設定なら Resend のテスト用） |
| `WEBHOOK_SECRET` | 自分で決めた長いランダム文字列 |

4. **Database → Webhooks → Create a new hook**
   - Table：`partner_inquiries`　Events：**Insert** のみ
   - Type：**Supabase Edge Functions** → `notify-inquiry`　Method：POST
   - HTTP Headers に `x-webhook-secret`：（WEBHOOK_SECRET と同じ値）を追加
5. アプリからテスト送信 → メールが届くか確認。届かない場合は Edge Functions → notify-inquiry → Logs

RESEND_API_KEY と WEBHOOK_SECRET は Supabase 内にだけ保存し、`config.js` や GitHub には書かないでください。

### municipalities テーブル（任意）
アプリは国土地理院の表を直接読むため不要です。将来サーバー側で使う場合は、`https://maps.gsi.go.jp/js/muni.js` を取得し、各行 `'都道府県コード,都道府県名,市区町村コード,市区町村名'` を5桁0埋めで INSERT してください。

## 3. GitHub への反映
1. リポジトリの **Add file → Upload files** を開く
2. 次をフォルダ構成ごとドラッグ＆ドロップ：`index.html` `config.js` `js/`（4ファイル） `supabase/` `archive/` 各 `YOKA_*.md`
3. Commit → 1〜2分で公開URLに反映
4. 公開前の確認は下記チェックリスト

## 4. 公開前チェックリスト
- [ ] スマホ（iPhone Safari / Android Chrome）で全画面表示・下部タブが隠れない
- [ ] 地域選択 → 天気・地図・ハザードが選んだ地域に変わる
- [ ] 新規登録 → 確認メール → ログイン → 予定の追加・編集・削除
- [ ] パスワード再設定メールから新パスワード設定
- [ ] アカウント削除後に再ログインできない
- [ ] 問い合わせ送信 → Supabase の `partner_inquiries` に保存、anon から読めない
- [ ] 問い合わせ送信 → NOTIFY_TO に通知メールが届き、返信先が問い合わせ者になっている
- [ ] サンプル・デモ表示がすべての該当画面にある
- [ ] ハザードの出典・注意文・公式リンク
- [ ] 規約・ポリシーの法務確認（「案」表記を外す）
- [ ] 天気が気象庁サイトの表示と一致するか、数地域で確認
