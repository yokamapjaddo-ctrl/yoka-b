# YOKA β版 店舗情報管理 — 調査結果と実装計画

作成日: 2026-10-25 ／ この段階ではコード・データベースを変更していません。

---

## 1. 調査結果

### 1-1. フレームワーク・ライブラリ
| 用途 | 内容 |
| --- | --- |
| UI | React 18.3.1（CDN, UMD） |
| JSX変換 | @babel/standalone（ブラウザ内変換。ビルド工程なし） |
| 地図 | Leaflet 1.9.4 ＋ 国土地理院タイル（淡色地図） |
| DB・認証 | supabase-js 2.45.4（CDN）※接続先は未設定 |
| 住所→緯度経度 | 国土地理院 住所検索API |
| フォント | Noto Sans JP / Material Symbols Rounded |

### 1-2. ディレクトリ構成（このプロジェクト内）
```
index.html                 エントリ（CDN読込）
config.js                  Supabase URL / anon key（空欄）
js/services.js             API・Supabase呼び出しを集約
js/ui.jsx                  共通UI部品
js/app.jsx                 住民向け全画面
js/disaster.jsx            災害モード（デモ）
supabase/migrations/001_init.sql
supabase/functions/notify-inquiry/index.ts
archive/prototype-2026-08.html   旧版
YOKA_*.md                  各種資料
```

### 1-3. ページ遷移・ルーティング
ハッシュ方式（`#/home` `#/map?view=shops` `#/hazard` など）。GitHub Pages でリロードしても404にならない。店舗の詳細ページ用のルートはまだない。

### 1-4. 既存の店舗関連UI
| 場所 | 現状 |
| --- | --- |
| チラシ・マップ → お店マップ | `SHOP_SAMPLES`（4件）をコードに直書き。位置は地域の中心から仮の位置にずらしているだけ。タップで小さな詳細カードを表示 |
| チラシ・マップ → チラシ | `FLYER_SAMPLES`（2件）直書き |
| ホーム → まち情報 | `MACHI_SAMPLES`（2件）直書き |
| 災害モード | 支援店舗の一覧・詳細・募金。すべてデモデータで、平常時の店舗とはつながっていない |

店舗詳細ページ・営業時間・住所・写真・経路案内ボタンはない（地域マップの公共施設カードにだけ Google マップの道順リンクがある）。

### 1-5. Supabase 接続状況
- `config.js` が空欄のため**未接続**。プロジェクトもまだ作られていない前提。
- `001_init.sql` は作成済みだが、未実行。中には `local_content`（店舗投稿を想定したテーブル）を含むが、店舗そのものを管理するテーブルはない。
- 管理者という概念はない（`partner_inquiries` は Dashboard でしか見られない作り）。

### 1-6. データ管理
店舗・チラシ・まち情報はすべてコード内の固定サンプル。地域設定はブラウザ保存（ログイン時は profiles に保存する作り）。

### 1-7. GitHub の保存状況（重要）
`yokamapjaddo-ctrl/yoka-app-prototype` の main には、**旧版の `index.html`（単一ファイル）と README しかありません**。ver.0.1 以降の変更（ファイル分割・天気・地図・広告枠・お店マップなど）はまだアップロードされていません。

---

## 2. 現状の問題点
1. GitHub と手元の最新版がずれている → 今回の作業の前に ver.0.1 をアップロードし、そこを復元地点にするのが安全。
2. Supabase が未作成・未接続 → 店舗管理はすべて Supabase 前提なので、最初に用意が必要。
3. 店舗データがコード直書き → 住民画面を「Supabaseから取得」に置き換える必要がある。
4. 店舗詳細ページがない → 新規作成が必要。
5. 管理者の仕組みがない → 新規設計が必要。
6. `001_init.sql` の `local_content.shop_name` は店舗名を文字列で持っている → 将来は `store_id` 参照に変える（今回は追加のみで既存定義は壊さない）。

---

## 3. 設計案

### 3-1. 管理者権限の仕組み（最小構成）
- `admins` テーブルに管理者の **ユーザーID** だけを登録する。
- このテーブルは一般ユーザーから読み書き不可。追加・削除は Supabase Dashboard の SQL Editor（運営者）だけで行う。
- `public.is_admin()` 関数（security definer）で「ログイン中の人が admins にいるか」を判定し、RLS から呼ぶ。
- 画面側の「管理者だけ表示」は見た目だけの補助で、**実際の可否はすべてデータベース側（RLS）が判断する**。
- 管理者のメールアドレスはフロントエンドに書かない。

