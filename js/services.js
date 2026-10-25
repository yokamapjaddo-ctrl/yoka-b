// YOKA services: 外部API・Supabase・保存処理（UIから独立。将来アプリ版でも再利用できる形）
(function () {
  const C = window.YOKA_CONFIG || {};
  const configured = !!(C.supabaseUrl && C.supabaseAnonKey && window.supabase);
  const sb = configured
    ? window.supabase.createClient(C.supabaseUrl, C.supabaseAnonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      })
    : null;
  const siteUrl = () => C.siteUrl || (location.origin + location.pathname);

  async function getJSON(url, opt) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    try {
      const r = await fetch(url, { ...(opt || {}), signal: ctrl.signal });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } finally { clearTimeout(t); }
  }

  // ── 市区町村（国土地理院 muni.js：全国地方公共団体コード） ──
  let _munis = null;
  function munis() {
    if (_munis) return _munis;
    const A = (window.GSI && window.GSI.MUNI_ARRAY) || {};
    _munis = Object.values(A).map(s => {
      const [pc, pn, mc, mn] = s.split(',');
      return { prefCode: pc.padStart(2, '0'), pref: pn, code: mc.padStart(5, '0'), name: mn.replace(/\u3000/g, ' ') };
    });
    return _munis;
  }
  function prefectures() {
    const seen = new Map();
    munis().forEach(m => { if (!seen.has(m.prefCode)) seen.set(m.prefCode, m.pref); });
    return [...seen.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([code, name]) => ({ code, name }));
  }
  function byCode(code) {
    const A = (window.GSI && window.GSI.MUNI_ARRAY) || {};
    const s = A[String(parseInt(code, 10))];
    if (!s) return null;
    const [pc, pn, mc, mn] = s.split(',');
    return { prefCode: pc.padStart(2, '0'), pref: pn, code: mc.padStart(5, '0'), name: mn.replace(/\u3000/g, ' ') };
  }
  // 住所検索（国土地理院 AddressSearch）
  async function geocode(m) {
    const q = m.pref + m.name.replace(/\s/g, '');
    const j = await getJSON('https://msearch.gsi.go.jp/address-search/AddressSearch?q=' + encodeURIComponent(q));
    if (!Array.isArray(j) || !j.length) throw new Error('not found');
    const [lon, lat] = j[0].geometry.coordinates;
    return { lat, lon };
  }
  // 逆ジオコーディング（国土地理院）
  async function reverse(lat, lon) {
    const j = await getJSON(`https://mreversegeocoder.gsi.go.jp/reverse-geocoder/LonLatToAddress?lat=${lat}&lon=${lon}`);
    const cd = j && j.results && j.results.muniCd;
    const m = cd && byCode(cd);
    if (!m) throw new Error('not found');
    return { ...m, lat, lon };
  }

  // ── 天気（気象庁：府県天気予報＋アメダス観測値） ──
  const JMA = 'https://www.jma.go.jp/bosai';
  let _area = null, _amedas = null;
  const area = () => _area || (_area = getJSON(JMA + '/common/const/area.json'));
  const amedasTable = () => _amedas || (_amedas = getJSON(JMA + '/amedas/const/amedastable.json'));
  const deg = (a) => a[0] + a[1] / 60;
  const dist2 = (la, lo, la2, lo2) => (la - la2) ** 2 + ((lo - lo2) * Math.cos(la * Math.PI / 180)) ** 2;

  async function weather(lat, lon, muniCode) {
    const A = await area();
    let c20 = A.class20s[muniCode + '00'];
    if (!c20) { const k = Object.keys(A.class20s).find(k => k.startsWith(muniCode.slice(0, 4))); c20 = k && A.class20s[k]; }
    if (!c20) throw new Error('area not found');
    const c10code = A.class15s[c20.parent].parent, office = A.class10s[c10code].parent;
    const [F, T] = await Promise.all([getJSON(`${JMA}/forecast/data/forecast/${office}.json`), amedasTable()]);
    const ts = F[0].timeSeries;
    const wa = ts[0].areas.find(a => a.area.code === c10code) || ts[0].areas[0];
    const pa = ts[1].areas.find(a => a.area.code === c10code) || ts[1].areas[0];
    const t0 = new Date(ts[0].timeDefines[0]);
    const today = new Date().toDateString();
    const sameDay = (d) => new Date(d).toDateString() === t0.toDateString();
    const pops = ts[1].timeDefines.map((d, i) => [d, pa.pops[i]]).filter(([d, v]) => sameDay(d) && v !== '').map(([, v]) => +v);
    // 予報気温：地域に最も近い予報地点
    let tmax = null, tmin = null, tPoint = '';
    if (ts[2]) {
      const cand = ts[2].areas.filter(a => T[a.area.code]);
      const near = cand.sort((a, b) => dist2(lat, lon, deg(T[a.area.code].lat), deg(T[a.area.code].lon)) - dist2(lat, lon, deg(T[b.area.code].lat), deg(T[b.area.code].lon)))[0] || ts[2].areas[0];
      tPoint = near.area.name;
      ts[2].timeDefines.forEach((d, i) => {
        if (!sameDay(d) || near.temps[i] === '') return;
        const h = new Date(d).getHours();
        if (h === 0) tmin = +near.temps[i]; else tmax = +near.temps[i];
      });
      // 11時・17時発表では当日0時の欄に最高気温が重複して入るため、同値なら最低は不明扱い
      if (tmin != null && tmax != null && tmin === tmax) tmin = null;
    }
    // 現在の気温：最寄りのアメダス
    let now = null, nowPoint = '', nowTime = null;
    try {
      const lt = (await (await fetch(JMA + '/amedas/data/latest_time.txt')).text()).trim();
      const d = new Date(lt); nowTime = lt;
      const key = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}00`;
      const M = await getJSON(`${JMA}/amedas/data/map/${key}.json`);
      const st = Object.keys(M).filter(k => M[k].temp && M[k].temp[1] === 0 && T[k])
        .sort((a, b) => dist2(lat, lon, deg(T[a].lat), deg(T[a].lon)) - dist2(lat, lon, deg(T[b].lat), deg(T[b].lon)))[0];
      if (st) { now = M[st].temp[0]; nowPoint = T[st].kjName; }
    } catch (e) {}
    // 週間予報
    let weekly = [], wPoint = '';
    if (F[1] && F[1].timeSeries) {
      const w0 = F[1].timeSeries[0], w1 = F[1].timeSeries[1];
      const wa2 = w0.areas.find(a => a.area.code === c10code) || w0.areas[0];
      let tA = null;
      if (w1) {
        tA = w1.areas.filter(a => T[a.area.code]).sort((a, b) => dist2(lat, lon, deg(T[a.area.code].lat), deg(T[a.area.code].lon)) - dist2(lat, lon, deg(T[b.area.code].lat), deg(T[b.area.code].lon)))[0] || w1.areas[0];
        wPoint = tA.area.name;
      }
      weekly = w0.timeDefines.map((d, i) => ({
        date: d, code: +wa2.weatherCodes[i], pop: wa2.pops[i] === '' ? null : +wa2.pops[i],
        rel: wa2.reliabilities ? wa2.reliabilities[i] : '',
        min: tA && tA.tempsMin[i] !== '' ? +tA.tempsMin[i] : null, max: tA && tA.tempsMax[i] !== '' ? +tA.tempsMax[i] : null
      }));
    }
    const days = ts[0].timeDefines.map((d, i) => ({ date: d, code: +wa.weatherCodes[i], text: wa.weathers[i].replace(/\u3000/g, ' '), wind: (wa.winds && wa.winds[i] || '').replace(/\u3000/g, ' ') }));
    const popBlocks = ts[1].timeDefines.map((d, i) => ({ time: d, pop: pa.pops[i] === '' ? null : +pa.pops[i] }));
    return {
      weekly, wPoint, days, popBlocks,
      jmaCode: +wa.weatherCodes[0], text: wa.weathers[0].replace(/\u3000/g, ' '),
      dayLabel: t0.toDateString() === today ? (t0.getHours() >= 17 ? '今夜' : '今日') : '明日',
      now, nowPoint, max: tmax, min: tmin, tPoint,
      pop: pops.length ? Math.max(...pops) : null,
      areaName: A.class10s[c10code].name, office: A.offices[office].name,
      reportTime: F[0].reportDatetime, time: nowTime || F[0].reportDatetime
    };
  }

  // ── 公共施設（OpenStreetMap / Overpass API） ──
  async function facilities(lat, lon, radius) {
    const R = radius || 2000;
    const q = `[out:json][timeout:20];nwr(around:${R},${lat},${lon})[amenity~"^(townhall|hospital|clinic|library|police|fire_station|community_centre|school|post_office)$"];out center 300;`;
    const j = await getJSON('https://overpass-api.de/api/interpreter', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'data=' + encodeURIComponent(q)
    });
    return (j.elements || []).map(e => {
      const t = e.tags || {};
      const addr = [t['addr:province'], t['addr:city'], t['addr:quarter'], t['addr:neighbourhood'], t['addr:block_number'], t['addr:housenumber']].filter(Boolean).join('');
      return {
        id: e.type + '/' + e.id, type: t.amenity, name: t.name || t['name:ja'] || '(名称未登録)',
        lat: e.lat != null ? e.lat : e.center && e.center.lat, lon: e.lon != null ? e.lon : e.center && e.center.lon,
        addr: addr || t['addr:full'] || '', hours: t.opening_hours || '', phone: t.phone || t['contact:phone'] || '',
        url: 'https://www.openstreetmap.org/' + e.type + '/' + e.id
      };
    }).filter(p => p.lat != null);
  }

  // ── 地域の保存 ──
  const REGION_KEY = 'yoka.region.v1';
  const region = {
    load() { try { return JSON.parse(localStorage.getItem(REGION_KEY)) || null; } catch (e) { return null; } },
    save(r) { try { localStorage.setItem(REGION_KEY, JSON.stringify(r)); } catch (e) {} }
  };

  // ── Supabase: プロフィール ──
  const profile = {
    async get(uid) {
      const { data, error } = await sb.from('profiles').select('*').eq('id', uid).maybeSingle();
      if (error) throw error; return data;
    },
    async saveRegion(uid, r) {
      const { error } = await sb.from('profiles').upsert({
        id: uid, muni_code: r.code, pref_name: r.pref, muni_name: r.name, lat: r.lat, lon: r.lon
      });
      if (error) throw error;
    },
    async saveName(uid, name) {
      const { error } = await sb.from('profiles').upsert({ id: uid, display_name: name });
      if (error) throw error;
    }
  };

  // ── Supabase: カレンダー ──
  const events = {
    async list(from, to) {
      const { data, error } = await sb.from('calendar_events').select('*')
        .lt('starts_at', to.toISOString()).gte('ends_at', from.toISOString()).order('starts_at');
      if (error) throw error; return data || [];
    },
    async save(ev) {
      const row = { title: ev.title, note: ev.note || null, all_day: !!ev.all_day, starts_at: ev.starts_at, ends_at: ev.ends_at };
      const q = ev.id ? sb.from('calendar_events').update(row).eq('id', ev.id) : sb.from('calendar_events').insert(row);
      const { error } = await q; if (error) throw error;
    },
    async remove(id) {
      const { error } = await sb.from('calendar_events').delete().eq('id', id);
      if (error) throw error;
    }
  };

  // ── Supabase: 問い合わせ ──
  async function submitInquiry(f) {
    const { error } = await sb.from('partner_inquiries').insert({
      org_name: f.org, contact_name: f.name, email: f.email, inquiry_type: f.type, body: f.body
    });
    if (error) throw error;
  }

  async function deleteAccount() {
    const { error } = await sb.rpc('delete_my_account');
    if (error) throw error;
    await sb.auth.signOut();
  }

  window.YOKA = { sb, configured, siteUrl, munis, prefectures, byCode, geocode, reverse, weather, facilities, region, profile, events, submitInquiry, deleteAccount };
})();
