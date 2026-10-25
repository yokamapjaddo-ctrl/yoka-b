// YOKA 店舗データ（Supabase）。管理画面・住民画面・将来の店舗用画面で共通に使う。
(function () {
  const Y = window.YOKA || {}, sb = Y.sb;
  const BUCKET = 'store-images', MAX = 3 * 1024 * 1024, TYPES = ['image/jpeg', 'image/png', 'image/webp'], MAX_PHOTOS = 3;
  // day_key: 0=日 1=月 … 6=土 7=祝日（表示順は月→日→祝日）
  const DAYS = [{k:1,l:'月'},{k:2,l:'火'},{k:3,l:'水'},{k:4,l:'木'},{k:5,l:'金'},{k:6,l:'土'},{k:0,l:'日'},{k:7,l:'祝日'}];
  const need = () => { if (!sb) throw new Error('Supabase が未設定です（config.js）'); };
  const chk = ({ data, error }) => { if (error) throw error; return data; };
  const hm = (t) => (t || '').slice(0, 5);

  async function amIAdmin() {
    need();
    const { data, error } = await sb.rpc('am_i_admin');
    return !error && data === true;
  }
  const photoUrl = (path) => sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

  // 管理者：全店舗（RLS により管理者以外は公開中のみ返る）
  async function listAll() {
    need();
    const rows = chk(await sb.from('stores')
      .select('id,name,category,prefecture,municipality,address,is_published,archived_at,verified_at,updated_at,store_photos(path,sort)')
      .order('updated_at', { ascending: false }));
    return rows.map(s => {
      const p = (s.store_photos || []).sort((a, b) => a.sort - b.sort)[0];
      return { ...s, cover: p ? photoUrl(p.path) : null };
    });
  }

  const emptyDays = () => Object.fromEntries(DAYS.map(d => [d.k, { status: 'unset', ranges: [] }]));

  async function get(id) {
    need();
    const s = chk(await sb.from('stores').select('*, store_day_rules(day_key,status), store_photos(id,path,sort,alt)').eq('id', id).single());
    const hours = chk(await sb.from('store_hours').select('day_key,opens_at,closes_at,sort').eq('store_id', id).order('sort'));
    const days = emptyDays();
    (s.store_day_rules || []).forEach(r => { days[r.day_key] = { status: r.status, ranges: [] }; });
    hours.forEach(h => { if (days[h.day_key]) days[h.day_key].ranges.push({ o: hm(h.opens_at), c: hm(h.closes_at) }); });
    const photos = (s.store_photos || []).sort((a, b) => a.sort - b.sort).map(p => ({ path: p.path, url: photoUrl(p.path), alt: p.alt || '' }));
    const { store_day_rules, store_photos, ...store } = s;
    return { store, days, photos };
  }

  // 写真の確認と縮小（長辺1600px・JPEG）。3MBを超えるものは縮小し、それでも超えたらエラー
  async function preparePhoto(file) {
    if (!TYPES.includes(file.type)) throw new Error('JPEG・PNG・WebP の画像を選んでください');
    const bmp = await createImageBitmap(file);
    const long = Math.max(bmp.width, bmp.height);
    if (file.size <= MAX && long <= 1600) return { blob: file, ext: { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[file.type] };
    const k = Math.min(1, 1600 / long), c = document.createElement('canvas');
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.85));
    if (!blob || blob.size > MAX) throw new Error('画像が大きすぎます（3MBまで）');
    return { blob, ext: 'jpg' };
  }

  const FIELDS = ['name','category','description','prefecture','municipality','muni_code','address','latitude','longitude','hours_note','verified_at','is_published'];

  // 保存：店舗 → 営業時間 → 写真 の順。途中で失敗しても店舗IDは返す
  async function save({ store, days, photos, removed }) {
    need();
    const row = {}; FIELDS.forEach(f => { row[f] = store[f] === '' ? null : store[f]; });
    row.is_published = !!store.is_published;
    let id = store.id;
    if (id) chk(await sb.from('stores').update(row).eq('id', id));
    else id = chk(await sb.from('stores').insert(row).select('id').single()).id;

    chk(await sb.from('store_day_rules').delete().eq('store_id', id)); // 時間帯も連動して消える
    const rules = DAYS.filter(d => days[d.k].status !== 'unset').map(d => ({ store_id: id, day_key: d.k, status: days[d.k].status }));
    if (rules.length) chk(await sb.from('store_day_rules').insert(rules));
    const hrs = [];
    DAYS.forEach(d => { if (days[d.k].status === 'open') days[d.k].ranges.forEach((r, i) => hrs.push({ store_id: id, day_key: d.k, opens_at: r.o, closes_at: r.c, sort: i })); });
    if (hrs.length) chk(await sb.from('store_hours').insert(hrs));

    const list = [];
    for (const p of photos.slice(0, MAX_PHOTOS)) {
      if (p.path) { list.push(p); continue; }
      const { blob, ext } = await preparePhoto(p.file);
      const path = `stores/${id}/${crypto.randomUUID()}.${ext}`;
      chk(await sb.storage.from(BUCKET).upload(path, blob, { contentType: blob.type || 'image/jpeg', upsert: false }));
      list.push({ ...p, path });
    }
    chk(await sb.from('store_photos').delete().eq('store_id', id));
    if (list.length) chk(await sb.from('store_photos').insert(list.map((p, i) => ({ store_id: id, path: p.path, sort: i, alt: p.alt || null }))));
    if (removed && removed.length) await sb.storage.from(BUCKET).remove(removed);
    return id;
  }

  async function archive(id) { need(); chk(await sb.from('stores').update({ archived_at: new Date().toISOString() }).eq('id', id)); }
  async function restore(id) { need(); chk(await sb.from('stores').update({ archived_at: null }).eq('id', id)); }

  // 住所 → 緯度経度（国土地理院 住所検索）
  async function geocodeAddress(q) {
    const r = await fetch('https://msearch.gsi.go.jp/address-search/AddressSearch?q=' + encodeURIComponent(q));
    const j = await r.json();
    if (!Array.isArray(j) || !j.length) throw new Error('住所から位置が見つかりませんでした。地図をタップして指定してください');
    const [lon, lat] = j[0].geometry.coordinates;
    return { lat, lon };
  }

  // 1日の表示文（未設定は「情報なし」。定休日と混同しない）
  function dayText(d) {
    if (!d || d.status === 'unset') return '情報なし';
    if (d.status === 'closed') return '定休日';
    return d.ranges.length ? d.ranges.map(r => `${r.o}–${r.c}`).join(' / ') : '営業（時間未登録）';
  }

  // 住民向け：公開中の店舗（地域の中心から約15km四方）。非公開はRLSで返らない
  async function listPublished(lat, lon) {
    need();
    const d = 0.14;
    const rows = chk(await sb.from('stores')
      .select('id,name,category,description,prefecture,municipality,address,latitude,longitude,hours_note,verified_at,store_day_rules(day_key,status),store_photos(path,sort,alt)')
      .eq('is_published', true).is('archived_at', null)
      .gte('latitude', lat - d).lte('latitude', lat + d).gte('longitude', lon - d).lte('longitude', lon + d));
    const ids = rows.map(s => s.id);
    const hrs = ids.length ? chk(await sb.from('store_hours').select('store_id,day_key,opens_at,closes_at,sort').in('store_id', ids).order('sort')) : [];
    return rows.map(s => {
      const days = emptyDays();
      (s.store_day_rules || []).forEach(r => { days[r.day_key] = { status: r.status, ranges: [] }; });
      hrs.filter(h => h.store_id === s.id).forEach(h => { if (days[h.day_key]) days[h.day_key].ranges.push({ o: hm(h.opens_at), c: hm(h.closes_at) }); });
      const photos = (s.store_photos || []).sort((a, b) => a.sort - b.sort).map(p => ({ url: photoUrl(p.path), alt: p.alt || '' }));
      const { store_day_rules, store_photos, ...store } = s;
      return { ...store, days, photos };
    });
  }
  const distKm = (a, b, c, d) => { const R = 6371, r = Math.PI / 180, x = Math.sin((c - a) * r / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin((d - b) * r / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); };
  const routeUrls = (s) => ({
    google: `https://www.google.com/maps/dir/?api=1&destination=${s.latitude},${s.longitude}`,
    apple: `https://maps.apple.com/?daddr=${s.latitude},${s.longitude}&q=${encodeURIComponent(s.name)}`,
  });

  window.YOKA_STORES = { DAYS, MAX_PHOTOS, TYPES, MAX, amIAdmin, photoUrl, listAll, get, save, archive, restore, emptyDays, preparePhoto, geocodeAddress, dayText, listPublished, distKm, routeUrls };
})();