```
admins
  user_id     uuid  PK → auth.users
  note        text  （誰か分かるメモ）
  created_at  timestamptz
```

### 3-2. テーブル
```
stores
  id               uuid PK
  name             text  必須
  description      text
  address          text  必須
  prefecture       text  必須
  municipality     text  必須
  muni_code        text  5桁の自治体コード（地域での絞り込み用）
  latitude         double precision 必須
  longitude        double precision 必須
  regular_holiday  text  定休日の表記（例「毎週水曜・第3火曜」）
  hours_note       text  補足（例「祝日は営業」「L.O.は閉店30分前」）
  image_path       text  Storage 内のパス（任意）
  is_published     boolean  既定 false
  verified_at      date  情報の最終確認日
  archived_at      timestamptz  削除の代わり（入っていれば一覧から外す）
  created_by / updated_by  uuid
  created_at / updated_at  timestamptz

store_hours（曜日別営業時間）
  id          uuid PK
  store_id    uuid → stores（cascade）
  weekday     smallint 0=日 〜 6=土、7=祝日
  opens_at    time
  closes_at   time   ※深夜営業は翌日扱いで closes_at < opens_at を許可
  sort        smallint  同じ曜日に複数の時間帯（昼・夜）を持てる
```
- 曜日にレコードがない＝その曜日は休み。定休日の文言は `regular_holiday` に表示用として別に持つ。
- 営業時間を別テーブルにした理由：昼・夜の二部営業に対応しやすく、将来の「今営業中」絞り込みがSQLでできるため。

将来の拡張（今回は作らない）：`store_members`（店舗アカウント）、`store_posts`、`post_hearts`、`post_saves`、`ad_placements`、`store_stats`。すべて `store_id` を軸にぶら下げる。

### 3-3. RLS
| テーブル | 一般（未ログイン・一般会員） | 管理者 |
| --- | --- | --- |
| stores | `is_published = true かつ archived_at is null` の行だけ読める | 全件読める・追加・更新できる |
| store_hours | 親の店舗が公開中の行だけ読める | 全件読める・追加・更新・削除できる |
| admins | 不可 | 不可（Dashboard のみ） |

- `stores` には **DELETE ポリシーを作らない** → 画面からもAPIからも完全削除できない。削除は「非公開＋アーカイブ」で運用。完全削除が必要な場合は運営者が SQL で実行する。
- 更新のたびに `updated_at` と `updated_by` を自動記録する。

### 3-4. 店舗写真（Supabase Storage）
- バケット `store-images`：**容量上限 3MB、形式は JPEG / PNG / WebP のみ**（バケット設定でサーバー側でも制限）。
- 書き込み・削除は `is_admin()` の人だけ。
- 読み取りは公開バケットを提案。理由：住民画面で署名付きURLの発行が不要になり、構成が単純になる。
  - 注意点：非公開店舗の写真も、パスを知っていれば見られる。パスは推測しにくいランダム文字列にする。気になる場合は非公開バケット＋署名URLに変更可能（少し複雑になります）。
- アップロード前にブラウザ側で長辺1600pxに縮小して容量を抑える。

### 3-5. キーの扱い
| キー | 置き場所 | 公開 |
| --- | --- | --- |
| Project URL / anon（publishable）key | `config.js` | 可（RLSで保護） |
| service_role（secret）key | 使わない。必要な場合も Supabase の Edge Function の Secrets のみ | **不可** |

今回の管理画面は「管理者としてログインした anon キー＋RLS」で動くため、秘密鍵は一切使いません。

---

## 4. 画面設計

### 4-1. 住民向け（既存デザインのまま）
- **お店マップ**（チラシ・マップ → お店マップ）：`SHOP_SAMPLES` の代わりに Supabase の公開店舗を表示。選んだ地域の店舗を表示し、ピンをタップすると今の詳細カードと同じ見た目で出し、「詳しく見る」で詳細ページへ。
- **店舗詳細ページ（新規）** `#/store?id=…`
  - 写真（なければ表示しない）、店舗名、紹介文、住所、地図（小）、曜日別営業時間（今日の行を強調）、定休日、補足、「情報の最終確認日」
  - **「ここへ行く」ボタン**：`https://www.google.com/maps/dir/?api=1&destination=緯度,経度` を開く。出発地を指定しないので、現在地を許可していなくても目的地が開き、出発地はGoogleマップ側で選べる。iPhone では「Appleマップで開く」も併記を提案。
