/* YOKA 店舗管理（β版：運営専用）
   部品（HoursEditor / PhotoSlots / LocationPicker）は将来の店舗用画面でも再利用する想定 */
const Y = window.YOKA, SY = window.YOKA_STORES, DAYS = SY.DAYS;
const todayStr = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
const emptyStore = () => ({ name:'', category:'', description:'', prefecture:'', municipality:'', muni_code:'', address:'',
  latitude:null, longitude:null, hours_note:'', verified_at:todayStr(), is_published:false });
const fmtDate = (s) => s ? new Date(s).toLocaleDateString('ja-JP', { year:'numeric', month:'numeric', day:'numeric' }) : '—';
const errMsg = (e) => (e && (e.message || e.error_description)) || String(e);

const Section = ({ title, children, right }) => (
  <Card style={{ padding:16, display:'flex', flexDirection:'column', gap:14, overflow:'visible' }}>
    <div className="row" style={{ justifyContent:'space-between' }}>
      <span style={{ fontSize:15, fontWeight:900 }}>{title}</span>{right}
    </div>
    {children}
  </Card>
);

const STATUS = { pub:['公開中','#e3f3ef','#0c7264'], draft:['非公開','#eef0ef','#4a5754'], archive:['アーカイブ','#fdeced','#b4283c'] };
const statusOf = (s) => s.archived_at ? 'archive' : s.is_published ? 'pub' : 'draft';
const StatusBadge = ({ k }) => (
  <span style={{ fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:999, background:STATUS[k][1], color:STATUS[k][2], whiteSpace:'nowrap' }}>{STATUS[k][0]}</span>
);

function Seg({ options, value, onChange }) {
  return (
    <div style={{ display:'flex', background:'#f1f3f2', borderRadius:10, padding:3, gap:3 }}>
      {options.map(([v, l]) => (
        <button key={v} type="button" onClick={() => onChange(v)} style={{ flex:1, minHeight:36, border:0, borderRadius:8, cursor:'pointer',
          fontSize:13, fontWeight:700, background:value === v ? '#fff' : 'transparent', color:value === v ? TEAL_D : SUB,
          boxShadow:value === v ? '0 1px 2px rgba(0,0,0,.1)' : 'none' }}>{l}</button>
      ))}
    </div>
  );
}

/* ── ログイン ── */
function Login() {
  const [email, setEmail] = useState(''); const [pw, setPw] = useState('');
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    const { error } = await Y.sb.auth.signInWithPassword({ email: email.trim(), password: pw });
    setBusy(false); if (error) setErr('メールアドレスまたはパスワードが違います');
  };
  return (
    <form onSubmit={submit} style={{ maxWidth:420, margin:'40px auto', display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ fontSize:20, fontWeight:900 }}>運営者ログイン</div>
      <Notice>YOKA 運営者専用の画面です。住民向けアカウントと同じメールアドレスでログインします。</Notice>
      <Field label="メールアドレス"><input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle}/></Field>
      <Field label="パスワード"><input type="password" required autoComplete="current-password" value={pw} onChange={e => setPw(e.target.value)} style={inputStyle}/></Field>
      {err && <Notice tone="error" icon="error">{err}</Notice>}
      <Btn type="submit" disabled={busy}>{busy ? 'ログイン中…' : 'ログイン'}</Btn>
    </form>
  );
}

