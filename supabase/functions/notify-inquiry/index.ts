// Supabase Edge Function: notify-inquiry
// partner_inquiries に新しい行が追加されたら、運営者へメールで通知する。
// Database Webhook（INSERT）から呼び出される。メール送信は Resend を使用。
//
// 必要なシークレット（Supabase Dashboard > Edge Functions > Secrets）
//   RESEND_API_KEY   Resend の API キー
//   NOTIFY_TO        通知を受け取るメールアドレス（複数はカンマ区切り）
//   NOTIFY_FROM      送信元（例: "YOKA <noreply@your-domain.jp>"。未設定なら Resend のテスト用アドレス）
//   WEBHOOK_SECRET   Webhook のヘッダーに付ける合言葉（任意の長い文字列）

const TYPES: Record<string, string> = {
  municipality: '自治体（実証実験・連携）',
  store: 'スーパー・小売店（チラシ掲載）',
  shop: '地域店舗（まち情報掲載）',
  company: '企業・事業パートナー・支援者',
  other: 'その他',
};

const esc = (s: string) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 });

  const secret = Deno.env.get('WEBHOOK_SECRET');
  if (!secret || req.headers.get('x-webhook-secret') !== secret) {
    return new Response('unauthorized', { status: 401 });
  }

  const payload = await req.json().catch(() => null);
  const r = payload?.record;
  if (payload?.type !== 'INSERT' || payload?.table !== 'partner_inquiries' || !r) {
    return new Response('ignored', { status: 200 });
  }

  const to = (Deno.env.get('NOTIFY_TO') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const from = Deno.env.get('NOTIFY_FROM') || 'YOKA <onboarding@resend.dev>';
  const key = Deno.env.get('RESEND_API_KEY');
  if (!key || !to.length) return new Response('not configured', { status: 500 });

  const type = TYPES[r.inquiry_type] ?? r.inquiry_type;
  const created = new Date(r.created_at).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });

  const text = [
    'YOKAに新しいお問い合わせが届きました。',
    '',
    `受付日時：${created}`,
    `種別：${type}`,
    `団体名・店舗名：${r.org_name}`,
    `担当者名：${r.contact_name}`,
    `メール：${r.email}`,
    '',
    '― お問い合わせ内容 ―',
    r.body,
    '',
    `管理ID：${r.id}`,
  ].join('\n');

  const html = `
  <div style="font-family:sans-serif;font-size:14px;line-height:1.8;color:#22312e">
    <p>YOKAに新しいお問い合わせが届きました。</p>
    <table style="border-collapse:collapse">
      <tr><td style="padding:4px 12px 4px 0;color:#6b7674">受付日時</td><td>${esc(created)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#6b7674">種別</td><td>${esc(type)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#6b7674">団体名・店舗名</td><td>${esc(r.org_name)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#6b7674">担当者名</td><td>${esc(r.contact_name)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#6b7674">メール</td><td>${esc(r.email)}</td></tr>
    </table>
    <p style="margin-top:16px;font-weight:bold">お問い合わせ内容</p>
    <div style="white-space:pre-wrap;background:#f4f6f5;padding:12px;border-radius:8px">${esc(r.body)}</div>
    <p style="color:#9aa5a2;font-size:12px">管理ID：${esc(r.id)}</p>
  </div>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from, to,
      reply_to: r.email,
      subject: `【YOKA】お問い合わせ：${type}／${r.org_name}`,
      text, html,
    }),
  });

  if (!res.ok) {
    console.error('resend error', res.status, await res.text());
    return new Response('send failed', { status: 502 });
  }
  return new Response('ok', { status: 200 });
});