- Supabase が未設定・取得失敗のときは「店舗情報を読み込めませんでした」と表示し、サンプルは出さない。β版で店舗が0件のときは「掲載店舗はまだありません」と掲載募集の導線を出す。

### 4-2. 運営者用管理画面（新規）
- 別ファイル `admin.html`（住民画面からはリンクしない。URLを知っていても管理者でなければ何もできない）。
- 同じ技術構成・同じ配色。装飾なし、PC・スマホ両対応。
- 画面：
  1. **ログイン**（メール＋パスワード。管理者でなければ「権限がありません」）
  2. **店舗一覧**：店舗名で検索、公開／非公開／アーカイブの絞り込み、最終確認日の表示
  3. **登録・編集フォーム**：上記の全項目。住所を入れると国土地理院の住所検索で緯度経度を自動入力し、地図上のピンをドラッグして微調整。都道府県・市区町村は既存の市区町村データから選択。営業時間は曜日ごとに「休み／時間帯（複数可）」を入力し、「月の時間を平日にコピー」ボタンで入力を短縮。
  4. **公開切り替え**：一覧と編集画面の両方にスイッチ
  5. **アーカイブ**：確認ダイアログの後に非公開化。アーカイブ済みは一覧の絞り込みで戻せる

---

## 5. 変更するファイル
| ファイル | 内容 |
| --- | --- |
| `supabase/migrations/002_stores.sql`（新規） | admins / stores / store_hours / is_admin() / RLS / Storage バケットとポリシー |
| `js/services.js` | `stores.listPublic(地域)` `stores.get(id)` 追加、管理用 `admin.*` 関数追加 |
| `js/app.jsx` | ShopMap を Supabase 取得に差し替え、StoreDetail 画面とルート追加（他画面は変更しない） |
| `admin.html` ＋ `js/admin.jsx`（新規） | 管理画面 |
| `YOKA_ADMIN_MANUAL.md`（新規） | 運営マニュアル（管理者の追加方法、登録・更新・非公開化の手順） |
| `YOKA_TECH_STORES.md`（新規） | 開発者向け資料（テーブル・RLS・拡張方針） |

新しいライブラリの追加はありません（既存の React / Leaflet / supabase-js のみ）。有料サービスも追加しません（Supabase 無料枠内）。
チラシ・まち情報・災害モードの店舗は今回は変更しません（サンプルのまま）。

---

## 6. 実装順序
0. **準備（あなた）**：現在の版を GitHub にアップロード（復元地点）→ Supabase プロジェクト作成 → `001_init.sql` 実行 → `config.js` 記入
1. `002_stores.sql` を作成して提示 → 確認後にあなたが SQL Editor で実行
2. 自分のアカウントで新規登録 → SQL で自分を `admins` に追加（手順は提示します）
3. 管理画面（ログイン → 一覧 → 登録 → 編集 → 公開切替 → アーカイブ）
4. 住民画面の接続（お店マップ・店舗詳細）
5. 経路案内ボタン
6. 動作確認

## 7. 動作確認の進め方
こちらのプレビューでは画面の表示・入力検証までしか確認できません。ログイン・保存・RLS の確認は、あなたの Supabase に接続した状態で必要です。確認用チェックリストと、RLS を確かめる SQL（一般ユーザーとして非公開店舗が取れないこと等）を用意し、**確認できた項目と未確認の項目を分けて**報告します。

---

## 8. 決定事項（2026-10-25 承認）
1. 計画は下記「9. 修正版の設計」を条件に承認
2. 写真は**公開バケット**。掲載許可を得た公開用写真のみ保存。非公開店舗でもURLを知れば閲覧できる前提で運用
3. 経路案内は **Googleマップ と Appleマップ** の両方
4. **祝日の営業時間も管理**する。臨時休業は当面「補足」欄で対応
5. STEP 0（GitHubバックアップ・Supabase準備）を先に実施

---

## 9. 修正版の設計（3章を置き換え）

