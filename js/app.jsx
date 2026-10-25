const Y = window.YOKA;

/* ── ルーティング（ハッシュ方式：GitHub Pagesでリロードしても壊れない） ── */
function parseHash() {
  const h = location.hash.replace(/^#\/?/, '');
  if (/access_token|error_description|type=recovery/.test(h)) return {name:'home', q:{}};
  const [p, qs] = h.split('?');
  return {name: p || 'home', q: Object.fromEntries(new URLSearchParams(qs || ''))};
}
function useRoute() {
  const [r, setR] = useState(parseHash);
  useEffect(() => { const f = () => setR(parseHash()); window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f); }, []);
  return r;
}
const go = (p) => { location.hash = '#/' + p; };
const back = () => { if (history.length > 1) history.back(); else go('home'); };

/* ── 認証 ── */
function useAuth() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(!Y.sb);
  useEffect(() => {
    if (!Y.sb) return;
    Y.sb.auth.getSession().then(({data}) => { setSession(data.session); setReady(true); });
    const {data: sub} = Y.sb.auth.onAuthStateChange((ev, s) => {
      setSession(s);
      if (ev === 'PASSWORD_RECOVERY') go('new-password');
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  return {user: session && session.user, ready};
}

/* ── 地域 ── */
function useRegion(user) {
  const [region, setR] = useState(Y.region.load());
  useEffect(() => {
    if (!user) return;
    Y.profile.get(user.id).then(p => {
      if (p && p.muni_code) {
        const r = {code:p.muni_code, pref:p.pref_name, name:p.muni_name, lat:p.lat, lon:p.lon};
        setR(r); Y.region.save(r);
      } else if (region) Y.profile.saveRegion(user.id, region).catch(()=>{});
    }).catch(()=>{});
  }, [user && user.id]);
  const set = async (r) => { setR(r); Y.region.save(r); if (user) { try { await Y.profile.saveRegion(user.id, r); } catch(e) {} } };
  return [region, set];
}

/* ── 天気（気象庁の天気コード：1xx晴・2xx曇・3xx雨・4xx雪） ── */
const WX = (c) => {
  const g = Math.floor(c / 100);
  if (g === 1) return [c === 100 ? 'sunny' : 'partly_cloudy_day', '#f0a83a'];
  if (g === 2) return ['cloud', '#8a9491'];
  if (g === 3) return [c >= 350 ? 'thunderstorm' : 'rainy', '#5b9bd8'];
  if (g === 4) return ['weather_snowy', '#7fb0d8'];
  return ['help', '#9aa5a2'];
};
function useWeather(region) {
  const [st, setSt] = useState({status:'idle'});
  useEffect(() => {
    if (!region) { setSt({status:'idle'}); return; }
    let alive = true; setSt({status:'loading'});
    Y.weather(region.lat, region.lon, region.code).then(d => alive && setSt({status:'ok', d})).catch(() => alive && setSt({status:'error'}));
    return () => { alive = false; };
  }, [region && region.code, region && region.lat]);
  return st;
}

const todayLabel = () => { const d = new Date(); return `${d.getMonth()+1}月${d.getDate()}日（${'日月火水木金土'[d.getDay()]}）`; };
const pad2 = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
const hm = (d) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

const NeedRegion = () => (
  <Card style={{padding:16,display:'flex',flexDirection:'column',gap:12}}>
    <div style={{fontSize:14,fontWeight:700,color:INK}}>お住まいの地域を選んでください</div>
    <div style={{fontSize:12.5,color:SUB,lineHeight:1.7}}>全国の市区町村から選べます。地域に合わせて天気・地図・防災情報を表示します。</div>
    <Btn onClick={()=>go('region')}><Icon n="location_on" s={19} c="#fff"/>地域を選ぶ</Btn>
  </Card>
);

/* ── ホーム ── */
function WeatherCard({region, w}) {
  if (!region) return null;
  return (
    <Card>
      <div className="row" style={{padding:'7px 12px',background:'#e6f4f1',justifyContent:'space-between'}}>
        <span style={{fontSize:12.5,fontWeight:700,color:TEAL_D}}>今日の天気</span>
        <span style={{fontSize:11,color:TEAL_D}}>{region.name}{w.status === 'ok' ? ` ・ ${hm(new Date(w.d.time))} 更新` : ''}</span>
      </div>
      {w.status === 'loading' && <div style={{padding:18,fontSize:13,color:SUB}}>天気を取得しています…</div>}
      {w.status === 'error' && <div style={{padding:14}}><Notice tone="error" icon="cloud_off">天気情報を取得できませんでした。時間をおいて再度お試しください。</Notice></div>}
      {w.status === 'ok' && (() => { const [ic, col] = WX(w.d.jmaCode); const t = new Date(w.d.time); const f = (v) => v == null ? '—' : Math.round(v) + '°'; return (
        <div style={{padding:'9px 12px'}}>
          <div className="row" style={{gap:10}}>
            <Icon n={ic} s={34} c={col}/>
            <div style={{fontSize:24,fontWeight:700,color:INK,lineHeight:1.1,flex:'none'}}>{w.d.now == null ? '—' : w.d.now.toFixed(1)}<span style={{fontSize:13}}>°C</span></div>
            <div style={{flex:1,minWidth:0,fontSize:12.5,fontWeight:700,color:INK,lineHeight:1.4,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{w.d.text}</div>
          </div>
          <div className="row" style={{gap:14,marginTop:6,fontSize:12,color:SUB,flexWrap:'wrap'}}>
            <span style={{whiteSpace:'nowrap'}}>最高 <b style={{color:'#d1657a'}}>{f(w.d.max)}</b></span>
            <span style={{whiteSpace:'nowrap'}}>最低 <b style={{color:'#5b9bd8'}}>{f(w.d.min)}</b></span>
            <span style={{whiteSpace:'nowrap'}}>降水確率 <b style={{color:INK}}>{w.d.pop == null ? '—' : w.d.pop + '%'}</b></span>
            <div onClick={()=>go('weather')} className="row" style={{gap:1,cursor:'pointer',padding:'2px 0 2px 8px',marginLeft:'auto'}}>
              <span style={{fontSize:12,fontWeight:700,color:TEAL_D}}>詳しく見る</span><Icon n="chevron_right" s={17} c={TEAL_D}/>
            </div>
          </div>
        </div>); })()}
    </Card>
  );
}

const MACHI_SAMPLES = [
  {shop:'まちのカフェ（サンプル）', cat:'カフェ', title:'平日15時からのケーキセット', body:'ドリンクとケーキのセットを平日限定でご用意しています。', date:'掲載日 サンプル'},
  {shop:'商店街の美容室（サンプル）', cat:'美容室', title:'はじめての方へ カット相談会', body:'髪のお悩みを気軽にご相談いただける日を設けています。', date:'掲載日 サンプル'},
];

/* 広告枠（ver.0.1は募集表示。掲載開始時は AD に値を入れる） */
const AD = null; // 例: {sponsor:'○○商店', title:'...', img:'ads/xxx.jpg', url:'https://...'}
function AdSlot() {
  if (AD) return (
    <a href={AD.url} target="_blank" rel="noopener sponsored" style={{display:'block'}}>
      <Card style={{position:'relative'}}>
        <img src={AD.img} alt={AD.title} style={{display:'block',width:'100%',aspectRatio:'32/10',objectFit:'cover'}}/>
        <span style={{position:'absolute',top:8,left:8,fontSize:10,fontWeight:700,padding:'2px 6px',borderRadius:4,background:'rgba(255,255,255,.92)',color:'#4a5754'}}>PR</span>
        <div style={{padding:'9px 12px',fontSize:12,color:SUB}}>{AD.sponsor}</div>
      </Card>
    </a>
  );
  return (
    <div onClick={()=>go('partner?type=company')} style={{cursor:'pointer',borderRadius:14,border:'1.5px dashed #cfd8d5',background:'#fafbfb',
      aspectRatio:'32/10',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:4,position:'relative'}}>
      <span style={{position:'absolute',top:8,left:10,fontSize:10,fontWeight:700,color:'#9aa5a2',letterSpacing:'.08em'}}>広告</span>
      <div style={{fontSize:13,fontWeight:700,color:'#6b7674'}}>広告掲載主を募集しています</div>
      <div className="row" style={{gap:2}}><span style={{fontSize:12,fontWeight:700,color:TEAL_D}}>詳しくはこちら</span><Icon n="chevron_right" s={16} c={TEAL_D}/></div>
    </div>
  );
}

/* 今日の予定（ホーム） */
function TodayEvents({user}) {
  const [evs, setEvs] = useState(null);
  useEffect(() => {
    if (!user || !Y.sb) { setEvs(null); return; }
    const s = new Date(); s.setHours(0,0,0,0); const e = new Date(s); e.setDate(e.getDate()+1);
    Y.events.list(s, e).then(setEvs).catch(() => setEvs([]));
  }, [user && user.id]);
  return (
    <Card>
      <div className="row" style={{padding:'10px 14px',justifyContent:'space-between'}}>
        <div className="row" style={{gap:7}}><Icon n="calendar_month" s={19} c="#7cc35c"/><span style={{fontSize:13,fontWeight:700,color:INK}}>今日の予定</span></div>
        <div onClick={()=>go('calendar')} className="row" style={{gap:1,cursor:'pointer'}}><span style={{fontSize:12,fontWeight:700,color:TEAL_D}}>カレンダー</span><Icon n="chevron_right" s={17} c={TEAL_D}/></div>
      </div>
      {!user && <div style={{padding:'10px 14px 13px',borderTop:'1px solid #f0f2f1',fontSize:12.5,color:SUB}}>ログインすると、今日の予定がここに表示されます。</div>}
      {user && evs && evs.length === 0 && <div style={{padding:'10px 14px 13px',borderTop:'1px solid #f0f2f1',fontSize:12.5,color:'#8a9491'}}>今日の予定はありません</div>}
      {user && evs && evs.slice(0,3).map(e=>(
        <div key={e.id} className="row" style={{gap:10,padding:'10px 14px',borderTop:'1px solid #f0f2f1'}}>
          <span style={{fontSize:12,fontWeight:700,color:TEAL_D,width:42,flex:'none'}}>{e.all_day ? '終日' : hm(new Date(e.starts_at))}</span>
          <span style={{fontSize:13,color:'#2c3a37',flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.title}</span>
        </div>
      ))}
      {user && evs && evs.length > 3 && <div style={{padding:'8px 14px 11px',fontSize:11.5,color:'#8a9491'}}>ほか {evs.length-3} 件</div>}
    </Card>
  );
}

/* いつもの路線（ベータ版はサンプル表示） */
const LINE_SAMPLES = [
  {name:'○○線', color:'#5b9bd8', status:'delay', text:'約10分の遅れ', detail:'○○駅での車両点検の影響'},
  {name:'△△線', color:'#7cc35c', status:'ok', text:'遅延情報はありません', detail:''},
];
function LineRow({l, first}) {
  const delay = l.status === 'delay';
  return (
    <div className="row" style={{gap:11,padding:'11px 14px',borderTop:first?'1px solid #f0f2f1':'1px solid #f0f2f1',alignItems:'flex-start'}}>
      <span style={{width:4,height:delay?34:18,borderRadius:2,background:l.color,flex:'none',marginTop:1}}/>
      <div style={{flex:1,minWidth:0}}>
        <div className="row" style={{justifyContent:'space-between',gap:8}}>
          <span style={{fontSize:13.5,fontWeight:700,color:INK}}>{l.name}</span>
          <span className="row" style={{gap:4,fontSize:12,fontWeight:700,color:delay?'#c9603c':'#5f8f6e',whiteSpace:'nowrap'}}>
            <Icon n={delay?'schedule':'check_circle'} s={16} c={delay?'#c9603c':'#7cc35c'}/>{l.text}
          </span>
        </div>
        {l.detail && <div style={{fontSize:11.5,color:SUB,marginTop:3}}>{l.detail}</div>}
      </div>
    </div>
  );
}
function MyLines() {
  return (
    <Card>
      <div className="row" style={{padding:'10px 14px',justifyContent:'space-between'}}>
        <div className="row" style={{gap:7}}><Icon n="directions_transit" s={19} c="#a58fd8"/><span style={{fontSize:13,fontWeight:700,color:INK}}>いつもの路線</span><SampleBadge label="表示例"/></div>
        <div onClick={()=>go('transit')} className="row" style={{gap:1,cursor:'pointer'}}><span style={{fontSize:12,fontWeight:700,color:TEAL_D}}>交通</span><Icon n="chevron_right" s={17} c={TEAL_D}/></div>
      </div>
      {LINE_SAMPLES.map(l => <LineRow key={l.name} l={l}/>)}
    </Card>
  );
}

function Home({region, weather, sub, setSub, user}) {
  const tabs = [['today','今日の情報'],['machi','まち情報']];
  const w = weather;
  return (
    <>
      <div style={{padding:'var(--top) 18px 0',background:'#fff',boxShadow:'0 1px 0 rgba(0,0,0,.06)',flex:'none'}}>
        <div className="row" style={{justifyContent:'space-between',height:40}}>
          <div style={{width:24}}/>
          <div className="row" style={{gap:7}}><Logo/><span style={{fontSize:19,fontWeight:900,letterSpacing:'.14em',color:INK}}>YOKA</span></div>
          <div onClick={()=>go('my')} style={{cursor:'pointer'}}><Icon n="account_circle" s={24}/></div>
        </div>
        <div className="row" style={{justifyContent:'space-between',padding:'10px 0 12px',gap:8}}>
          <div onClick={()=>go('region')} className="row" style={{gap:4,cursor:'pointer',minHeight:32,minWidth:0}}>
            <Icon n="location_on" s={19} c={TEAL}/>
            <span style={{fontSize:15,fontWeight:700,color:INK,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{region ? region.name : '地域を選択'}</span>
            <Icon n="expand_more" s={18} c={GREY}/>
          </div>
          <div className="row" style={{gap:7,fontSize:12.5,color:SUB,flex:'none'}}>
            <span>{todayLabel()}</span>
          </div>
        </div>
        <div style={{display:'flex',gap:22}}>
          {tabs.map(([id,label])=>(
            <div key={id} onClick={()=>setSub(id)} style={{paddingBottom:10,fontSize:13.5,cursor:'pointer',fontWeight:sub===id?700:400,
              color:sub===id?TEAL_D:'#8a9491',borderBottom:`2.5px solid ${sub===id?TEAL:'transparent'}`}}>{label}</div>
          ))}
        </div>
      </div>
      <Scroll>
        {sub === 'today' && (
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            {!region && <NeedRegion/>}
            <WeatherCard region={region} w={w}/>
            <Card onClick={()=>go('hazard')} style={{padding:'12px 14px'}}>
              <div className="row" style={{gap:12}}>
                <div style={{width:40,height:40,borderRadius:10,background:'#fdf0ea',display:'flex',alignItems:'center',justifyContent:'center',flex:'none'}}><Icon n="warning" s={22} c="#e8836a"/></div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13.5,fontWeight:700,color:INK}}>ハザードマップ</div>
                  <div style={{fontSize:11.5,color:'#8a9491',marginTop:2}}>洪水・土砂災害・津波などのリスクを確認</div>
                </div>
                <Icon n="chevron_right" s={20} c="#c3cbc9"/>
              </div>
            </Card>
            <TodayEvents user={user}/>
            <MyLines/>
            <Card style={{padding:14}}>
              <div style={{fontSize:13,fontWeight:700,color:INK,marginBottom:8}}>自治体からのお知らせ</div>
              <div style={{fontSize:12.5,color:SUB,lineHeight:1.7}}>今後、自治体のお知らせを確認できる機能を追加していく予定です。</div>
            </Card>
            <AdSlot/>
          </div>
        )}
        {sub === 'machi' && (
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div style={{fontSize:12.5,color:SUB,lineHeight:1.7}}>地域のカフェ・居酒屋・美容室・個人商店などが、お得情報やイベントを発信する場所です。現在は掲載イメージのサンプルを表示しています。</div>
            {MACHI_SAMPLES.map((m,i)=>(
              <Card key={i} style={{padding:13,display:'flex',gap:12}}>
                <Ph label="写真" w={64} h={64}/>
                <div style={{flex:1,minWidth:0}}>
                  <div className="row" style={{gap:6,flexWrap:'wrap'}}>
                    <SampleBadge/>
                    <span style={{fontSize:10,fontWeight:700,padding:'2px 6px',borderRadius:4,background:'#fdf0ea',color:'#c9603c'}}>{m.cat}</span>
                    <span style={{fontSize:10.5,color:'#9aa5a2'}}>{m.date}</span>
                  </div>
                  <div style={{fontSize:11.5,color:SUB,marginTop:6}}>{m.shop}</div>
                  <div style={{fontSize:13.5,fontWeight:700,color:INK,marginTop:2}}>{m.title}</div>
                  <div style={{fontSize:11.5,color:SUB,marginTop:3,lineHeight:1.5}}>{m.body}</div>
                </div>
              </Card>
            ))}
            <Card style={{padding:14,display:'flex',flexDirection:'column',gap:10}}>
              <div style={{fontSize:13,fontWeight:700,color:INK}}>お店の情報を掲載しませんか？</div>
              <div style={{fontSize:12.5,color:SUB,lineHeight:1.7}}>まち情報への掲載をご希望の店舗さまは、こちらからお問い合わせください。</div>
              <Btn kind="ghost" onClick={()=>go('partner?type=shop')}>掲載について問い合わせる</Btn>
            </Card>
          </div>
        )}
      </Scroll>
    </>
  );
}

/* ── 天気の詳細（週間予報・出典） ── */
const dLabel = (s) => { const d = new Date(s); return `${d.getMonth()+1}/${d.getDate()}`; };
const dow = (s) => { const d = new Date(s); return '日月火水木金土'[d.getDay()]; };
const dowCol = (s) => { const n = new Date(s).getDay(); return n === 0 ? '#d1657a' : n === 6 ? '#5b9bd8' : INK; };
function WeatherDetail({region, w}) {
  const d = w.status === 'ok' ? w.d : null;
  const rel = {A:'信頼度 高', B:'信頼度 中', C:'信頼度 低'};
  return (
    <>
      <PageHead title="天気予報" onBack={back}/>
      <Scroll>
        {!region && <NeedRegion/>}
        {w.status === 'loading' && <div style={{fontSize:13,color:SUB}}>天気を取得しています…</div>}
        {w.status === 'error' && <Notice tone="error" icon="cloud_off">天気情報を取得できませんでした。時間をおいて再度お試しください。</Notice>}
        {d && (
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            <div style={{fontSize:12.5,color:SUB}}>{region.pref} {region.name}（{d.areaName}）</div>

            <Card>
              <div style={{padding:'11px 14px',background:'#e6f4f1',fontSize:13,fontWeight:700,color:TEAL_D}}>今日・明日の天気</div>
              {d.days.slice(0,3).map((x,i)=>{ const [ic,col] = WX(x.code); return (
                <div key={x.date} className="row" style={{gap:12,padding:'12px 14px',borderTop:i?'1px solid #f0f2f1':'none',alignItems:'flex-start'}}>
                  <div style={{width:44,flex:'none'}}>
                    <div style={{fontSize:13,fontWeight:700,color:dowCol(x.date)}}>{dLabel(x.date)}</div>
                    <div style={{fontSize:11,color:dowCol(x.date)}}>（{dow(x.date)}）</div>
                  </div>
                  <Icon n={ic} s={30} c={col}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,color:INK,lineHeight:1.5}}>{x.text}</div>
                    {x.wind && <div style={{fontSize:11,color:SUB,marginTop:3,lineHeight:1.5}}>{x.wind}</div>}
                  </div>
                </div>); })}
            </Card>

            {d.popBlocks.length > 0 && (
              <Card style={{padding:'12px 14px'}}>
                <div style={{fontSize:13,fontWeight:700,color:INK,marginBottom:10}}>降水確率（6時間ごと）</div>
                <div style={{display:'grid',gridTemplateColumns:`repeat(${Math.min(d.popBlocks.length,6)},minmax(0,1fr))`,gap:6}}>
                  {d.popBlocks.slice(0,6).map(p=>{ const h = new Date(p.time).getHours(); return (
                    <div key={p.time} style={{textAlign:'center',padding:'8px 2px',borderRadius:9,background:'#f2f7f6'}}>
                      <div style={{fontSize:10.5,color:SUB}}>{dLabel(p.time)}</div>
                      <div style={{fontSize:10.5,color:SUB}}>{h}〜{(h+6)%24}時</div>
                      <div style={{fontSize:15,fontWeight:700,color:'#3a7fc0',marginTop:3}}>{p.pop == null ? '—' : p.pop + '%'}</div>
                    </div>); })}
                </div>
              </Card>
            )}

            {d.weekly.length > 0 && (
              <Card>
                <div style={{padding:'11px 14px',fontSize:13,fontWeight:700,color:INK}}>週間天気予報</div>
                <div className="row" style={{padding:'6px 14px',borderTop:'1px solid #f0f2f1',fontSize:10.5,color:'#8a9491'}}>
                  <span style={{width:52}}>日付</span><span style={{width:36}}></span>
                  <span style={{flex:1,textAlign:'center'}}>最高／最低</span><span style={{width:56,textAlign:'right'}}>降水</span>
                </div>
                {d.weekly.map(x=>{ const [ic,col] = WX(x.code); return (
                  <div key={x.date} className="row" style={{padding:'10px 14px',borderTop:'1px solid #f0f2f1'}}>
                    <div style={{width:52}}>
                      <span style={{fontSize:13,fontWeight:700,color:dowCol(x.date)}}>{dLabel(x.date)}</span>
                      <span style={{fontSize:11,color:dowCol(x.date)}}>（{dow(x.date)}）</span>
                    </div>
                    <div style={{width:36}}><Icon n={ic} s={24} c={col}/></div>
                    <div style={{flex:1,textAlign:'center',fontSize:13.5}}>
                      <b style={{color:'#d1657a'}}>{x.max == null ? '—' : x.max + '°'}</b>
                      <span style={{color:'#c3cbc9'}}> ／ </span>
                      <b style={{color:'#5b9bd8'}}>{x.min == null ? '—' : x.min + '°'}</b>
                    </div>
                    <div style={{width:56,textAlign:'right'}}>
                      <div style={{fontSize:13,fontWeight:700,color:INK}}>{x.pop == null ? '—' : x.pop + '%'}</div>
                      {rel[x.rel] && <div style={{fontSize:9.5,color:'#9aa5a2'}}>{rel[x.rel]}</div>}
                    </div>
                  </div>); })}
              </Card>
            )}

            <div style={{padding:'4px 4px 0',display:'flex',flexDirection:'column',gap:6,fontSize:11,color:'#8a9491',lineHeight:1.75}}>
              <div style={{fontWeight:700,color:SUB}}>出典</div>
              <div>気象庁「天気予報」「週間天気予報」（{d.office}発表）、「アメダス」の観測値を加工して作成</div>
              <div>発表：{new Date(d.reportTime).getMonth()+1}月{new Date(d.reportTime).getDate()}日 {hm(new Date(d.reportTime))}　観測：{hm(new Date(d.time))}{d.nowPoint ? `（${d.nowPoint}）` : ''}</div>
              {(d.tPoint || d.wPoint) && <div>最高・最低気温は予報地点「{d.tPoint || d.wPoint}」の値です</div>}
              <a href="https://www.jma.go.jp/bosai/forecast/" target="_blank" rel="noopener" style={{fontWeight:700}}>気象庁の天気予報ページを開く</a>
            </div>
          </div>
        )}
      </Scroll>
    </>
  );
}

/* ── Leaflet 地図 ── */
const GSI_ATTR = '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank">地理院タイル</a>';
function LeafletMap({lat, lon, zoom=14, overlay, markers, onMarker}) {
  const el = useRef(), map = useRef(), ov = useRef(), mk = useRef();
  useEffect(() => {
    const m = L.map(el.current, {zoomControl:true}).setView([lat, lon], zoom);
    L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png', {maxZoom:18, attribution:GSI_ATTR}).addTo(m);
    mk.current = L.layerGroup().addTo(m); map.current = m;
    setTimeout(() => m.invalidateSize(), 80);
    return () => m.remove();
  }, []);
  useEffect(() => { map.current && map.current.setView([lat, lon], zoom); }, [lat, lon]);
  useEffect(() => {
    if (!map.current) return;
    if (ov.current) { map.current.removeLayer(ov.current); ov.current = null; }
    if (overlay) ov.current = L.tileLayer(overlay.url, {opacity:.72, maxNativeZoom:17, maxZoom:18, attribution:overlay.attr}).addTo(map.current);
  }, [overlay && overlay.url]);
  useEffect(() => {
    if (!mk.current) return;
    mk.current.clearLayers();
    (markers || []).forEach(p => L.circleMarker([p.lat, p.lon], {radius:8, color:'#fff', weight:2, fillColor:p.color, fillOpacity:1})
      .on('click', () => onMarker && onMarker(p)).addTo(mk.current));
  }, [markers]);
  return <div ref={el} style={{position:'absolute',inset:0}}/>;
}

const FAC = {
  townhall:['役所','#a58fd8'], hospital:['病院','#ea6f86'], clinic:['診療所','#ea6f86'], library:['図書館','#5b9bd8'],
  police:['警察','#3d5a80'], fire_station:['消防署','#e8836a'], community_centre:['公民館・集会所','#7cc35c'],
  school:['学校','#f0a83a'], post_office:['郵便局','#c9603c'],
};
const FAC_GROUPS = [['all','すべて'],['townhall','役所'],['hospital','病院'],['school','学校'],['library','図書館'],['community_centre','公民館']];

function AreaMap({region}) {
  const [st, setSt] = useState({status:'loading', items:[]});
  const [filter, setFilter] = useState('all');
  const [sel, setSel] = useState(null);
  useEffect(() => {
    if (!region || region.lat == null) return;
    let alive = true; setSt({status:'loading', items:[]}); setSel(null);
    Y.facilities(region.lat, region.lon, 2500).then(items => alive && setSt({status:'ok', items})).catch(() => alive && setSt({status:'error', items:[]}));
    return () => { alive = false; };
  }, [region && region.code]);
  const markers = useMemo(() => st.items.filter(p => filter === 'all' || p.type === filter || (filter === 'hospital' && p.type === 'clinic'))
    .map(p => ({...p, color:(FAC[p.type] || ['', '#888'])[1]})), [st.items, filter]);
  if (!region) return <NeedRegion/>;
  if (region.lat == null) return <Notice tone="error">この地域の位置情報を取得できませんでした。地域を選び直してください。</Notice>;
  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>
        {FAC_GROUPS.map(([id,l])=>(
          <div key={id} onClick={()=>setFilter(id)} style={{padding:'7px 12px',borderRadius:999,fontSize:12,fontWeight:700,cursor:'pointer',
            background:filter===id?TEAL:'#fff',color:filter===id?'#fff':'#4a5754',border:`1px solid ${filter===id?TEAL:'#e3e8e6'}`}}>{l}</div>
        ))}
      </div>
      <Card style={{position:'relative',height:360}}>
        <LeafletMap lat={region.lat} lon={region.lon} zoom={14} markers={markers} onMarker={setSel}/>
      </Card>
      <div style={{fontSize:11.5,color:SUB}}>
        {st.status==='loading' && '施設情報を読み込んでいます…'}
        {st.status==='ok' && `中心から約2.5km以内の公共施設 ${markers.length}件`}
        {st.status==='error' && '施設情報を取得できませんでした（地図は表示できます）'}
      </div>
      {sel && (
        <Card className="fade" style={{padding:14}}>
          <div className="row" style={{gap:8,justifyContent:'space-between'}}>
            <span style={{fontSize:15,fontWeight:700,color:INK}}>{sel.name}</span>
            <span style={{fontSize:10.5,fontWeight:700,padding:'2px 7px',borderRadius:4,background:'#eef1f0',color:'#4a5754',whiteSpace:'nowrap'}}>{(FAC[sel.type]||['施設'])[0]}</span>
          </div>
          {sel.addr && <div style={{fontSize:12.5,color:SUB,marginTop:6}}>{sel.addr}</div>}
          {sel.hours && <div style={{fontSize:12.5,color:SUB,marginTop:4}}>営業・開館時間：{sel.hours}</div>}
          {sel.phone && <div style={{fontSize:12.5,color:SUB,marginTop:4}}>電話：{sel.phone}</div>}
          <div className="row" style={{gap:14,marginTop:10}}>
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${sel.lat},${sel.lon}`} target="_blank" rel="noopener" style={{fontSize:12.5,fontWeight:700}}>道順を調べる</a>
            <a href={sel.url} target="_blank" rel="noopener" style={{fontSize:12.5,fontWeight:700}}>OpenStreetMapで見る</a>
          </div>
        </Card>
      )}
      <div style={{fontSize:10.5,color:'#9aa5a2',lineHeight:1.7}}>
        地図：国土地理院（地理院タイル）／施設情報：© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>。施設情報は利用者の投稿によるもので、最新でない場合があります。
      </div>
    </div>
  );
}

const HZ_ATTR = '<a href="https://disaportal.gsi.go.jp/hazardmapportal/hazardmap/copyright/opendata.html" target="_blank">ハザードマップポータルサイト</a>';
const HAZARDS = [
  {id:'flood', label:'洪水', title:'洪水浸水想定区域（想定最大規模）', url:'https://disaportaldata.gsi.go.jp/raster/01_flood_l2_shinsuishin_data/{z}/{x}/{y}.png',
   legend:'https://disaportal.gsi.go.jp/hazardmap/copyright/img/shinsui_legend2-1.png', since:'提供開始 令和2年3月17日（随時更新）'},
  {id:'doseki', label:'土石流', title:'土砂災害警戒区域（土石流）', url:'https://disaportaldata.gsi.go.jp/raster/05_dosekiryukeikaikuiki/{z}/{x}/{y}.png'},
  {id:'kyukei', label:'急傾斜地', title:'土砂災害警戒区域（急傾斜地の崩壊）', url:'https://disaportaldata.gsi.go.jp/raster/05_kyukeishakeikaikuiki/{z}/{x}/{y}.png'},
  {id:'jisuberi', label:'地すべり', title:'土砂災害警戒区域（地すべり）', url:'https://disaportaldata.gsi.go.jp/raster/05_jisuberikeikaikuiki/{z}/{x}/{y}.png'},
  {id:'tsunami', label:'津波', title:'津波浸水想定', url:'https://disaportaldata.gsi.go.jp/raster/04_tsunami_newlegend_data/{z}/{x}/{y}.png'},
  {id:'takashio', label:'高潮', title:'高潮浸水想定区域', url:'https://disaportaldata.gsi.go.jp/raster/03_hightide_l2_shinsuishin_data/{z}/{x}/{y}.png'},
];

function HazardMap({region}) {
  const [hz, setHz] = useState('flood');
  const H = HAZARDS.find(h => h.id === hz);
  if (!region) return <NeedRegion/>;
  if (region.lat == null) return <Notice tone="error">この地域の位置情報を取得できませんでした。地域を選び直してください。</Notice>;
  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>
        {HAZARDS.map(h=>(
          <div key={h.id} onClick={()=>setHz(h.id)} style={{padding:'7px 12px',borderRadius:999,fontSize:12,fontWeight:700,cursor:'pointer',
            background:hz===h.id?'#c9603c':'#fff',color:hz===h.id?'#fff':'#4a5754',border:`1px solid ${hz===h.id?'#c9603c':'#e3e8e6'}`}}>{h.label}</div>
        ))}
      </div>
      <Card style={{position:'relative',height:360}}>
        <LeafletMap lat={region.lat} lon={region.lon} zoom={14} overlay={{url:H.url, attr:HZ_ATTR}}/>
      </Card>
      <Card style={{padding:14,display:'flex',flexDirection:'column',gap:10}}>
        <div style={{fontSize:13.5,fontWeight:700,color:INK}}>{H.title}</div>
        {H.legend
          ? <img src={H.legend} alt="凡例（浸水深）" style={{maxWidth:'100%',height:'auto',alignSelf:'flex-start'}}/>
          : <a href="https://disaportal.gsi.go.jp/hazardmapportal/hazardmap/copyright/opendata.html" target="_blank" rel="noopener" style={{fontSize:12.5,fontWeight:700}}>凡例を公式サイトで確認する</a>}
        <div style={{fontSize:11.5,color:SUB}}>出典：国土交通省 ハザードマップポータルサイト（{H.since || 'データの作成時点は区域ごとに異なります'}）</div>
      </Card>
      <Notice tone="warn" icon="warning">
        色が付いていない場所も安全とは限りません。調査・公表されていない区域や、データが未整備の地域があります。最新の情報は自治体の公式ハザードマップで確認し、避難は自治体の避難情報に従ってください。
      </Notice>
      <Card>
        <div style={{padding:'12px 14px',fontSize:13,fontWeight:700,color:INK}}>公式の防災情報</div>
        <ExtLink href="https://disaportal.gsi.go.jp/">ハザードマップポータルサイト（国土交通省）</ExtLink>
        <ExtLink href="https://disaportal.gsi.go.jp/maps/">重ねるハザードマップ</ExtLink>
        <ExtLink href="https://www.jma.go.jp/bosai/risk/">キキクル（気象庁 危険度分布）</ExtLink>
        <ExtLink href="https://hinanmap.gsi.go.jp/">指定緊急避難場所データ（国土地理院）</ExtLink>
      </Card>
    </div>
  );
}

const FLYER_SAMPLES = [
  {shop:'○○スーパー（サンプル）', note:'本日の特売・掲載イメージ', badge:'徒歩5分'},
  {shop:'△△ストア（サンプル）', note:'週末セール・掲載イメージ', badge:'徒歩12分'},
];

function MapTab({region, q}) {
  const [view, setView] = useState(q.view === 'shops' ? 'shops' : 'flyer');
  useEffect(() => { if (q.view) setView(q.view === 'shops' ? 'shops' : 'flyer'); }, [q.view]);
  const views = [['flyer','チラシ'],['shops','お店マップ']];
  return (
    <>
      <PageHead title="チラシ・マップ">
        <div style={{display:'flex',gap:6,padding:4,background:'#eef1f0',borderRadius:10}}>
          {views.map(([id,label])=>(
            <div key={id} onClick={()=>setView(id)} style={{flex:1,textAlign:'center',padding:7,borderRadius:8,fontSize:13,fontWeight:700,cursor:'pointer',
              background:view===id?'#fff':'transparent',color:view===id?TEAL_D:'#8a9491'}}>{label}</div>
          ))}
        </div>
      </PageHead>
      <Scroll>
        {view === 'flyer' && (
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <Notice>YOKAでは、地域のスーパーやお店のお得な情報を地図上で確認できるサービスを準備しています。</Notice>
            {FLYER_SAMPLES.map((f,i)=>(
              <Card key={i} style={{padding:12,display:'flex',gap:12,alignItems:'center'}}>
                <div style={{flex:1,minWidth:0}}>
                  <div className="row" style={{gap:6}}><SampleBadge/></div>
                  <div style={{fontSize:13.5,fontWeight:700,color:INK,marginTop:6}}>{f.shop}</div>
                  <div style={{fontSize:11.5,color:SUB,marginTop:3}}>{f.note}</div>
                  <div style={{display:'inline-block',marginTop:8,padding:'3px 8px',borderRadius:5,background:'#fdf0ea',fontSize:10.5,fontWeight:700,color:'#c9603c'}}>{f.badge}</div>
                </div>
                <Ph label="チラシ画像（サンプル）" w={96} h={74} r={9}/>
              </Card>
            ))}
            <Card style={{padding:14,display:'flex',flexDirection:'column',gap:10}}>
              <div style={{fontSize:12.5,color:'#2c3a37',lineHeight:1.7}}>チラシ・お得情報の掲載をご希望の店舗さまは、こちらからお問い合わせください。</div>
              <Btn kind="ghost" onClick={()=>go('partner?type=store')}>掲載について問い合わせる</Btn>
            </Card>
          </div>
        )}
        {view === 'shops' && <ShopMap region={region}/>}
      </Scroll>
    </>
  );
}

/* お店マップ（ベータ版はサンプル店舗。位置は地域の中心から仮に配置） */
const SHOP_SAMPLES = [
  {id:'s1', name:'○○スーパー（サンプル）', cat:'スーパー', dlat:.004, dlon:-.005, color:'#e8836a', flyer:true, note:'本日の特売チラシあり'},
  {id:'s2', name:'△△ストア（サンプル）', cat:'スーパー', dlat:-.006, dlon:.004, color:'#e8836a', flyer:true, note:'週末セールチラシあり'},
  {id:'s3', name:'まちのカフェ（サンプル）', cat:'カフェ', dlat:.002, dlon:.006, color:'#f0a83a', note:'平日15時からのケーキセット'},
  {id:'s4', name:'商店街の美容室（サンプル）', cat:'美容室', dlat:-.002, dlon:-.007, color:'#ea6f86', note:'はじめての方へ カット相談会'},
];
const fmtKm = (k) => k < 1 ? `${Math.round(k * 1000 / 10) * 10}m` : `${k.toFixed(1)}km`;
function todayInfo(days) {
  const d = days[new Date().getDay()];
  if (!d || d.status === 'unset') return { t:'営業時間の情報なし', c:GREY };
  if (d.status === 'closed') return { t:'本日定休日', c:'#c9603c' };
  return { t:'本日 ' + window.YOKA_STORES.dayText(d), c:TEAL_D || TEAL };
}
function StoreSheet({s, onClose}) {
  const SY = window.YOKA_STORES, r = SY.routeUrls(s), today = new Date().getDay();
  const [pi, setPi] = useState(0);
  return (
    <div style={{position:'absolute',inset:0,zIndex:1200,background:'rgba(20,24,23,.42)',display:'flex',alignItems:'flex-end'}} onClick={onClose}>
      <div className="fade" onClick={e=>e.stopPropagation()} style={{background:'#fff',width:'100%',borderRadius:'20px 20px 0 0',maxHeight:'90%',overflow:'auto',paddingBottom:'var(--bot)'}}>
        {s.photos.length > 0 && (
          <div style={{position:'relative',aspectRatio:'16/10',background:'#eef1f0'}}>
            <img src={s.photos[pi].url} alt={s.photos[pi].alt || s.name} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
            {s.photos.length > 1 && <div className="row" style={{position:'absolute',bottom:10,left:0,right:0,justifyContent:'center',gap:6}}>
              {s.photos.map((p,i)=><div key={i} onClick={()=>setPi(i)} style={{width:i===pi?20:8,height:8,borderRadius:4,background:i===pi?'#fff':'rgba(255,255,255,.6)',cursor:'pointer'}}/>)}
            </div>}
          </div>
        )}
        <div style={{padding:'16px 16px 18px',display:'flex',flexDirection:'column',gap:14}}>
          <div className="row" style={{justifyContent:'space-between',alignItems:'flex-start',gap:10}}>
            <div style={{minWidth:0}}>
              {s.category && <span style={{fontSize:11,fontWeight:700,padding:'2px 7px',borderRadius:4,background:'#e6f4f1',color:TEAL}}>{s.category}</span>}
              <div style={{fontSize:18,fontWeight:700,color:INK,marginTop:6}}>{s.name}</div>
              <div style={{fontSize:12.5,color:SUB,marginTop:4}}>{s.municipality}{s.address}{s.km != null ? `・${fmtKm(s.km)}` : ''}</div>
            </div>
            <div onClick={onClose} style={{cursor:'pointer',flexShrink:0}}><Icon n="close" s={24}/></div>
          </div>
          {s.description && <div style={{fontSize:13.5,color:'#2c3a37',lineHeight:1.75,whiteSpace:'pre-wrap'}}>{s.description}</div>}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            <a href={r.google} target="_blank" rel="noopener" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,height:48,borderRadius:12,background:TEAL,color:'#fff',fontWeight:700,fontSize:14}}><Icon n="directions" s={20} c="#fff"/>Googleマップ</a>
            <a href={r.apple} target="_blank" rel="noopener" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,height:48,borderRadius:12,background:'#fff',border:`1.5px solid ${TEAL}`,color:TEAL,fontWeight:700,fontSize:14}}><Icon n="directions" s={20} c={TEAL}/>Appleマップ</a>
          </div>
          <div style={{fontSize:11.5,color:GREY,marginTop:-8,textAlign:'center'}}>ここへ行く：地図アプリで経路を開きます</div>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:INK,marginBottom:8}}>営業時間</div>
            <div style={{border:'1px solid #e3e8e6',borderRadius:12,overflow:'hidden'}}>
              {SY.DAYS.map((d,i)=>{ const v = s.days[d.k], cur = d.k === today; return (
                <div key={d.k} className="row" style={{padding:'9px 12px',gap:12,borderTop:i?'1px solid #eef1f0':0,background:cur?'#f1f8f6':'#fff'}}>
                  <span style={{width:34,fontSize:13,fontWeight:cur?700:500,color:INK}}>{d.l}</span>
                  <span style={{fontSize:13,fontWeight:cur?700:400,color:v.status==='closed'?'#c9603c':v.status==='unset'?GREY:INK}}>{SY.dayText(v)}</span>
                </div>); })}
            </div>
            {s.hours_note && <div style={{fontSize:12.5,color:SUB,marginTop:8,lineHeight:1.6}}>{s.hours_note}</div>}
          </div>
          {s.verified_at && <div style={{fontSize:11.5,color:GREY}}>情報の最終確認日：{s.verified_at.slice(0,10).replace(/-/g,'/')}</div>}
        </div>
      </div>
    </div>
  );
}
function ShopMap({region}) {
  const [sel, setSel] = useState(null);
  const [cat, setCat] = useState('all');
  const [real, setReal] = useState(null);
  const [loadErr, setLoadErr] = useState('');
  const [me, setMe] = useState(null);
  useEffect(() => {
    if (!region || region.lat == null || !window.YOKA_STORES || !Y.sb) { setReal([]); return; }
    let alive = true; setReal(null); setLoadErr('');
    window.YOKA_STORES.listPublished(region.lat, region.lon).then(r => alive && setReal(r)).catch(e => { if (alive) { setLoadErr(e.message || ''); setReal([]); } });
    return () => { alive = false; };
  }, [region && region.code]);
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(p => setMe({lat:p.coords.latitude, lon:p.coords.longitude}), () => {}, {maximumAge:300000, timeout:8000});
  }, []);
  if (!region) return <NeedRegion/>;
  if (region.lat == null) return <Notice tone="error">この地域の位置情報を取得できませんでした。地域を選び直してください。</Notice>;
  if (real === null) return <Notice>お店を読み込み中…</Notice>;
  if (loadErr) return <Notice tone="error">お店の情報を読み込めませんでした。時間をおいて開き直してください。（{loadErr}）</Notice>;
  if (real.length) {
    const SY = window.YOKA_STORES, base = me || {lat:region.lat, lon:region.lon};
    const list = real.map(s => ({...s, km: SY.distKm(base.lat, base.lon, s.latitude, s.longitude), lat:s.latitude, lon:s.longitude, color:'#e8836a'})).sort((a,b)=>a.km-b.km);
    const cs = [...new Set(list.map(s => s.category).filter(Boolean))];
    const shown = list.filter(s => cat === 'all' || s.category === cat);
    return (
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        {cs.length > 1 && <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>
          {[['all','すべて'], ...cs.map(c=>[c,c])].map(([id,l])=>(
            <div key={id} onClick={()=>setCat(id)} style={{padding:'7px 12px',borderRadius:999,fontSize:12,fontWeight:700,cursor:'pointer',
              background:cat===id?TEAL:'#fff',color:cat===id?'#fff':'#4a5754',border:`1px solid ${cat===id?TEAL:'#e3e8e6'}`}}>{l}</div>
          ))}
        </div>}
        <Card style={{position:'relative',height:300}}>
          <LeafletMap lat={region.lat} lon={region.lon} zoom={14} markers={shown} onMarker={setSel}/>
        </Card>
        <div className="row" style={{justifyContent:'space-between'}}>
          <span style={{fontSize:13.5,fontWeight:700,color:INK}}>周辺のお店 {shown.length}件</span>
          <span style={{fontSize:11.5,color:GREY}}>{me ? '現在地から近い順' : `${region.name}の中心から近い順`}</span>
        </div>
        {shown.map(s => { const t = todayInfo(s.days); return (
          <Card key={s.id} onClick={()=>setSel(s)} style={{padding:12,display:'flex',gap:12,cursor:'pointer'}}>
            {s.photos[0] ? <img src={s.photos[0].url} alt="" style={{width:64,height:64,borderRadius:10,objectFit:'cover',flexShrink:0}}/> : <Ph label="写真" w={64} h={64}/>}
            <div style={{flex:1,minWidth:0}}>
              <div className="row" style={{gap:6}}>
                {s.category && <span style={{fontSize:10,fontWeight:700,padding:'2px 6px',borderRadius:4,background:'#fdf0ea',color:'#c9603c'}}>{s.category}</span>}
                <span style={{fontSize:11.5,color:SUB}}>{fmtKm(s.km)}</span>
              </div>
              <div style={{fontSize:14.5,fontWeight:700,color:INK,marginTop:5}}>{s.name}</div>
              <div style={{fontSize:12,fontWeight:700,color:t.c,marginTop:3}}>{t.t}</div>
            </div>
            <Icon n="chevron_right" s={22} c={GREY}/>
          </Card>); })}
        <Card style={{padding:14,display:'flex',flexDirection:'column',gap:10}}>
          <div style={{fontSize:12.5,color:'#2c3a37',lineHeight:1.7}}>お店の掲載をご希望の店舗さまは、こちらからお問い合わせください。</div>
          <Btn kind="ghost" onClick={()=>go('partner?type=shop')}>掲載について問い合わせる</Btn>
        </Card>
        <div style={{fontSize:10.5,color:'#9aa5a2'}}>地図：国土地理院（地理院タイル）</div>
        {sel && <StoreSheet s={sel} onClose={()=>setSel(null)}/>}
      </div>
    );
  }
  return <ShopSamples region={region} sel={sel} setSel={setSel} cat={cat} setCat={setCat}/>;
}
function ShopSamples({region, sel, setSel, cat, setCat}) {
  if (region.lat == null) return <Notice tone="error">この地域の位置情報を取得できませんでした。地域を選び直してください。</Notice>;
  const cats = [['all','すべて'],['flyer','チラシあり'],['カフェ','カフェ'],['美容室','美容室']];
  const markers = SHOP_SAMPLES.filter(s => cat === 'all' || (cat === 'flyer' ? s.flyer : s.cat === cat))
    .map(s => ({...s, lat:region.lat + s.dlat, lon:region.lon + s.dlon}));
  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      <Notice>この地域にはまだ掲載店舗がありません。以下は掲載イメージで、地図上のお店はすべてサンプルです。</Notice>
      <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>
        {cats.map(([id,l])=>(
          <div key={id} onClick={()=>setCat(id)} style={{padding:'7px 12px',borderRadius:999,fontSize:12,fontWeight:700,cursor:'pointer',
            background:cat===id?TEAL:'#fff',color:cat===id?'#fff':'#4a5754',border:`1px solid ${cat===id?TEAL:'#e3e8e6'}`}}>{l}</div>
        ))}
      </div>
      <Card style={{position:'relative',height:340}}>
        <LeafletMap lat={region.lat} lon={region.lon} zoom={15} markers={markers} onMarker={setSel}/>
      </Card>
      {sel && (
        <Card className="fade" style={{padding:13,display:'flex',gap:12}}>
          <Ph label={sel.flyer ? 'チラシ' : '写真'} w={64} h={64}/>
          <div style={{flex:1,minWidth:0}}>
            <div className="row" style={{gap:6}}><SampleBadge/><span style={{fontSize:10,fontWeight:700,padding:'2px 6px',borderRadius:4,background:'#fdf0ea',color:'#c9603c'}}>{sel.cat}</span></div>
            <div style={{fontSize:14,fontWeight:700,color:INK,marginTop:6}}>{sel.name}</div>
            <div style={{fontSize:12,color:SUB,marginTop:3}}>{sel.note}</div>
          </div>
        </Card>
      )}
      <Card style={{padding:14,display:'flex',flexDirection:'column',gap:10}}>
        <div style={{fontSize:12.5,color:'#2c3a37',lineHeight:1.7}}>お店の掲載をご希望の店舗さまは、こちらからお問い合わせください。</div>
        <Btn kind="ghost" onClick={()=>go('partner?type=shop')}>掲載について問い合わせる</Btn>
      </Card>
      <div style={{fontSize:10.5,color:'#9aa5a2'}}>地図：国土地理院（地理院タイル）</div>
    </div>
  );
}

function HazardPage({region}) {
  return (
    <>
      <PageHead title="ハザードマップ" onBack={back}/>
      <Scroll><HazardMap region={region}/></Scroll>
    </>
  );
}

/* ── カレンダー ── */
function EventEditor({date, ev, onClose, onSaved}) {
  const s0 = ev ? new Date(ev.starts_at) : null, e0 = ev ? new Date(ev.ends_at) : null;
  const [f, setF] = useState({
    title: ev ? ev.title : '', note: ev ? (ev.note || '') : '', all_day: ev ? ev.all_day : false,
    sd: s0 ? ymd(s0) : date, st: s0 ? hm(s0) : '10:00', ed: e0 ? ymd(e0) : date, et: e0 ? hm(e0) : '11:00'
  });
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value});
  const save = async () => {
    if (!f.title.trim()) return setErr('タイトルを入力してください');
    const s = new Date(`${f.sd}T${f.all_day ? '00:00' : f.st}`), e = new Date(`${f.ed}T${f.all_day ? '23:59' : f.et}`);
    if (isNaN(s) || isNaN(e)) return setErr('日時を正しく入力してください');
    if (e < s) return setErr('終了は開始より後にしてください');
    setBusy(true); setErr('');
    try { await Y.events.save({id: ev && ev.id, title: f.title.trim().slice(0,100), note: f.note.slice(0,1000), all_day: f.all_day, starts_at: s.toISOString(), ends_at: e.toISOString()}); onSaved(); }
    catch (x) { setErr('保存できませんでした：' + (x.message || '')); setBusy(false); }
  };
  const del = async () => {
    if (!confirm('この予定を削除しますか？')) return;
    setBusy(true);
    try { await Y.events.remove(ev.id); onSaved(); } catch (x) { setErr('削除できませんでした'); setBusy(false); }
  };
  return (
    <div style={{position:'absolute',inset:0,zIndex:1200,background:'rgba(20,24,23,.42)',display:'flex',alignItems:'flex-end'}}>
      <div className="fade" style={{background:'#f4f6f5',width:'100%',borderRadius:'20px 20px 0 0',padding:'18px 16px var(--bot)',maxHeight:'88%',overflow:'auto',display:'flex',flexDirection:'column',gap:13}}>
        <div className="row" style={{justifyContent:'space-between'}}>
          <span style={{fontSize:16,fontWeight:700,color:INK}}>{ev ? '予定を編集' : '予定を追加'}</span>
          <div onClick={onClose} style={{cursor:'pointer'}}><Icon n="close" s={24}/></div>
        </div>
        <Field label="タイトル"><input style={inputStyle} value={f.title} onChange={set('title')} maxLength={100} placeholder="例：通院"/></Field>
        <label className="row" style={{gap:8,fontSize:14,color:INK}}><input type="checkbox" checked={f.all_day} onChange={set('all_day')} style={{width:20,height:20}}/>終日</label>
        <div style={{display:'grid',gridTemplateColumns:f.all_day?'1fr':'1.4fr 1fr',gap:8}}>
          <Field label="開始日"><input type="date" style={inputStyle} value={f.sd} onChange={set('sd')}/></Field>
          {!f.all_day && <Field label="開始時刻"><input type="time" style={inputStyle} value={f.st} onChange={set('st')}/></Field>}
          <Field label="終了日"><input type="date" style={inputStyle} value={f.ed} onChange={set('ed')}/></Field>
          {!f.all_day && <Field label="終了時刻"><input type="time" style={inputStyle} value={f.et} onChange={set('et')}/></Field>}
        </div>
        <Field label="メモ"><textarea style={{...inputStyle,minHeight:70,resize:'vertical'}} value={f.note} onChange={set('note')} maxLength={1000}/></Field>
        {err && <Notice tone="error">{err}</Notice>}
        <Btn onClick={save} disabled={busy}>保存する</Btn>
        {ev && <Btn kind="danger" onClick={del} disabled={busy}>削除する</Btn>}
      </div>
    </div>
  );
}

function Calendar({user}) {
  const now = new Date();
  const [ym, setYm] = useState([now.getFullYear(), now.getMonth()]);
  const [day, setDay] = useState(ymd(now));
  const [evs, setEvs] = useState([]); const [st, setSt] = useState('idle');
  const [edit, setEdit] = useState(null);
  const [y, m] = ym;
  const first = new Date(y, m, 1), last = new Date(y, m + 1, 0);
  const load = () => {
    if (!user || !Y.sb) { setEvs([]); return; }
    setSt('loading');
    Y.events.list(new Date(y, m, 1), new Date(y, m + 1, 1)).then(d => { setEvs(d); setSt('ok'); }).catch(() => setSt('error'));
  };
  useEffect(load, [y, m, user && user.id]);
  const onDay = (d) => evs.filter(e => { const s = ymd(new Date(e.starts_at)), en = ymd(new Date(e.ends_at)); return s <= d && en >= d; });
  const cells = []; for (let i = 0; i < first.getDay(); i++) cells.push(null);
  for (let d = 1; d <= last.getDate(); d++) cells.push(d);
  while (cells.length % 7) cells.push(null);
  const shift = (k) => { const d = new Date(y, m + k, 1); setYm([d.getFullYear(), d.getMonth()]); };
  const list = onDay(day);
  const dd = new Date(day + 'T00:00');
  return (
    <>
      <div style={{padding:'var(--top) 18px 12px',background:'#fff',boxShadow:'0 1px 0 rgba(0,0,0,.06)',flex:'none'}}>
        <div className="row" style={{justifyContent:'space-between',height:40}}>
          <div onClick={()=>shift(-1)} style={{cursor:'pointer',padding:6}}><Icon n="chevron_left" s={24} c={GREY}/></div>
          <span style={{fontSize:15,fontWeight:700,color:INK,whiteSpace:'nowrap'}}>{y}年{m+1}月</span>
          <div onClick={()=>shift(1)} style={{cursor:'pointer',padding:6}}><Icon n="chevron_right" s={24} c={GREY}/></div>
        </div>
      </div>
      <Scroll>
        <Card style={{padding:'12px 10px'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',marginBottom:6}}>
            {'日月火水木金土'.split('').map((d,i)=>(<div key={d} style={{textAlign:'center',fontSize:10.5,fontWeight:700,color:i===0?'#d1657a':i===6?'#5b9bd8':'#8a9491'}}>{d}</div>))}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)'}}>
            {cells.map((d,i)=>{
              if (!d) return <div key={i} style={{height:46}}/>;
              const key = `${y}-${pad2(m+1)}-${pad2(d)}`, sel = key === day, n = onDay(key).length, today = key === ymd(now), dow = i % 7;
              return (
                <div key={i} onClick={()=>setDay(key)} style={{height:46,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:3,cursor:'pointer',borderRadius:9,
                  background:sel?'#e6f4f1':'transparent',outline:today&&!sel?'1.5px solid #cfe0d9':'none',outlineOffset:-2}}>
                  <span style={{fontSize:13,fontWeight:sel?700:400,color:sel?TEAL_D:dow===0?'#d1657a':dow===6?'#5b9bd8':'#2c3a37'}}>{d}</span>
                  <div style={{display:'flex',gap:2,height:5}}>{Array.from({length:Math.min(n,3)}).map((_,k)=>(<span key={k} style={{width:5,height:5,borderRadius:'50%',background:TEAL}}/>))}</div>
                </div>
              );
            })}
          </div>
        </Card>
        <Card style={{marginTop:14}}>
          <div style={{padding:'12px 14px',fontSize:13,fontWeight:700,color:INK}}>{dd.getMonth()+1}月{dd.getDate()}日（{'日月火水木金土'[dd.getDay()]}）</div>
          {!user && (
            <div style={{padding:'0 14px 14px',display:'flex',flexDirection:'column',gap:10}}>
              <div style={{fontSize:12.5,color:SUB,lineHeight:1.7}}>予定の保存にはログインが必要です。</div>
              <Btn onClick={()=>go('login')}>ログインして予定を追加</Btn>
            </div>
          )}
          {user && st === 'error' && <div style={{padding:'0 14px 14px'}}><Notice tone="error">予定を読み込めませんでした。</Notice></div>}
          {user && list.length === 0 && st !== 'error' && <div style={{padding:'12px 14px',borderTop:'1px solid #f0f2f1',fontSize:13,color:'#8a9491'}}>予定はありません</div>}
          {user && list.map(e=>(
            <div key={e.id} onClick={()=>setEdit({ev:e})} className="row" style={{gap:11,padding:'12px 14px',borderTop:'1px solid #f0f2f1',cursor:'pointer'}}>
              <span style={{width:4,height:26,borderRadius:2,background:TEAL}}/>
              <span style={{fontSize:13,color:'#2c3a37',flex:1}}>{e.title}</span>
              <span style={{fontSize:11.5,color:'#8a9491'}}>{e.all_day ? '終日' : hm(new Date(e.starts_at)) + '〜'}</span>
            </div>
          ))}
          {user && (
            <div onClick={()=>setEdit({ev:null})} className="row" style={{justifyContent:'center',gap:5,padding:12,borderTop:'1px solid #f0f2f1',color:TEAL,cursor:'pointer'}}>
              <Icon n="add" s={18} c={TEAL}/><span style={{fontSize:12.5,fontWeight:700}}>予定を追加</span>
            </div>
          )}
        </Card>
        <div style={{marginTop:14}}><Notice icon="event_upcoming">今後、自治体のお知らせや地域イベントをカレンダーから確認できる機能を追加していく予定です。</Notice></div>
      </Scroll>
      {edit && <EventEditor date={day} ev={edit.ev} onClose={()=>setEdit(null)} onSaved={()=>{setEdit(null);load();}}/>}
    </>
  );
}

/* ── 交通 ── */
const TRANSIT_LINKS = {
  train:[['JR東日本','https://www.jreast.co.jp/'],['JR東海','https://jr-central.co.jp/'],['JR西日本','https://www.westjr.co.jp/'],
    ['JR北海道','https://www.jrhokkaido.co.jp/'],['JR四国','https://www.jr-shikoku.co.jp/'],['JR九州','https://www.jrkyushu.co.jp/']],
  bus:[],
  road:[['日本道路交通情報センター（JARTIC）','https://www.jartic.or.jp/'],['NEXCO東日本','https://www.e-nexco.co.jp/'],['NEXCO中日本','https://www.c-nexco.co.jp/'],['NEXCO西日本','https://www.w-nexco.co.jp/']],
};
function Transit() {
  const [line, setLine] = useState('train');
  const note = {train:'私鉄・地下鉄の運行情報は、各鉄道会社の公式サイトをご確認ください。', bus:'路線バスの運行情報は、各バス事業者・自治体の公式サイトをご確認ください。地域に合わせた事業者の表示は今後対応予定です。', road:'通行止め・規制情報は、以下の公式サイトをご確認ください。'}[line];
  return (
    <>
      <PageHead title="交通">
        <div style={{display:'flex',gap:8}}>
          {[['train','電車'],['bus','バス'],['road','道路']].map(([id,label])=>(
            <div key={id} onClick={()=>setLine(id)} style={{padding:'7px 18px',borderRadius:999,fontSize:12.5,fontWeight:700,cursor:'pointer',
              background:line===id?TEAL:'#eef1f0',color:line===id?'#fff':'#6b7674'}}>{label}</div>
          ))}
        </div>
      </PageHead>
      <Scroll>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <Notice icon="directions_transit">YOKAでは、鉄道・バスなどの交通情報を地域ごとに確認できる機能の実装を目指しています。</Notice>
          {line === 'train' && (
            <Card>
              <div className="row" style={{padding:'10px 14px',gap:7}}><span style={{fontSize:13,fontWeight:700,color:INK}}>いつもの路線</span><SampleBadge label="表示例"/></div>
              {LINE_SAMPLES.map(l => <LineRow key={l.name} l={l}/>)}
              <div style={{padding:'9px 14px 12px',borderTop:'1px solid #f0f2f1',fontSize:11,color:'#8a9491',lineHeight:1.6}}>ベータ版では表示例です。実際の運行情報ではありません。今後、よく使う路線を登録して遅延情報を確認できるようにする予定です。</div>
            </Card>
          )}
          <Card>
            <div style={{padding:'12px 14px',fontSize:12.5,color:SUB,lineHeight:1.7}}>{note}</div>
            {TRANSIT_LINKS[line].map(([l,h])=>(<ExtLink key={l} href={h}>{l}</ExtLink>))}
          </Card>
        </div>
      </Scroll>
    </>
  );
}

/* 都道府県ホイール（スクロールで選ぶ。中央の項目が選択中） */
const WH = 46;
function PrefWheel({prefs, value, onChange}) {
  const el = useRef(); const t = useRef();
  const idx0 = Math.max(0, prefs.findIndex(p => p.code === value));
  const [idx, setIdx] = useState(idx0);
  useEffect(() => { if (el.current) el.current.scrollTop = idx0 * WH; }, []);
  const onScroll = () => {
    const i = Math.min(prefs.length - 1, Math.max(0, Math.round(el.current.scrollTop / WH)));
    if (i !== idx) setIdx(i);
    clearTimeout(t.current);
    t.current = setTimeout(() => onChange(prefs[i].code), 80);
  };
  const jump = (i) => el.current.scrollTo({top: i * WH, behavior: 'smooth'});
  return (
    <div style={{position:'relative',height:WH*5}}>
      <div style={{position:'absolute',left:0,right:0,top:WH*2,height:WH,borderRadius:12,background:'#e6f4f1',pointerEvents:'none'}}/>
      <div ref={el} onScroll={onScroll} className="scroll" style={{position:'relative',height:'100%',overflowY:'auto',scrollSnapType:'y mandatory',
        WebkitMaskImage:'linear-gradient(transparent, #000 30%, #000 70%, transparent)',maskImage:'linear-gradient(transparent, #000 30%, #000 70%, transparent)'}}>
        <div style={{height:WH*2}}/>
        {prefs.map((p, i) => {
          const d = Math.abs(i - idx);
          return (
            <div key={p.code} onClick={() => jump(i)} style={{height:WH,display:'flex',alignItems:'center',justifyContent:'center',scrollSnapAlign:'center',cursor:'pointer',
              fontSize:d === 0 ? 22 : d === 1 ? 16 : 14, fontWeight:d === 0 ? 700 : 400, color:d === 0 ? TEAL_D : d === 1 ? '#4a5754' : '#9aa5a2',
              transition:'font-size .12s, color .12s'}}>{p.name}</div>
          );
        })}
        <div style={{height:WH*2}}/>
      </div>
    </div>
  );
}

/* ── 地域選択 ── */
function RegionPicker({setRegion, welcome}) {
  const [wheel, setWheel] = useState(() => { const r = Y.region.load(); return (r && r.code && r.code.slice(0,2)) || '13'; });
  const [q, setQ] = useState(''); const [pref, setPref] = useState(null);
  const [busy, setBusy] = useState(''); const [err, setErr] = useState('');
  const all = Y.munis(); const prefs = Y.prefectures();
  const results = q.trim() ? all.filter(m => (m.pref + m.name).includes(q.trim().replace(/\s/g,'')) || m.name.replace(/\s/g,'').includes(q.trim())).slice(0, 80)
    : pref ? all.filter(m => m.prefCode === pref) : null;
  const pick = async (m) => {
    setBusy(m.code); setErr('');
    let c = {lat:null, lon:null};
    try { c = await Y.geocode(m); } catch (e) {}
    await setRegion({code:m.code, pref:m.pref, name:m.name, lat:c.lat, lon:c.lon});
    setBusy('');
    if (c.lat == null) setErr('地域は保存しましたが、位置情報を取得できませんでした。天気・地図が表示できない場合があります。');
    else go('home');
  };
  const here = () => {
    if (!navigator.geolocation) return setErr('この端末では現在地を取得できません');
    setBusy('here'); setErr('');
    navigator.geolocation.getCurrentPosition(async p => {
      try { const r = await Y.reverse(p.coords.latitude, p.coords.longitude); await setRegion(r); go('home'); }
      catch (e) { setErr('現在地の市区町村を特定できませんでした'); }
      setBusy('');
    }, () => { setErr('現在地の利用が許可されませんでした'); setBusy(''); }, {timeout:10000});
  };
  if (!all.length) return (<><PageHead title="地域を選ぶ" onBack={back}/><Scroll><Notice tone="error">市区町村データを読み込めませんでした。通信状況を確認して再読み込みしてください。</Notice></Scroll></>);
  return (
    <>
      <PageHead title={welcome ? '地域の設定' : '地域を選ぶ'} onBack={pref && !q ? ()=>setPref(null) : (welcome ? null : back)}>
        <div className="row" style={{gap:8,padding:'0 12px',borderRadius:10,background:'#eef1f0'}}>
          <Icon n="search" s={19} c={GREY}/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="市区町村名で検索（例：大和市）" style={{...inputStyle,border:'none',background:'transparent',padding:'11px 0'}}/>
        </div>
      </PageHead>
      <Scroll>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {welcome && !q && !pref && (
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10,padding:'18px 8px 8px',textAlign:'center'}}>
              <div className="row" style={{gap:8}}><Logo/><span style={{fontSize:22,fontWeight:900,letterSpacing:'.14em',color:INK}}>YOKA</span></div>
              <div style={{fontSize:13,color:SUB}}>あなたと、まちをつなぐ。</div>
              <div style={{fontSize:16,fontWeight:700,color:INK,marginTop:10}}>まずはお住まいの地域を選んでください</div>
              <div style={{fontSize:12.5,color:SUB,lineHeight:1.7}}>選んだ地域の天気・地図・防災情報を表示します。あとから変更できます。</div>
            </div>
          )}
          {!q && !pref && <Btn kind="ghost" onClick={here} disabled={busy==='here'}><Icon n="my_location" s={19} c={TEAL_D}/>{busy==='here'?'取得中…':'現在地から設定する'}</Btn>}
          {err && <Notice tone="warn">{err}</Notice>}
          {!results && (
            <Card style={{padding:'14px 12px',display:'flex',flexDirection:'column',gap:14}}>
              <div style={{fontSize:12.5,fontWeight:700,color:'#3d4a47',textAlign:'center'}}>都道府県を選んでください</div>
              <PrefWheel prefs={prefs} value={wheel} onChange={setWheel}/>
              <Btn onClick={()=>setPref(wheel)}>{(prefs.find(p=>p.code===wheel)||{}).name}の市区町村を選ぶ<Icon n="chevron_right" s={19} c="#fff"/></Btn>
            </Card>
          )}
          {results && <Card>
            {results.length === 0 && <div style={{padding:14,fontSize:13,color:SUB}}>該当する市区町村がありません</div>}
            {results.map((m,i)=>(
              <div key={m.code} onClick={()=>pick(m)} className="row" style={{padding:'13px 14px',borderTop:i?'1px solid #f0f2f1':'none',cursor:'pointer',gap:8}}>
                <span style={{fontSize:14,color:INK,flex:1}}>{q ? m.pref + ' ' : ''}{m.name}</span>
                {busy === m.code ? <span style={{fontSize:11.5,color:SUB}}>設定中…</span> : <span style={{fontSize:10.5,color:'#aab3b0'}}>{m.code}</span>}
              </div>
            ))}
          </Card>}
          <div style={{fontSize:10.5,color:'#9aa5a2'}}>市区町村コード：国土地理院 地理院地図 市区町村コード表</div>
        </div>
      </Scroll>
    </>
  );
}

/* ── 認証画面 ── */
const NotConfigured = () => <Notice tone="warn" icon="construction">アカウント機能は現在準備中です（運営側の設定待ち）。ログインせずに使える機能はそのままご利用いただけます。</Notice>;

function AuthForm({mode}) {
  const [f, setF] = useState({email:'', pw:'', pw2:'', agree:false});
  const [msg, setMsg] = useState(null); const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value});
  const title = {login:'ログイン', signup:'新規登録', reset:'パスワード再設定', 'new-password':'新しいパスワード'}[mode];
  const submit = async (e) => {
    e.preventDefault(); setMsg(null);
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email);
    if (mode !== 'new-password' && !emailOk) return setMsg(['error','メールアドレスを正しく入力してください']);
    if ((mode === 'signup' || mode === 'new-password') && f.pw.length < 8) return setMsg(['error','パスワードは8文字以上にしてください']);
    if ((mode === 'signup' || mode === 'new-password') && f.pw !== f.pw2) return setMsg(['error','確認用パスワードが一致しません']);
    if (mode === 'signup' && !f.agree) return setMsg(['error','利用規約とプライバシーポリシーへの同意が必要です']);
    setBusy(true);
    try {
      if (mode === 'login') { const {error} = await Y.sb.auth.signInWithPassword({email:f.email, password:f.pw}); if (error) throw error; go('my'); }
      if (mode === 'signup') { const {error} = await Y.sb.auth.signUp({email:f.email, password:f.pw, options:{emailRedirectTo:Y.siteUrl()}}); if (error) throw error;
        setMsg(['info','確認メールを送信しました。メール内のリンクを開いて登録を完了してください。']); }
      if (mode === 'reset') { const {error} = await Y.sb.auth.resetPasswordForEmail(f.email, {redirectTo:Y.siteUrl()}); if (error) throw error;
        setMsg(['info','パスワード再設定用のメールを送信しました。']); }
      if (mode === 'new-password') { const {error} = await Y.sb.auth.updateUser({password:f.pw}); if (error) throw error;
        setMsg(['info','パスワードを変更しました。']); setTimeout(()=>go('my'), 1200); }
    } catch (x) {
      const m = String(x.message || '');
      setMsg(['error', /Invalid login/i.test(m) ? 'メールアドレスまたはパスワードが違います' : /not confirmed/i.test(m) ? 'メール認証が完了していません。確認メールのリンクを開いてください' : '処理できませんでした：' + m]);
    }
    setBusy(false);
  };
  return (
    <>
      <PageHead title={title} onBack={back}/>
      <Scroll>
        {!Y.configured ? <NotConfigured/> : (
          <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:14}}>
            {mode !== 'new-password' && <Field label="メールアドレス"><input type="email" autoComplete="email" style={inputStyle} value={f.email} onChange={set('email')}/></Field>}
            {mode !== 'reset' && <Field label={mode==='login'?'パスワード':'パスワード（8文字以上）'}><input type="password" autoComplete={mode==='login'?'current-password':'new-password'} style={inputStyle} value={f.pw} onChange={set('pw')}/></Field>}
            {(mode === 'signup' || mode === 'new-password') && <Field label="パスワード（確認）"><input type="password" autoComplete="new-password" style={inputStyle} value={f.pw2} onChange={set('pw2')}/></Field>}
            {mode === 'signup' && (
              <label className="row" style={{gap:8,fontSize:12.5,color:INK,alignItems:'flex-start',lineHeight:1.6}}>
                <input type="checkbox" checked={f.agree} onChange={set('agree')} style={{width:20,height:20,flex:'none'}}/>
                <span><a href="#/terms">利用規約</a>と<a href="#/privacy">プライバシーポリシー</a>に同意します</span>
              </label>
            )}
            {msg && <Notice tone={msg[0]}>{msg[1]}</Notice>}
            <Btn type="submit" disabled={busy}>{busy ? '処理中…' : {login:'ログイン', signup:'登録する', reset:'再設定メールを送る', 'new-password':'変更する'}[mode]}</Btn>
            {mode === 'login' && (
              <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:6}}>
                <Btn kind="ghost" onClick={()=>go('signup')}>新規登録はこちら</Btn>
                <a href="#/reset" style={{fontSize:12.5,textAlign:'center'}}>パスワードをお忘れの方</a>
              </div>
            )}
          </form>
        )}
      </Scroll>
    </>
  );
}

/* ── マイページ ── */
function MyPage({user, region, openDialog}) {
  const [name, setName] = useState('');
  useEffect(() => { if (user) Y.profile.get(user.id).then(p => setName((p && p.display_name) || '')).catch(()=>{}); }, [user && user.id]);
  const rows = [
    ['location_on','地域の設定', region ? `${region.pref} ${region.name}` : '未設定', 'region'],
    ...(user ? [['manage_accounts','アカウント設定','', 'account']] : []),
    ['handshake','YOKAへの掲載・連携について','', 'partner'],
    ['policy','プライバシーポリシー','', 'privacy'],
    ['gavel','利用規約','', 'terms'],
  ];
  const logout = async () => { await Y.sb.auth.signOut(); go('home'); };
  return (
    <>
      <PageHead title="マイページ"/>
      <Scroll pad="16px 14px 110px">
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          {!Y.configured && <NotConfigured/>}
          {user ? (
            <div className="row" style={{gap:13,padding:'4px 6px'}}>
              <div style={{width:56,height:56,borderRadius:'50%',background:'#dfe8e5',display:'flex',alignItems:'center',justifyContent:'center'}}><Icon n="person" s={30} c="#8a9c98"/></div>
              <div style={{minWidth:0}}>
                <div style={{fontSize:16,fontWeight:700,color:INK}}>{name || 'ユーザー'}</div>
                <div style={{fontSize:11.5,color:'#8a9491',marginTop:3,overflow:'hidden',textOverflow:'ellipsis'}}>{user.email}</div>
              </div>
            </div>
          ) : Y.configured && (
            <Card style={{padding:16,display:'flex',flexDirection:'column',gap:10}}>
              <div style={{fontSize:13,color:SUB,lineHeight:1.7}}>ログインすると、カレンダーの予定や地域の設定をアカウントに保存できます。</div>
              <Btn onClick={()=>go('login')}>ログイン</Btn>
              <Btn kind="ghost" onClick={()=>go('signup')}>新規登録</Btn>
            </Card>
          )}
          <Card>
            {rows.map(([ic,l,v,to],i)=>(
              <div key={l} onClick={()=>go(to)} className="row" style={{gap:12,padding:14,borderTop:i?'1px solid #f0f2f1':'none',cursor:'pointer'}}>
                <Icon n={ic} s={20} c="#7f8c89"/>
                <span style={{fontSize:13.5,color:'#2c3a37',flex:1}}>{l}</span>
                {v && <span style={{fontSize:12,color:'#8a9491',maxWidth:130,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{v}</span>}
                <Icon n="chevron_right" s={18} c="#c3cbc9"/>
              </div>
            ))}
          </Card>
          {user && <Btn kind="plain" onClick={logout}><Icon n="logout" s={19}/>ログアウト</Btn>}
          <div onClick={openDialog} className="row" style={{marginTop:8,justifyContent:'center',gap:8,padding:15,borderRadius:12,background:'#fdeced',border:'1.5px solid #f3c2c7',cursor:'pointer'}}>
            <Icon n="warning" s={20} c="#d33d52"/><span style={{fontSize:14,fontWeight:700,color:'#c22e43'}}>災害モードに切り替える</span>
          </div>
          <div style={{fontSize:11,color:'#8a9491',textAlign:'center',lineHeight:1.6}}>災害モードは現在デモ表示です。掲載されている支援情報はサンプルです。</div>
          <div style={{fontSize:10.5,color:'#aab3b0',textAlign:'center'}}>YOKA Web ver.0.1</div>
        </div>
      </Scroll>
    </>
  );
}

function Account({user}) {
  const [name, setName] = useState(''); const [msg, setMsg] = useState(null); const [conf, setConf] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { if (user) Y.profile.get(user.id).then(p => setName((p && p.display_name) || '')).catch(()=>{}); }, [user && user.id]);
  if (!user) return (<><PageHead title="アカウント設定" onBack={back}/><Scroll><Btn onClick={()=>go('login')}>ログインしてください</Btn></Scroll></>);
  const saveName = async () => { try { await Y.profile.saveName(user.id, name.trim().slice(0,40)); setMsg(['info','保存しました']); } catch (e) { setMsg(['error','保存できませんでした']); } };
  const resetPw = async () => { const {error} = await Y.sb.auth.resetPasswordForEmail(user.email, {redirectTo:Y.siteUrl()}); setMsg(error ? ['error','送信できませんでした'] : ['info','パスワード変更用のメールを送信しました']); };
  const del = async () => { setBusy(true); try { await Y.deleteAccount(); Y.region.save(null); go('home'); } catch (e) { setMsg(['error','削除できませんでした：' + (e.message||'')]); setBusy(false); } };
  return (
    <>
      <PageHead title="アカウント設定" onBack={back}/>
      <Scroll>
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <Card style={{padding:16,display:'flex',flexDirection:'column',gap:12}}>
            <Field label="メールアドレス"><div style={{fontSize:14,color:INK}}>{user.email}</div></Field>
            <Field label="表示名" hint="40文字まで"><input style={inputStyle} value={name} onChange={e=>setName(e.target.value)} maxLength={40}/></Field>
            <Btn onClick={saveName}>プロフィールを保存</Btn>
          </Card>
          <Card style={{padding:16,display:'flex',flexDirection:'column',gap:10}}>
            <div style={{fontSize:13.5,fontWeight:700,color:INK}}>パスワード</div>
            <Btn kind="ghost" onClick={resetPw}>パスワード変更メールを送る</Btn>
          </Card>
          {msg && <Notice tone={msg[0]}>{msg[1]}</Notice>}
          <Card style={{padding:16,display:'flex',flexDirection:'column',gap:10}}>
            <div style={{fontSize:13.5,fontWeight:700,color:'#c22e43'}}>アカウントの削除</div>
            <div style={{fontSize:12.5,color:SUB,lineHeight:1.7}}>アカウントと、保存したカレンダーの予定・地域設定・プロフィールが削除されます。元に戻せません。確認のため「削除」と入力してください。</div>
            <input style={inputStyle} value={conf} onChange={e=>setConf(e.target.value)} placeholder="削除"/>
            <Btn kind="danger" disabled={conf !== '削除' || busy} onClick={del}>アカウントを削除する</Btn>
          </Card>
        </div>
      </Scroll>
    </>
  );
}

/* ── 掲載・連携ページ ── */
const INQ_TYPES = [['municipality','自治体（実証実験・連携）'],['store','スーパー・小売店（チラシ掲載）'],['shop','地域店舗（まち情報掲載）'],['company','企業・事業パートナー・支援者'],['other','その他']];
function Partner({q}) {
  const [f, setF] = useState({org:'', name:'', email:'', type:q.type || 'municipality', body:'', agree:false, hp:''});
  const [t0] = useState(Date.now()); const [msg, setMsg] = useState(null); const [busy, setBusy] = useState(false); const [done, setDone] = useState(false);
  const set = (k) => (e) => setF({...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value});
  const submit = async (e) => {
    e.preventDefault(); setMsg(null);
    if (f.hp || Date.now() - t0 < 3000) return setMsg(['error','送信できませんでした。少し時間をおいてお試しください。']);
    if (!f.org.trim() || !f.name.trim()) return setMsg(['error','団体名と担当者名を入力してください']);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) return setMsg(['error','メールアドレスを正しく入力してください']);
    if (f.body.trim().length < 10) return setMsg(['error','お問い合わせ内容を10文字以上で入力してください']);
    if (!f.agree) return setMsg(['error','個人情報の取り扱いへの同意が必要です']);
    if (!Y.configured) return setMsg(['error','送信機能は現在準備中です（運営側の設定待ち）。']);
    setBusy(true);
    try { await Y.submitInquiry({org:f.org.trim().slice(0,100), name:f.name.trim().slice(0,60), email:f.email.trim().slice(0,200), type:f.type, body:f.body.trim().slice(0,3000)}); setDone(true); }
    catch (x) { setMsg(['error','送信できませんでした。時間をおいて再度お試しください。']); }
    setBusy(false);
  };
  const Sec = ({n, t, children}) => (
    <Card style={{padding:16}}>
      <div className="row" style={{gap:8,marginBottom:8}}><span style={{fontSize:11,fontWeight:900,color:TEAL}}>{n}</span><span style={{fontSize:14,fontWeight:700,color:INK}}>{t}</span></div>
      <div style={{fontSize:12.5,color:'#3d4a47',lineHeight:1.85}}>{children}</div>
    </Card>
  );
  return (
    <>
      <PageHead title="YOKAへの掲載・連携について" onBack={back}/>
      <Scroll>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <Sec n="01" t="YOKAの目的">住民・地域のお店・行政をひとつのアプリでつなぎ、日々の暮らしと災害時の支えあいを支えることを目指しています。</Sec>
          <Sec n="02" t="現在利用できる機能">全国の市区町村選択／今日の天気／地域マップ（公共施設）／ハザードマップ（国土交通省データ）／個人カレンダー（ログイン時）／交通の公式情報リンク</Sec>
          <Sec n="03" t="今後実装予定の機能">自治体のお知らせ配信、地域イベントのカレンダー掲載、チラシ・お得情報マップ、店舗による「まち情報」投稿、地域ごとの交通情報、災害時の支援情報マップと募金</Sec>
          <Sec n="04" t="自治体との実証実験募集">お知らせ配信や災害時の情報提供について、実証実験にご協力いただける自治体を募集しています。</Sec>
          <Sec n="05" t="店舗掲載の募集">スーパー・小売店のチラシ掲載、カフェ・居酒屋・美容室などの「まち情報」掲載をご希望の店舗さまを募集しています。</Sec>
          <Sec n="06" t="企業・支援者の方へ">地域の防災や商店街の活性化に関わる事業連携・ご支援のご相談をお受けしています。</Sec>
          <Card style={{padding:16}}>
            <div className="row" style={{gap:8,marginBottom:12}}><span style={{fontSize:11,fontWeight:900,color:TEAL}}>07</span><span style={{fontSize:14,fontWeight:700,color:INK}}>お問い合わせ</span></div>
            {done ? <Notice icon="check_circle">送信しました。内容を確認のうえ、担当よりご連絡いたします。</Notice> : (
              <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:13}}>
                <Field label="団体名・店舗名 *"><input style={inputStyle} value={f.org} onChange={set('org')} maxLength={100}/></Field>
                <Field label="担当者名 *"><input style={inputStyle} value={f.name} onChange={set('name')} maxLength={60}/></Field>
                <Field label="メールアドレス *"><input type="email" style={inputStyle} value={f.email} onChange={set('email')} maxLength={200}/></Field>
                <Field label="お問い合わせ種別 *">
                  <select style={inputStyle} value={f.type} onChange={set('type')}>{INQ_TYPES.map(([v,l])=>(<option key={v} value={v}>{l}</option>))}</select>
                </Field>
                <Field label="お問い合わせ内容 *" hint="3000文字まで"><textarea style={{...inputStyle,minHeight:120,resize:'vertical'}} value={f.body} onChange={set('body')} maxLength={3000}/></Field>
                <input tabIndex={-1} autoComplete="off" value={f.hp} onChange={set('hp')} aria-hidden="true" style={{position:'absolute',left:-9999,width:1,height:1,opacity:0}}/>
                <div style={{fontSize:11.5,color:SUB,lineHeight:1.7}}>ご入力いただいた個人情報は、お問い合わせへの回答・ご連絡のためにのみ利用し、<a href="#/privacy">プライバシーポリシー</a>に従って管理します。</div>
                <label className="row" style={{gap:8,fontSize:12.5,color:INK}}><input type="checkbox" checked={f.agree} onChange={set('agree')} style={{width:20,height:20}}/>個人情報の取り扱いに同意する</label>
                {msg && <Notice tone={msg[0]}>{msg[1]}</Notice>}
                <Btn type="submit" disabled={busy}>{busy ? '送信中…' : '送信する'}</Btn>
              </form>
            )}
          </Card>
        </div>
      </Scroll>
    </>
  );
}

/* ── 規約 ── */
function Legal({kind}) {
  const P = {
    privacy: ['プライバシーポリシー（案）', [
      ['取得する情報','アカウント登録時のメールアドレス、表示名、選択した地域（市区町村コード・代表地点の緯度経度）、カレンダーに登録した予定、お問い合わせフォームの入力内容。'],
      ['利用目的','本サービスの提供、本人確認、お問い合わせへの回答、サービス改善のため。'],
      ['外部サービス','認証・データ保存にSupabase、天気に気象庁の公開データ、地図・住所検索に国土地理院、施設情報にOpenStreetMap（Overpass API）を利用します。地域の代表地点の緯度経度がこれらのサービスに送信されます。現在地は「現在地から設定」を押した場合のみ取得し、保存は市区町村単位です。'],
      ['第三者提供','法令に基づく場合を除き、本人の同意なく第三者に提供しません。'],
      ['保存と削除','アカウント削除を行うと、プロフィール・予定・地域設定を削除します。ブラウザ内に保存した地域は端末の設定から削除できます。'],
      ['お問い合わせ','「YOKAへの掲載・連携について」ページのフォームからご連絡ください。'],
    ]],
    terms: ['利用規約（案）', [
      ['サービス内容','YOKA（ver.0.1）は試験提供中のサービスです。内容は予告なく変更・停止することがあります。'],
      ['防災情報について','ハザードマップ・天気等の情報は公的機関・外部サービスのデータを表示したものです。正確性・最新性を保証するものではありません。避難等の判断は自治体・気象庁の公式情報に従ってください。'],
      ['サンプル表示','「サンプル」「デモ」と表示された情報は掲載イメージであり、実在の店舗・支援情報ではありません。'],
      ['禁止事項','法令違反、他者の権利侵害、不正アクセス、サービス運営の妨害、虚偽情報の送信。'],
      ['免責','本サービスの利用により生じた損害について、運営者の故意・重過失による場合を除き責任を負いません。'],
    ]],
  }[kind];
  return (
    <>
      <PageHead title={P[0]} onBack={back}/>
      <Scroll>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <Notice tone="warn">この文書は公開前の案です。正式公開の前に内容の確認が必要です。</Notice>
          {P[1].map(([h,b])=>(
            <Card key={h} style={{padding:15}}>
              <div style={{fontSize:13.5,fontWeight:700,color:INK,marginBottom:6}}>{h}</div>
              <div style={{fontSize:12.5,color:'#3d4a47',lineHeight:1.85}}>{b}</div>
            </Card>
          ))}
        </div>
      </Scroll>
    </>
  );
}

/* ── アプリ本体 ── */
function App() {
  const mobile = useIsMobile();
  const route = useRoute();
  const {user} = useAuth();
  const [region, setRegion] = useRegion(user);
  const weather = useWeather(region);
  const [sub, setSub] = useState('today');
  const [dialog, setDialog] = useState(false);
  const r = route.name;
  const tabOf = {home:'home', hazard:'home', weather:'home', region:'home', map:'map', calendar:'calendar', transit:'transit'}[r] || 'my';
  const tabs = [['home','ホーム','home'],['map','チラシ・マップ','local_offer'],['calendar','カレンダー','calendar_month'],['transit','交通','directions_transit'],['my','マイページ','person']];

  const needOnboard = !region && !['privacy','terms','partner','disaster'].includes(r);
  const screen = needOnboard ? <RegionPicker setRegion={setRegion} welcome/> : r === 'disaster' ? <Disaster exitDisaster={()=>go('home')}/> : (
    <>
      {r === 'home' && <Home region={region} weather={weather} sub={sub} setSub={setSub} user={user}/>}
      {r === 'hazard' && <HazardPage region={region}/>}
      {r === 'weather' && <WeatherDetail region={region} w={weather}/>}
      {r === 'map' && <MapTab region={region} q={route.q}/>}
      {r === 'calendar' && <Calendar user={user}/>}
      {r === 'transit' && <Transit/>}
      {r === 'my' && <MyPage user={user} region={region} openDialog={()=>setDialog(true)}/>}
      {r === 'region' && <RegionPicker setRegion={setRegion}/>}
      {['login','signup','reset','new-password'].includes(r) && <AuthForm key={r} mode={r}/>}
      {r === 'account' && <Account user={user}/>}
      {r === 'partner' && <Partner q={route.q}/>}
      {(r === 'privacy' || r === 'terms') && <Legal kind={r}/>}
      {!['home','hazard','weather','map','calendar','transit','my','region','login','signup','reset','new-password','account','partner','privacy','terms'].includes(r) && <Home region={region} weather={weather} sub={sub} setSub={setSub}/>}
      <TabBar cur={tabOf} set={(id)=>go(id)} accent={TEAL} items={tabs}/>
    </>
  );

  const phone = (
    <Phone mobile={mobile}>
      {screen}
      {dialog && (
        <div style={{position:'absolute',inset:0,zIndex:1300,background:'rgba(20,24,23,.42)',display:'flex',alignItems:'center',justifyContent:'center',padding:34}}>
          <div style={{background:'#fff',borderRadius:18,padding:'22px 20px',width:'100%',boxShadow:'0 20px 50px rgba(0,0,0,.3)'}}>
            <div style={{fontSize:15.5,fontWeight:700,color:INK,textAlign:'center'}}>災害モードに切り替えますか？</div>
            <div style={{fontSize:12,color:SUB,lineHeight:1.7,marginTop:11,textAlign:'center'}}>災害モードでは、避難・支援・営業情報など、災害時に必要な情報を表示します。現在はデモ表示です。</div>
            <div style={{display:'flex',gap:10,marginTop:20}}>
              <div style={{flex:1}}><Btn kind="plain" onClick={()=>setDialog(false)}>キャンセル</Btn></div>
              <div style={{flex:1}}><Btn style={{background:RED,borderColor:RED}} onClick={()=>{setDialog(false);go('disaster');}}>切り替える</Btn></div>
            </div>
          </div>
        </div>
      )}
    </Phone>
  );
  if (mobile) return phone;
  return (
    <div style={{display:'flex',gap:52,alignItems:'flex-start',padding:'48px 40px 64px',justifyContent:'center',flexWrap:'wrap'}}>
      {phone}
      <div style={{width:300,paddingTop:40,display:'flex',flexDirection:'column',gap:20}}>
        <div>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:'.16em',color:'#9a938a'}}>YOKA WEB ver.0.1</div>
          <div style={{fontSize:22,fontWeight:700,color:'#2b2a26',marginTop:8,lineHeight:1.45}}>住民・お店・行政をつなぐ<br/>地域情報サービス</div>
        </div>
        <div style={{fontSize:12.5,lineHeight:1.85,color:'#5c5952'}}>全国の市区町村を選んで、天気・地域マップ・ハザードマップ・個人カレンダーを利用できます。スマートフォンでは全画面で表示されます。</div>
        <div style={{display:'flex',flexDirection:'column',gap:8,fontSize:12.5}}>
          <a href="#/partner">YOKAへの掲載・連携について</a>
          <a href="#/privacy">プライバシーポリシー</a>
          <a href="#/terms">利用規約</a>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