/* ── E 店舗一覧 ── */
function StoreList({ onOpen, onNew }) {
  const [rows, setRows] = useState(null); const [err, setErr] = useState('');
  const [q, setQ] = useState(''); const [f, setF] = useState('all');
  useEffect(() => { SY.listAll().then(setRows).catch(e => setErr(errMsg(e))); }, []);
  const shown = (rows || []).filter(s => (f === 'all' ? statusOf(s) !== 'archive' : statusOf(s) === f) && (!q || s.name.includes(q.trim())));
  const count = (k) => (rows || []).filter(s => statusOf(s) === k).length;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div className="row" style={{ gap:10 }}>
        <div style={{ flex:1, position:'relative' }}>
          <span style={{ position:'absolute', left:12, top:13 }}><Icon n="search" s={20} c={GREY}/></span>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="店舗名で検索" style={{ ...inputStyle, paddingLeft:40 }}/>
        </div>
        <Btn onClick={onNew} style={{ width:'auto', whiteSpace:'nowrap' }}><Icon n="add" s={20} c="#fff"/>新規登録</Btn>
      </div>
      <Seg value={f} onChange={setF} options={[['all','すべて'],['pub',`公開中 ${count('pub')}`],['draft',`非公開 ${count('draft')}`],['archive',`アーカイブ ${count('archive')}`]]}/>
      {err && <Notice tone="error" icon="error">読み込めませんでした：{err}</Notice>}
      {!rows && !err && <div style={{ color:SUB, fontSize:13, padding:20, textAlign:'center' }}>読み込み中…</div>}
      {rows && !shown.length && <div style={{ color:SUB, fontSize:13, padding:28, textAlign:'center' }}>{rows.length ? '該当する店舗はありません' : 'まだ店舗が登録されていません。「新規登録」から追加してください。'}</div>}
      <Card>
        {shown.map((s, i) => (
          <button key={s.id} onClick={() => onOpen(s.id)} className="row" style={{ width:'100%', gap:12, padding:'12px 14px', border:0, background:'#fff',
            borderTop:i ? '1px solid #f0f2f1' : 0, textAlign:'left', cursor:'pointer' }}>
            {s.cover ? <img src={s.cover} alt="" style={{ width:56, height:56, borderRadius:10, objectFit:'cover', flex:'none' }}/> : <Ph w={56} h={56} label=""/>}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:15, fontWeight:700, color:INK, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.name}</div>
              <div style={{ fontSize:12, color:SUB, marginTop:2 }}>{[s.category, s.municipality].filter(Boolean).join('・')}</div>
              <div style={{ fontSize:11, color:GREY, marginTop:2 }}>最終確認 {fmtDate(s.verified_at)}　更新 {fmtDate(s.updated_at)}</div>
            </div>
            <StatusBadge k={statusOf(s)}/>
            <Icon n="chevron_right" s={20} c={GREY}/>
          </button>
        ))}
      </Card>
    </div>
  );
}

/* ── 所在地（都道府県・市区町村・住所・地図） ── */
const badStyle = (b) => b ? { borderColor: RED, background: '#fff7f8' } : null;
const ErrText = ({ children = '入力してください' }) => <span style={{ fontSize: 12, fontWeight: 700, color: RED }}>{children}</span>;
const PIN_SVG = '<svg width="30" height="42" viewBox="0 0 30 42"><path d="M15 1C7.3 1 1 7.2 1 14.9 1 25.3 15 41 15 41s14-15.7 14-26.1C29 7.2 22.7 1 15 1z" fill="#ea4335" stroke="#b3261e" stroke-width="1.2"/><circle cx="15" cy="15" r="5.2" fill="#7a1410"/></svg>';