### 9-1. 営業時間：「営業」「定休日」「未設定」を区別
```
store_day_rules（曜日ごとの状態）
  store_id   uuid → stores（cascade）
  day_key    smallint  0=日 … 6=土、7=祝日
  status     text  'open' | 'closed'
  PK (store_id, day_key)

store_hours（営業する日の時間帯。複数可）
  id         uuid PK
  store_id, day_key  → store_day_rules（cascade）
  opens_at   time  必須
  closes_at  time  必須（翌日にまたがる場合は closes_at < opens_at）
  sort       smallint
```
- **行がない曜日＝「未設定」**。住民画面では「営業時間は未確認です」と表示し、定休日とは表示しない。
- `status='closed'` の曜日だけ「定休日」と表示。
- `status='open'` なのに時間帯が0件の場合は「営業（時間は未確認）」と表示。
- 時間帯は `status='open'` の曜日にしか登録できないよう、トリガーで検証。
- 祝日（day_key=7）は通常曜日とは別に管理。祝日の判定には内閣府の「国民の祝日」CSVを元にした祝日一覧を使用（データの持ち方はSTEP 2で提示）。
- 臨時休業・年末年始などは `hours_note`（補足）で対応。
- `regular_holiday`（定休日の表記）は廃止し、曜日の状態から自動表示に一本化（「第3火曜」など規則で表せないものは補足欄へ）。

### 9-2. 管理者判定
- `private` スキーマを作り、`private.is_admin()` をそこに置く。`private` は Supabase の API 公開スキーマ（Exposed schemas）に含めないため、外部から直接呼び出せない。
- 関数は `security definer`＋`set search_path = ''`（空に固定し、中ではすべて `public.admins` のように完全修飾名で参照）。`stable` 指定。
- 権限：`revoke all … from public, anon, authenticated` の後、RLS から呼べるよう `authenticated` に `usage on schema private` と `execute on function private.is_admin()` のみ付与。`anon`（未ログイン）には付与しない。
- `admins` テーブル自体にも `private` スキーマを使用（APIから見えない）。追加・削除は SQL Editor のみ。
- RLSポリシーは `to authenticated using (private.is_admin())` の形にし、未ログインの書き込みは対象ロール外で拒否。

### 9-3. アクセス制御のテスト
SQL Editor で次の3状態を再現するテスト用SQLを用意する（`set local role` と `request.jwt.claims` を使い、実データは変更せず最後に `rollback`）。
| 状態 | 公開店舗の閲覧 | 非公開店舗の閲覧 | 登録・更新 | 削除 |
| --- | --- | --- | --- | --- |
| 未ログイン（anon） | 可 | 不可 | 不可 | 不可 |
| 一般ログイン | 可 | 不可 | 不可 | 不可 |
| 管理者ログイン | 可 | 可 | 可 | 不可（アーカイブのみ） |
画面側でも、3状態それぞれで管理画面を開いた結果を確認項目に含める。

### 9-4. 001_init.sql との依存関係と最小構成
| 001 の内容 | 使っている画面 | 店舗機能との関係 | 提案 |
| --- | --- | --- | --- |
| `set_updated_at()` | ― | 店舗でも使う | 実行する |
| `profiles` | ログイン・地域保存・マイページ | なし | 実行する（ログインを使う場合） |
| `calendar_events` | カレンダー | なし | 実行する（ログインを使う場合） |
| `partner_inquiries` | 問い合わせフォーム | なし | 実行する |
| `delete_my_account()` | アカウント削除 | 管理者が自分を削除した場合 admins も消えるよう 002 で外部キー cascade | 実行する |
| `municipalities` | **未使用**（市区町村は国土地理院データを直接使用） | 店舗は `muni_code` 文字列で持つため不要 | **今回は作らない** |
| `local_content` | **未使用**（まち情報はサンプル表示） | 将来は `store_id` を持つ `store_posts` に置き換える方が拡張しやすい | **今回は作らない** |

→ 001 から `municipalities` と `local_content` を外した版を実行することを提案（ファイルの修正はあなたの承認後に行います）。店舗機能の 002 は 001 の `set_updated_at()` だけに依存します。

### 9-5. GitHub の運用
- `main` は変更しない（現在の公開サイトのまま）。
- 新しく `beta` ブランチを作り、最新版はそこへ保存。動作確認後に、あなたの判断で main へ反映する。