function LocationPicker({ s, set, E = {} }) {
  const prefs = useMemo(() => Y.prefectures(), []);
  const munis = useMemo(() => Y.munis().filter(m => m.pref === s.prefecture), [s.prefecture]);
  const el = useRef(), map = useRef(), mk = useRef(), setRef = useRef(set);
  const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  setRef.current = set;
  const pick = (lat, lon) => setRef.current({ latitude: +lat.toFixed(6), longitude: +lon.toFixed(6) });
  useEffect(() => {
    const has = s.latitude != null;
    map.current = L.map(el.current, { zoomControl:false }).setView(has ? [s.latitude, s.longitude] : [35.681, 139.767], has ? 17 : 12);
    L.control.zoom({ position:'bottomright' }).addTo(map.current);
    L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png', { maxZoom:18,
      attribution:'<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank">地理院タイル</a>' }).addTo(map.current);
    map.current.on('click', e => pick(e.latlng.lat, e.latlng.lng));
    return () => map.current.remove();
  }, []);
  useEffect(() => {
    if (s.latitude == null) { if (mk.current) { mk.current.remove(); mk.current = null; } return; }
    const ll = [s.latitude, s.longitude];
    if (!mk.current) {
      mk.current = L.marker(ll, { draggable:true, icon: L.divIcon({ className:'', html:PIN_SVG, iconSize:[30,42], iconAnchor:[15,40] }) }).addTo(map.current);
      mk.current.on('dragend', () => { const p = mk.current.getLatLng(); pick(p.lat, p.lng); });
    } else mk.current.setLatLng(ll);
    if (!map.current.getBounds().contains(ll)) map.current.setView(ll, 17);
  }, [s.latitude, s.longitude]);
  const setMuni = async (code) => {
    const m = Y.byCode(code); set({ muni_code: code, municipality: m ? m.name : '' });
    if (m && s.latitude == null) { try { const c = await Y.geocode(m); map.current.setView([c.lat, c.lon], 14); } catch (e) {} }
  };
  const findByAddress = async () => {
    setMsg(''); setBusy(true);
    try { const c = await SY.geocodeAddress(s.prefecture + s.municipality.replace(/\s/g, '') + s.address); pick(c.lat, c.lon); map.current.setView([c.lat, c.lon], 17); setMsg('位置を設定しました。ずれている場合はピンを動かしてください。'); }
    catch (e) { setMsg(errMsg(e)); }
    setBusy(false);
  };
  return (
    <>
      <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(0,1.4fr)', gap:10 }}>
        <Field label="都道府県 *">
          <select value={s.prefecture} data-err={E.muni && !s.prefecture ? 1 : 0} onChange={e => set({ prefecture: e.target.value, municipality:'', muni_code:'' })} style={{ ...inputStyle, ...badStyle(E.muni && !s.prefecture) }}>
            <option value="">選択</option>{prefs.map(p => <option key={p.code} value={p.name}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="市区町村 *">
          <select value={s.muni_code} disabled={!s.prefecture} data-err={E.muni && s.prefecture ? 1 : 0} onChange={e => setMuni(e.target.value)} style={{ ...inputStyle, ...badStyle(E.muni) }}>
            <option value="">選択</option>{munis.map(m => <option key={m.code} value={m.code}>{m.name}</option>)}
          </select>
        </Field>
      </div>
      {E.muni && <div style={{ marginTop:-8 }}><ErrText>都道府県と市区町村を選んでください</ErrText></div>}
      <Field label="住所（市区町村より後ろ） *"><input value={s.address} data-err={E.address ? 1 : 0} onChange={e => set({ address: e.target.value })} placeholder="例：本町1-2-3 ○○ビル1階" style={{ ...inputStyle, ...badStyle(E.address) }}/>{E.address && <ErrText/>}</Field>
      <div data-err={E.loc ? 1 : 0} style={{ position:'relative', borderRadius:14, overflow:'hidden', border:E.loc ? `2px solid ${RED}` : '1px solid #e3e8e6' }}>
        <div ref={el} style={{ height:300 }}/>
        <div className="row" style={{ position:'absolute', top:10, left:10, right:10, zIndex:1000, gap:8, background:'#fff', borderRadius:26,
          boxShadow:'0 1px 2px rgba(60,64,67,.3), 0 2px 6px 2px rgba(60,64,67,.15)', padding:'5px 5px 5px 12px' }}>
          <Icon n="location_on" s={20} c="#ea4335"/>
          <span style={{ flex:1, minWidth:0, fontSize:13, color:s.address ? INK : GREY, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {s.address ? `${s.municipality}${s.address}` : '住所を入力すると位置を探せます'}
          </span>
          <button type="button" onClick={findByAddress} disabled={busy || !s.muni_code || !s.address} style={{ border:0, borderRadius:20, padding:'8px 14px', fontSize:12.5, fontWeight:700,
            background:TEAL, color:'#fff', cursor:'pointer', whiteSpace:'nowrap', opacity:busy || !s.muni_code || !s.address ? .45 : 1 }}>{busy ? '検索中…' : '位置を探す'}</button>
        </div>
      </div>
      <div className="row" style={{ marginTop:-6, gap:10, flexWrap:'wrap', justifyContent:'space-between' }}>
        {E.loc ? <ErrText>地図をタップして位置を指定してください</ErrText> : <span style={{ fontSize:11.5, color:'#8a9491' }}>地図をタップするか、ピンをドラッグして入口に合わせます</span>}
        <span style={{ fontSize:11, color:GREY }}>{s.latitude != null ? `${s.latitude}, ${s.longitude}` : '位置未設定'}</span>
      </div>
      {msg && <Notice>{msg}</Notice>}
    </>
  );
}

/* ── 営業時間（営業／定休日／未設定 を区別。祝日は別枠） ── */
function HoursEditor({ days, setDays, showErr }) {
  const upd = (k, v) => setDays({ ...days, [k]: { ...days[k], ...v } });
  const setStatus = (k, st) => upd(k, { status: st, ranges: st === 'open' ? (days[k].ranges.length ? days[k].ranges : [{ o:'10:00', c:'18:00' }]) : [] });
  const setRange = (k, i, v) => upd(k, { ranges: days[k].ranges.map((r, j) => j === i ? { ...r, ...v } : r) });
  const copyMon = () => { const n = { ...days }; [2,3,4,5].forEach(k => { n[k] = { status: days[1].status, ranges: days[1].ranges.map(r => ({ ...r })) }; }); setDays(n); };
  const tin = { ...inputStyle, padding:'8px 8px', fontSize:14, width:112 };
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
      {DAYS.map((d, idx) => {
        const v = days[d.k];
        return (
          <div key={d.k} style={{ display:'flex', flexDirection:'column', gap:8, padding:'12px 0', borderTop:idx ? '1px solid #f0f2f1' : 0,
            background:d.k === 7 ? '#fbfaf6' : 'transparent', margin:d.k === 7 ? '0 -16px' : 0, paddingLeft:d.k === 7 ? 16 : 0, paddingRight:d.k === 7 ? 16 : 0 }}>
            <div className="row" style={{ gap:12 }}>
              <span style={{ width:38, fontSize:14, fontWeight:900, color:d.k === 0 || d.k === 7 ? RED : d.k === 6 ? '#3a6fb0' : INK }}>{d.l}</span>
              <div style={{ flex:1 }}><Seg value={v.status} onChange={st => setStatus(d.k, st)} options={[['open','営業'],['closed','定休日'],['unset','未設定']]}/></div>
            </div>
            {v.status === 'open' && (
              <div style={{ display:'flex', flexDirection:'column', gap:6, paddingLeft:50 }}>
                {v.ranges.map((r, i) => {
                  const bad = !r.o || !r.c || r.o === r.c, over = r.c && r.o && r.c < r.o;
                  return (
                    <div key={i} className="row" style={{ gap:6, flexWrap:'wrap' }}>
                      <input type="time" value={r.o} data-err={showErr && bad ? 1 : 0} onChange={e => setRange(d.k, i, { o: e.target.value })} style={{ ...tin, ...badStyle(showErr && bad) }}/>
                      <span style={{ color:SUB }}>〜</span>
                      <input type="time" value={r.c} onChange={e => setRange(d.k, i, { c: e.target.value })} style={{ ...tin, ...badStyle(showErr && bad) }}/>
                      {over && <span style={{ fontSize:11, color:SUB }}>翌日</span>}
                      {showErr && bad && <ErrText>{r.o && r.c ? '開始と終了が同じです' : '時刻を入力してください'}</ErrText>}
                      <button type="button" onClick={() => upd(d.k, { ranges: v.ranges.filter((_, j) => j !== i) })} aria-label="時間帯を削除"
                        style={{ border:0, background:'none', cursor:'pointer', padding:6, display:v.ranges.length > 1 ? 'block' : 'none' }}><Icon n="close" s={18} c={GREY}/></button>
                    </div>
                  );
                })}
                {v.ranges.length < 3 && (
                  <button type="button" onClick={() => upd(d.k, { ranges: [...v.ranges, { o:'17:00', c:'21:00' }] })}
                    style={{ alignSelf:'flex-start', border:0, background:'none', color:TEAL_D, fontSize:12.5, fontWeight:700, cursor:'pointer', padding:'4px 0' }}>＋ 時間帯を追加（昼休みなど）</button>
                )}
              </div>
            )}
            {d.k === 1 && <button type="button" onClick={copyMon} style={{ alignSelf:'flex-end', border:0, background:'none', color:TEAL_D, fontSize:12, fontWeight:700, cursor:'pointer', padding:0 }}>月曜の設定を火〜金にコピー</button>}
          </div>
        );
      })}
    </div>
  );
}

/* ── 写真（3枚まで。1枚目が先頭） ── */
function PhotoSlots({ photos, setPhotos, onRemove }) {
  const [err, setErr] = useState('');
  const add = async (e) => {
    const f = e.target.files && e.target.files[0]; e.target.value = ''; setErr('');
    if (!f) return;
    if (!SY.TYPES.includes(f.type)) { setErr('JPEG・PNG・WebP の画像を選んでください'); return; }
    setPhotos([...photos, { file: f, url: URL.createObjectURL(f), alt:'' }]);
  };
  const move = (i, d) => { const n = [...photos]; [n[i], n[i + d]] = [n[i + d], n[i]]; setPhotos(n); };
  const del = (i) => { if (photos[i].path) onRemove(photos[i].path); setPhotos(photos.filter((_, j) => j !== i)); };
  const arrow = { border:'1px solid #dfe5e3', background:'#fff', borderRadius:8, width:32, height:28, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' };
  return (
    <>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,minmax(0,1fr))', gap:10 }}>
        {[0, 1, 2].map(i => {
          const p = photos[i];
          if (!p) return i === photos.length ? (
            <label key={i} style={{ aspectRatio:'4/3', borderRadius:10, border:'1.5px dashed #cfd8d5', background:'#fafbfb', display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center', gap:2, color:TEAL_D, fontSize:12, fontWeight:700, cursor:'pointer' }}>
              <Icon n="add_photo_alternate" s={26} c={TEAL_D}/>追加
              <input type="file" accept={SY.TYPES.join(',')} onChange={add} style={{ display:'none' }}/>
            </label>
          ) : <div key={i} style={{ aspectRatio:'4/3', borderRadius:10, background:'#f4f6f5' }}/>;
          return (
            <div key={p.path || p.url} style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <div style={{ position:'relative', aspectRatio:'4/3', borderRadius:10, overflow:'hidden', background:'#e9edeb' }}>
                <img src={p.url} alt={p.alt} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
                <button type="button" onClick={() => del(i)} aria-label="写真を削除" style={{ position:'absolute', top:5, right:5, width:26, height:26, borderRadius:'50%', border:0,
                  background:'rgba(34,49,46,.7)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon n="close" s={16} c="#fff"/></button>
                {i === 0 && <span style={{ position:'absolute', left:5, bottom:5, padding:'1px 6px', borderRadius:4, background:TEAL, color:'#fff', fontSize:10.5, fontWeight:700 }}>先頭</span>}
              </div>
              <div className="row" style={{ gap:6, justifyContent:'center' }}>
                <button type="button" disabled={i === 0} onClick={() => move(i, -1)} style={{ ...arrow, opacity:i === 0 ? .35 : 1 }} aria-label="前へ"><Icon n="chevron_left" s={18}/></button>
                <button type="button" disabled={i === photos.length - 1} onClick={() => move(i, 1)} style={{ ...arrow, opacity:i === photos.length - 1 ? .35 : 1 }} aria-label="後ろへ"><Icon n="chevron_right" s={18}/></button>
              </div>
              <input value={p.alt} maxLength={100} placeholder="説明（例：店内）" onChange={e => setPhotos(photos.map((x, j) => j === i ? { ...x, alt: e.target.value } : x))}
                style={{ ...inputStyle, padding:'7px 9px', fontSize:12.5 }}/>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize:11.5, color:'#8a9491', lineHeight:1.6 }}>JPEG・PNG・WebP。大きい画像は自動で縮小します（3MBまで）。<b>掲載許可を得た写真のみ</b>登録してください。写真は保存先URLを知っていれば誰でも開けます。</div>
      {err && <Notice tone="error" icon="error">{err}</Notice>}
    </>
  );
}

/* ── G 保存前の確認（住民向けの見え方） ── */
function ConfirmSheet({ s, days, photos, onBack, onSave, busy, err }) {
  const unset = DAYS.filter(d => days[d.k].status === 'unset').length;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(20,30,28,.45)', zIndex:2000, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
      <div style={{ background:'#f4f6f5', width:'100%', maxWidth:560, maxHeight:'92vh', overflow:'auto', borderRadius:'18px 18px 0 0', padding:16, display:'flex', flexDirection:'column', gap:12 }}>
        <div className="row" style={{ justifyContent:'space-between' }}>
          <span style={{ fontSize:16, fontWeight:900 }}>住民向けの見え方を確認</span>
          <StatusBadge k={s.is_published ? 'pub' : 'draft'}/>
        </div>
        <Card>
          {photos[0] ? <img src={photos[0].url} alt="" style={{ width:'100%', height:180, objectFit:'cover', display:'block' }}/> : <Ph w="100%" h={120} r={0} label="写真なし"/>}
          <div style={{ padding:14, display:'flex', flexDirection:'column', gap:6 }}>
            <div style={{ fontSize:18, fontWeight:900 }}>{s.name || '（店名未入力）'}</div>
            <div style={{ fontSize:12.5, color:SUB }}>{s.category}</div>
            {s.description && <div style={{ fontSize:13.5, lineHeight:1.7, whiteSpace:'pre-wrap' }}>{s.description}</div>}
            <div style={{ fontSize:13, color:'#3d4a47' }}>{s.prefecture}{s.municipality}{s.address}</div>
          </div>
          <div style={{ borderTop:'1px solid #f0f2f1', padding:'10px 14px' }}>
            {DAYS.map(d => (
              <div key={d.k} className="row" style={{ gap:12, padding:'4px 0', fontSize:13 }}>
                <span style={{ width:34, fontWeight:700 }}>{d.l}</span>
                <span style={{ color:days[d.k].status === 'unset' ? GREY : days[d.k].status === 'closed' ? RED : INK }}>{SY.dayText(days[d.k])}</span>
              </div>
            ))}
            {s.hours_note && <div style={{ fontSize:12, color:SUB, marginTop:6, whiteSpace:'pre-wrap' }}>{s.hours_note}</div>}
            <div style={{ fontSize:11, color:GREY, marginTop:8 }}>情報の最終確認日：{fmtDate(s.verified_at)}</div>
          </div>
        </Card>
        {unset > 0 && <Notice tone="warn" icon="warning">営業時間が未設定の曜日が {unset} 日あります。住民には「情報なし」と表示されます（定休日とは表示されません）。</Notice>}
        {!s.is_published && <Notice>非公開のため、保存しても住民の画面には表示されません。</Notice>}
        {err && <Notice tone="error" icon="error">保存できませんでした：{err}</Notice>}
        <div className="row" style={{ gap:10, paddingBottom:'env(safe-area-inset-bottom)' }}>
          <Btn kind="plain" onClick={onBack} disabled={busy}>戻って直す</Btn>
          <Btn onClick={onSave} disabled={busy}>{busy ? '保存中…' : '保存する'}</Btn>
        </div>
      </div>
    </div>
  );
}

/* ── F 登録・編集 ── */
function StoreEditor({ id, onDone }) {
  const [s, setS] = useState(id ? null : emptyStore());
  const [days, setDays] = useState(SY.emptyDays());
  const [photos, setPhotos] = useState([]); const [removed, setRemoved] = useState([]);
  const [loadErr, setLoadErr] = useState(''); const [tried, setTried] = useState(false);
  const [confirm, setConfirm] = useState(false); const [busy, setBusy] = useState(false); const [saveErr, setSaveErr] = useState('');
  useEffect(() => { if (id) SY.get(id).then(r => { setS(r.store); setDays(r.days); setPhotos(r.photos); }).catch(e => setLoadErr(errMsg(e))); }, [id]);
  const set = (v) => setS(x => ({ ...x, ...v }));
  if (loadErr) return <Notice tone="error" icon="error">読み込めませんでした：{loadErr}</Notice>;
  if (!s) return <div style={{ color:SUB, fontSize:13, padding:20, textAlign:'center' }}>読み込み中…</div>;
  const check = () => ({
    name: !s.name.trim(), muni: !s.muni_code, address: !s.address.trim(), loc: s.latitude == null,
    hours: DAYS.some(d => days[d.k].status === 'open' && days[d.k].ranges.some(r => !r.o || !r.c || r.o === r.c)),
  });
  const E = tried ? check() : {};
  const LABELS = { name:'店名', muni:'都道府県・市区町村', address:'住所', loc:'地図上の位置', hours:'営業時間' };
  const errs = Object.keys(LABELS).filter(k => E[k]).map(k => LABELS[k]);
  const validate = () => {
    setTried(true);
    if (Object.values(check()).some(Boolean)) {
      setTimeout(() => { const el = document.querySelector('[data-err="1"]'); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 90, behavior:'smooth' }); }, 60);
      return;
    }
    setSaveErr(''); setConfirm(true);
  };
  const doSave = async () => {
    setBusy(true); setSaveErr('');
    try { await SY.save({ store: s, days, photos, removed }); setBusy(false); onDone(true); }
    catch (e) { setBusy(false); setSaveErr(errMsg(e)); }
  };
  const doArchive = async () => {
    if (!confirm_(s.archived_at ? 'この店舗をアーカイブから戻しますか？（非公開のまま戻ります）' : 'この店舗をアーカイブしますか？\n住民の画面から消え、非公開になります。データは残り、あとで戻せます。')) return;
    try { s.archived_at ? await SY.restore(s.id) : await SY.archive(s.id); onDone(true); } catch (e) { alert(errMsg(e)); }
  };
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div className="row" style={{ gap:8 }}>
        <button onClick={() => onDone(false)} style={{ border:0, background:'none', cursor:'pointer', padding:4, display:'flex' }} aria-label="一覧へ戻る"><Icon n="arrow_back" s={22} c={INK}/></button>
        <span style={{ fontSize:18, fontWeight:900, flex:1 }}>{id ? '店舗情報の編集' : '新規店舗登録'}</span>
        {id && <StatusBadge k={statusOf(s)}/>}
      </div>
      {s.archived_at && <Notice tone="warn" icon="inventory_2">この店舗はアーカイブ中です。住民の画面には表示されません。</Notice>}
      <Section title="基本情報">
        <Field label="店名 *"><input value={s.name} maxLength={80} data-err={E.name ? 1 : 0} onChange={e => set({ name: e.target.value })} style={{ ...inputStyle, ...badStyle(E.name) }}/>{E.name && <ErrText/>}</Field>
        <Field label="業種" hint="例：パン屋、喫茶店、居酒屋"><input value={s.category || ''} maxLength={30} onChange={e => set({ category: e.target.value })} style={inputStyle}/></Field>
        <Field label="店舗紹介文" hint={`${(s.description || '').length} / 1000`}><textarea value={s.description || ''} maxLength={1000} rows={4} onChange={e => set({ description: e.target.value })} style={{ ...inputStyle, resize:'vertical', lineHeight:1.6 }}/></Field>
      </Section>
      <Section title="所在地"><LocationPicker s={s} set={set} E={E}/></Section>
      <Section title="営業時間" right={<span style={{ fontSize:11.5, color:SUB }}>未設定は「情報なし」と表示</span>}>
        <HoursEditor days={days} setDays={setDays} showErr={!!E.hours}/>
        <Field label="補足（臨時休業など）"><textarea value={s.hours_note || ''} maxLength={500} rows={2} onChange={e => set({ hours_note: e.target.value })} placeholder="例：11月3日は臨時休業" style={{ ...inputStyle, resize:'vertical', lineHeight:1.6 }}/></Field>
      </Section>
      <Section title="店舗写真" right={<span style={{ fontSize:12, color:SUB }}>{photos.length} / 3</span>}>
        <PhotoSlots photos={photos} setPhotos={setPhotos} onRemove={p => setRemoved(r => [...r, p])}/>
      </Section>
      <Section title="公開設定">
        <Field label="情報の最終確認日" hint="店舗に内容を確認した日"><input type="date" value={s.verified_at || ''} onChange={e => set({ verified_at: e.target.value })} style={{ ...inputStyle, maxWidth:200 }}/></Field>
        {!s.archived_at && <Seg value={s.is_published ? 'pub' : 'draft'} onChange={v => set({ is_published: v === 'pub' })} options={[['draft','非公開'],['pub','公開する']]}/>}
      </Section>
      {errs.length > 0 && <Notice tone="error" icon="error">赤枠の項目を確認してください：{errs.join('、')}</Notice>}
      {id && <Btn kind="danger" onClick={doArchive}><Icon n={s.archived_at ? 'unarchive' : 'inventory_2'} s={18} c="#c22e43"/>{s.archived_at ? 'アーカイブから戻す' : 'アーカイブする（非公開にして保管）'}</Btn>}
      <div style={{ position:'fixed', left:0, right:0, bottom:0, background:'rgba(255,255,255,.96)', boxShadow:'0 -1px 0 rgba(0,0,0,.08)', zIndex:1000 }}>
        <div className="row" style={{ maxWidth:720, margin:'0 auto', gap:10, padding:'10px 16px calc(env(safe-area-inset-bottom) + 10px)' }}>
          <Btn kind="plain" onClick={() => onDone(false)} style={{ flex:1 }}>キャンセル</Btn>
          <Btn onClick={validate} style={{ flex:2 }}>確認して保存</Btn>
        </div>
      </div>
      {confirm && <ConfirmSheet s={s} days={days} photos={photos} busy={busy} err={saveErr} onBack={() => setConfirm(false)} onSave={doSave}/>}
    </div>
  );
}
const confirm_ = (m) => window.confirm(m);

/* ── 全体 ── */
function AdminApp() {
  const [sess, setSess] = useState(undefined); const [admin, setAdmin] = useState(null);
  const [view, setView] = useState({ k:'list', n:0 });
  useEffect(() => {
    if (!Y || !Y.sb) { setSess(null); return; }
    Y.sb.auth.getSession().then(({ data }) => setSess(data.session));
    const { data } = Y.sb.auth.onAuthStateChange((_e, s) => setSess(s));
    return () => data.subscription.unsubscribe();
  }, []);
  const uid = sess && sess.user.id;
  useEffect(() => { setAdmin(null); if (uid) SY.amIAdmin().then(setAdmin); }, [uid]);
  useEffect(() => { window.scrollTo(0, 0); }, [view.k, view.id]);
  let body;
  if (!Y || !Y.sb) body = <Notice tone="error" icon="error">config.js に Supabase の設定がありません。</Notice>;
  else if (sess === undefined || (sess && admin === null)) body = <div style={{ color:SUB, fontSize:13, padding:40, textAlign:'center' }}>確認中…</div>;
  else if (!sess) body = <Login/>;
  else if (!admin) body = (
    <div style={{ maxWidth:420, margin:'40px auto', display:'flex', flexDirection:'column', gap:14 }}>
      <Notice tone="warn" icon="lock">このアカウント（{sess.user.email}）には管理者の権限がありません。</Notice>
      <Btn kind="ghost" onClick={() => Y.sb.auth.signOut()}>別のアカウントでログイン</Btn>
    </div>
  );
  else if (view.k === 'edit') body = <StoreEditor key={view.id || 'new'} id={view.id} onDone={() => setView({ k:'list', n:view.n + 1 })}/>;
  else body = <StoreList key={view.n} onOpen={id => setView({ k:'edit', id, n:view.n })} onNew={() => setView({ k:'edit', id:null, n:view.n })}/>;
  return (
    <div style={{ minHeight:'100vh' }}>
      <header style={{ background:'#fff', boxShadow:'0 1px 0 rgba(0,0,0,.06)', position:'sticky', top:0, zIndex:1100 }}>
        <div className="row" style={{ maxWidth:720, margin:'0 auto', padding:'calc(env(safe-area-inset-top) + 12px) 16px 12px', gap:10 }}>
          <Logo/><span style={{ fontSize:16, fontWeight:900 }}>YOKA 店舗管理</span>
          <span style={{ fontSize:10.5, fontWeight:700, padding:'2px 7px', borderRadius:4, background:'#eef0ef', color:'#4a5754' }}>運営専用・β</span>
          <span style={{ flex:1 }}/>
          {sess && <button onClick={() => Y.sb.auth.signOut()} style={{ border:0, background:'none', color:SUB, fontSize:12.5, cursor:'pointer' }}>ログアウト</button>}
        </div>
      </header>
      <main style={{ maxWidth:720, margin:'0 auto', padding:'16px 16px 120px' }}>{body}</main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<AdminApp/>);
