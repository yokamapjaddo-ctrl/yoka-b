/* 災害モード（YOKA MAP）— ver.0.1 ではデモ表示。掲載情報はすべてサンプル */
const DemoStrip = () => (
  <div style={{display:'flex',justifyContent:'center',paddingTop:2}}>
    <span style={{fontSize:11.5,fontWeight:700,padding:'3px 10px',borderRadius:999,background:'#fff4dc',color:'#8a5d00',border:'1px solid #f1d9a4'}}>デモ表示：掲載情報はすべてサンプルです</span>
  </div>
);
const GRN='#1a7a4f', GRN_D='#125c3b', PINK='#e35d6a';

const D_CATS = [
  ['食事を探す','restaurant','#e35d6a'],
  ['お風呂・シャワー','shower','#3b7dd8'],
  ['充電できる場所','bolt','#dfa019'],
  ['買い物','shopping_cart','#8b5cd6'],
  ['病院・薬局','medical_services','#2f9e6b'],
  ['給水場所','water_drop','#3ba9d6'],
];
const D_AREAS = ['大和市 中央地区','大和市 北部（中央林間・つきみ野）','大和市 南部（桜ヶ丘・高座渋谷）','綾瀬市','海老名市','座間市'];
const ST_COL = {'営業中':['#e3f3e8','#15703f'],'営業時間変更あり':['#fdf1e0','#a86a10'],'現在休業中':['#f0f1f2','#5f6a6d'],'情報確認中':['#f0f1f2','#5f6a6d']};
const D_SHOPS = [
  {id:'s1',cat:'食事を探す',name:'○○食堂',summary:'お弁当を300円で提供',hours:'11:00〜17:00',addr:'大和市中央1-2-3',tel:'046-123-4567',price:'お弁当 300円',limit:'1人2個まで',last:'8/25 12:30',check:'店舗のInstagramで確認',dist:'0.4km',status:'営業中',thanks:32,pin:{x:'26%',y:'30%'}},
  {id:'s2',cat:'食事を探す',name:'△△キッチン',summary:'カレーライスを200円で提供',hours:'10:00〜15:00',addr:'大和市林間4-5-6',tel:'046-234-5678',price:'カレー 200円',limit:'なし',last:'8/25 11:45',check:'店舗に電話で確認',dist:'1.2km',status:'営業中',thanks:18,pin:{x:'62%',y:'22%'}},
  {id:'s3',cat:'お風呂・シャワー',name:'□□湯（銭湯）',summary:'入浴を無料で開放',hours:'15:00〜21:00',addr:'大和市桜ヶ丘2-8-1',tel:'046-345-6789',price:'無料',limit:'タオル貸出あり',last:'8/25 10:10',check:'店舗に電話で確認',dist:'0.9km',status:'営業時間変更あり',thanks:24,pin:{x:'34%',y:'56%'}},
  {id:'s4',cat:'充電できる場所',name:'大和駅前 充電ステーション',summary:'スマホ充電・Wi-Fiを無料開放',hours:'9:00〜20:00',addr:'大和市大和南1-1-1',tel:'046-456-7890',price:'無料',limit:'座席20席',last:'8/25 13:00',check:'市の公式サイトで確認',dist:'0.2km',status:'営業中',thanks:41,pin:{x:'66%',y:'60%'}},
  {id:'s5',cat:'給水場所',name:'市民会館 給水所',summary:'給水車が待機・容器の貸出あり',hours:'8:00〜18:00',addr:'大和市深見西1-3-1',tel:'046-567-8901',price:'無料',limit:'1世帯20Lまで',last:'8/25 12:00',check:'市の公式サイトで確認',dist:'1.5km',status:'営業中',thanks:25,pin:{x:'46%',y:'78%'}},
  {id:'s6',cat:'病院・薬局',name:'△△薬局 中央店',summary:'処方箋に対応しています',hours:'情報確認中',addr:'大和市中央3-4-5',tel:'046-678-9012',price:'—',limit:'—',last:'8/24 18:20',check:'店舗に電話で確認',dist:'0.7km',status:'情報確認中',thanks:7,pin:{x:'18%',y:'70%'}},
];
const YOKA_FUND = ['YOKA まとめて募金','YOKAから被災地の支援活動へお届けします'];
const D_SUPPORT_WAYS = [
  ['支援しているお店を応援','お店を選んで100円から募金できます','storefront','#e35d6a','#fdeff0'],
  ['お店を選ばずに募金する','YOKAがまとめて被災地へお届けします','favorite','#e35d6a','#fdeff0'],
  ['寄付で応援する','公式の寄付先一覧を見る','payments','#dfa019','#fdf6e6'],
  ['ボランティアに参加する','募集中のボランティアを見る','diversity_3','#2f9e6b','#eaf6ef'],
  ['情報をシェア・拡散する','SNSで応援の輪を広げる','share','#3b7dd8','#eaf1fb'],
];
const D_SUPPORT_SHOPS = [
  {id:'ss1',name:'○○食堂',note:'お弁当を300円で提供中',count:256,addr:'大和市中央1-2-3',tel:'046-123-4567',hours:'11:00〜17:00',
   msg:'被災された方に温かいお弁当をお届けしています。皆さまのご支援が仕入れの費用になります。',goal:'50万円',now:'32万円',pct:64},
  {id:'ss2',name:'△△ベーカリー',note:'パンの無料配布を実施中',count:182,addr:'大和市林間2-4-8',tel:'046-234-5678',hours:'8:00〜16:00',
   msg:'毎朝300個のパンを避難所にお届けしています。小麦粉と燃料の費用にあてさせていただきます。',goal:'30万円',now:'21万円',pct:70},
  {id:'ss3',name:'□□美容室',note:'無料シャンプーを提供中',count:97,addr:'大和市桜ヶ丘3-1-2',tel:'046-345-6789',hours:'10:00〜18:00',
   msg:'断水が続く地域の方に無料でシャンプーを提供しています。水と備品の確保にご協力ください。',goal:'20万円',now:'9万円',pct:45},
];
const D_VOLS = [
  ['避難所の配食のお手伝い','大和小学校 体育館','8/26（水）9:00〜12:00','あと5名 募集中'],
  ['給水所の運営サポート','市民会館 前広場','8/26（水）13:00〜17:00','あと8名 募集中'],
  ['物資の仕分け・搬入','市総合体育館','8/27（木）10:00〜15:00','あと12名 募集中'],
];
const D_AMOUNTS = ['100円','300円','500円','1,000円','5,000円','その他の金額'];
const D_DONORS = [
  ['大和市 災害支援基金','市が受け付ける公式の寄付窓口です'],
  ['日本赤十字社 神奈川県支部','被災地の医療・救護活動に使われます'],
  ['○○NPO 地域支援ファンド','地域のお店の再開を支援します'],
];
const D_FORM = [
  ['お店・施設名 *','例）○○食堂'],['市町村 *','例）大和市'],['カテゴリ *','選択してください'],
  ['支援内容 *','例）お弁当を300円で提供'],['提供時間','例）11:00〜17:00'],['確認方法 *','例）お店のInstagramで確認'],
];
const D_FILTERS = {
  status:['すべて','現在営業中','営業時間変更あり','現在休業中','情報確認中'],
  price:['すべて','無料','〜500円','〜1,000円','1,000円以上'],
  other:['子ども連れOK','駐車場あり','予約不要','テイクアウトOK'],
};

const DBar = ({title, onBack}) => (
  <div style={{padding:'var(--top) 14px 0',background:'#fff',borderBottom:'1px solid #e6e9e8'}}>
    <DemoStrip/>
    <div className="row" style={{height:56,gap:6}}>
      {onBack
        ? <div onClick={onBack} className="row" style={{gap:2,cursor:'pointer',padding:'8px 6px 8px 0',minWidth:74}}>
            <Icon n="arrow_back" s={26} c={GRN_D}/><span style={{fontSize:15,fontWeight:700,color:GRN_D}}>戻る</span>
          </div>
        : <div style={{minWidth:74}}/>}
      <div style={{flex:1,textAlign:'center',fontSize:18,fontWeight:700,color:'#1d2422'}}>{title}</div>
      <div style={{minWidth:74}}/>
    </div>
  </div>
);

const BigBtn = ({children, onClick, bg, fg='#fff', bd}) => (
  <div onClick={onClick} className="row" style={{justifyContent:'center',gap:10,minHeight:60,padding:'14px 16px',
    borderRadius:14,background:bg,color:fg,border:bd?`2px solid ${bd}`:'none',fontSize:18,fontWeight:700,cursor:'pointer'}}>
    {children}
  </div>
);

const StatusTag = ({status}) => (
  <span style={{fontSize:13,fontWeight:700,padding:'4px 10px',borderRadius:6,whiteSpace:'nowrap',
    background:ST_COL[status][0],color:ST_COL[status][1]}}>{status}</span>
);

function Disaster({exitDisaster}) {
  const [nav,setNav]=useState(['home']);
  const [cat,setCat]=useState(null);
  const [area,setArea]=useState(null);
  const [sel,setSel]=useState(null);
  const [fStatus,setFStatus]=useState('すべて');
  const [fPrice,setFPrice]=useState('すべて');
  const [fOther,setFOther]=useState({});
  const [thanks,setThanks]=useState({});
  const [selShop,setSelShop]=useState('ss1');
  const [amount,setAmount]=useState('100円');
  const [donor,setDonor]=useState(null);
  const [cheers,setCheers]=useState({});

  const recipient = donor ? donor[0] : (D_SUPPORT_SHOPS.find(x=>x.id===selShop)||D_SUPPORT_SHOPS[0]).name;
  const isFund = donor === YOKA_FUND;

  const sshop = D_SUPPORT_SHOPS.find(x=>x.id===selShop) || D_SUPPORT_SHOPS[0];

  const cur=nav[nav.length-1];
  const push=(s)=>setNav(n=>[...n,s]);
  const back=()=>setNav(n=>n.length>1?n.slice(0,-1):n);
  const reset=(s)=>setNav([s]);

  const list = D_SHOPS.filter(s=>{
    if(cat && s.cat!==cat) return false;
    if(fStatus!=='すべて' && s.status!==fStatus) return false;
    if(fPrice==='無料' && s.price!=='無料') return false;
    return true;
  }).sort((a,c)=>parseFloat(a.dist)-parseFloat(c.dist));
  const shop = D_SHOPS.find(s=>s.id===sel) || D_SHOPS[0];
  const searchTitle = (cat||'支援情報')+'・'+(area||'大和市');

  const openList=(c)=>{setCat(c);push('area');};

  const ShopCard = ({s}) => (
    <div onClick={()=>{setSel(s.id);push('detail');}} style={{background:'#fff',borderRadius:14,border:'1px solid #e2e7e5',padding:15,cursor:'pointer'}}>
      <div className="row" style={{justifyContent:'space-between',gap:8}}>
        <span style={{fontSize:19,fontWeight:700,color:'#1d2422'}}>{s.name}</span>
        <StatusTag status={s.status}/>
      </div>
      <div style={{fontSize:16,color:'#2f3a37',marginTop:7,lineHeight:1.6}}>{s.summary}</div>
      <div className="row" style={{gap:7,marginTop:9}}>
        <Icon n="schedule" s={19} c="#7c8683"/><span style={{fontSize:15,color:'#4a5451'}}>{s.hours}</span>
      </div>
      <div className="row" style={{gap:7,marginTop:5}}>
        <Icon n="location_on" s={19} c="#7c8683"/><span style={{fontSize:15,color:'#4a5451',flex:1}}>{s.addr}</span>
        <span style={{fontSize:14,fontWeight:700,color:'#7c8683'}}>{s.dist}</span>
      </div>
      <div style={{fontSize:13.5,color:'#8b9491',marginTop:8}}>最終確認 {s.last}</div>
    </div>
  );

  const FilterChips = () => (
    <div className="row" style={{gap:8,padding:'12px 14px',background:'#fff',borderBottom:'1px solid #e6e9e8'}}>
      <div onClick={()=>push('filter')} className="row" style={{gap:5,padding:'9px 13px',borderRadius:9,border:'1.5px solid #d3dad8',background:'#fff',cursor:'pointer'}}>
        <Icon n="tune" s={18} c="#4a5451"/><span style={{fontSize:14.5,fontWeight:700,color:'#3a4441'}}>絞り込み</span>
      </div>
      {['現在営業中','無料'].map(l=>{
        const on = l==='現在営業中' ? fStatus==='現在営業中' : fPrice==='無料';
        const set = ()=> l==='現在営業中' ? setFStatus(on?'すべて':'現在営業中') : setFPrice(on?'すべて':'無料');
        return (
          <div key={l} onClick={set} style={{padding:'9px 13px',borderRadius:9,cursor:'pointer',fontSize:14.5,fontWeight:700,
            background:on?GRN:'#fff',color:on?'#fff':'#3a4441',border:`1.5px solid ${on?GRN:'#d3dad8'}`}}>{l==='無料'?'無料・安価':l}</div>
        );
      })}
    </div>
  );

  const tabFor = {home:'home',cat:'search',area:'search',list:'search',detail:'search',filter:'search',map:'map',form:'form',my:'my',
    support:'home',shops:'home',shopDetail:'home',donate:'home',donateConfirm:'home',donateDone:'home',donors:'home',volunteer:'home',share:'home'}[cur]||'home';
  const tabs=[['home','ホーム','home'],['search','探す','search'],['map','地図','map'],['form','情報提供','edit_note'],['my','マイページ','person']];
  const onTab=(id)=>{
    if(id==='home') reset('home');
    else if(id==='search') reset(cat?'list':'cat');
    else reset(id);
  };

  const body = (children, pad='16px 14px 110px') => (
    <div className="scroll fade" style={{flex:1,overflow:'auto',padding:pad,background:'#f5f7f6'}}>{children}</div>
  );

  return (
    <>
      {cur==='home' && (
        <>
          <div style={{padding:'var(--top) 14px 0',background:'#fff',borderBottom:'1px solid #e6e9e8'}}>
    <DemoStrip/>
            <div className="row" style={{height:56,justifyContent:'center',gap:8}}>
              <Icon n="location_on" s={26} c={GRN}/>
              <span style={{fontSize:23,fontWeight:900,letterSpacing:'.06em',color:GRN_D}}>YOKA MAP</span>
            </div>
          </div>
          {body(
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div style={{fontSize:15,color:'#5b6663',lineHeight:1.7,textAlign:'center',padding:'2px 0 4px'}}>今いる場所から、支えあう地域の情報を。</div>
              <div onClick={()=>push('cat')} style={{borderRadius:18,background:PINK,padding:'30px 22px',cursor:'pointer',display:'flex',alignItems:'center',gap:18,minHeight:132}}>
                <Icon n="volunteer_activism" s={46} c="#fff"/>
                <div>
                  <div style={{fontSize:27,fontWeight:900,color:'#fff',lineHeight:1.3}}>困っている方へ</div>
                  <div style={{fontSize:17,color:'rgba(255,255,255,.94)',marginTop:6}}>支援を探す</div>
                </div>
              </div>
              <div onClick={()=>push('support')} style={{borderRadius:18,background:GRN,padding:'30px 22px',cursor:'pointer',display:'flex',alignItems:'center',gap:18,minHeight:132}}>
                <Icon n="diversity_1" s={46} c="#fff"/>
                <div>
                  <div style={{fontSize:27,fontWeight:900,color:'#fff',lineHeight:1.3}}>支援したい方へ</div>
                  <div style={{fontSize:17,color:'rgba(255,255,255,.94)',marginTop:6}}>応援・支援する</div>
                </div>
              </div>
              <div style={{background:'#fff',borderRadius:14,border:'1px solid #e2e7e5',padding:16}}>
                <div className="row" style={{gap:8}}>
                  <span style={{fontSize:15,fontWeight:700,color:'#1d2422'}}>お知らせ</span>
                  <span style={{fontSize:11.5,fontWeight:900,padding:'2px 7px',borderRadius:4,background:PINK,color:'#fff'}}>NEW</span>
                </div>
                <div style={{fontSize:15,color:'#4a5451',marginTop:9,lineHeight:1.7}}>8/25 新しい支援情報を更新しました</div>
              </div>
              <div className="row" style={{gap:8,justifyContent:'center',padding:'4px 0 8px'}}>
                <Icon n="favorite" s={17} c="#e9b3b8"/>
                <span style={{fontSize:14,color:'#7c8683'}}>応援の気持ちが、まちの力になります</span>
              </div>
            </div>
          )}
        </>
      )}

      {cur==='cat' && (
        <>
          <DBar title="困っている方へ" onBack={back}/>
          {body(
            <div>
              <div style={{fontSize:20,fontWeight:700,color:'#1d2422',textAlign:'center',marginBottom:16}}>何をお探しですか？</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                {D_CATS.map(([label,icon,c])=>(
                  <div key={label} onClick={()=>openList(label)} style={{background:c,borderRadius:14,padding:'20px 12px',cursor:'pointer',
                    display:'flex',flexDirection:'column',alignItems:'center',gap:9,minHeight:112,justifyContent:'center'}}>
                    <Icon n={icon} s={32} c="#fff"/>
                    <span style={{fontSize:16,fontWeight:700,color:'#fff',textAlign:'center',lineHeight:1.4}}>{label}</span>
                  </div>
                ))}
              </div>
              <div onClick={()=>{setCat(null);push('area');}} className="row" style={{marginTop:12,justifyContent:'center',gap:9,minHeight:64,
                borderRadius:14,background:'#8d9794',cursor:'pointer'}}>
                <Icon n="map" s={26} c="#fff"/>
                <span style={{fontSize:17,fontWeight:700,color:'#fff'}}>すべての支援情報を見る</span>
              </div>
            </div>
          )}
        </>
      )}

      {cur==='area' && (
        <>
          <DBar title="地域を選んでください" onBack={back}/>
          {body(
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {D_AREAS.map(a=>(
                <div key={a} onClick={()=>{setArea(a);push('list');}} className="row" style={{gap:10,padding:'18px 16px',background:'#fff',
                  borderRadius:12,border:'1px solid #e2e7e5',cursor:'pointer',minHeight:60}}>
                  <span style={{fontSize:17,fontWeight:700,color:'#1d2422',flex:1,lineHeight:1.45}}>{a}</span>
                  <Icon n="chevron_right" s={24} c="#a8b1ae"/>
                </div>
              ))}
              <div onClick={()=>{setArea('現在地の周辺');push('list');}} className="row" style={{gap:10,padding:'18px 16px',background:'#fff',
                borderRadius:12,border:'1px solid #e2e7e5',cursor:'pointer',minHeight:60}}>
                <Icon n="my_location" s={22} c={GRN}/>
                <span style={{fontSize:17,fontWeight:700,color:GRN_D,flex:1}}>その他の地域から探す</span>
                <Icon n="chevron_right" s={24} c="#a8b1ae"/>
              </div>
            </div>
          )}
        </>
      )}

      {cur==='list' && (
        <>
          <DBar title={searchTitle} onBack={back}/>
          <FilterChips/>
          {body(
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div className="row" style={{justifyContent:'space-between'}}>
                <span style={{fontSize:15,color:'#4a5451'}}>近い順に <span style={{fontWeight:900,color:GRN_D,fontSize:17}}>{list.length}</span> 件</span>
                <div onClick={()=>push('map')} className="row" style={{gap:4,cursor:'pointer'}}>
                  <Icon n="map" s={20} c={GRN}/><span style={{fontSize:14.5,fontWeight:700,color:GRN_D}}>地図で見る</span>
                </div>
              </div>
              {list.length===0 && <div style={{padding:24,textAlign:'center',fontSize:16,color:'#7c8683',background:'#fff',borderRadius:14,border:'1px solid #e2e7e5'}}>条件に合う情報がありません。<br/>絞り込みを変えてお試しください。</div>}
              {list.map(s=><ShopCard key={s.id} s={s}/>)}
            </div>
          )}
        </>
      )}

      {cur==='map' && (
        <>
          <DBar title={searchTitle} onBack={nav.length>1?back:null}/>
          <FilterChips/>
          <div style={{flex:1,position:'relative',overflow:'hidden',background:'repeating-linear-gradient(45deg,#e4e9e6 0 10px,#eff3f0 10px 20px)'}}>
            <span style={{position:'absolute',left:'50%',top:12,transform:'translateX(-50%)',fontFamily:'ui-monospace,Menlo,monospace',fontSize:10,color:'#7c8683'}}>地図表示エリア</span>
            {list.map(s=>(
              <div key={s.id} onClick={()=>setSel(s.id)} style={{position:'absolute',left:s.pin.x,top:s.pin.y,cursor:'pointer',
                display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                <div style={{width:40,height:40,borderRadius:'50%',background:sel===s.id?GRN:PINK,display:'flex',alignItems:'center',
                  justifyContent:'center',boxShadow:'0 4px 10px rgba(0,0,0,.25)',border:'2.5px solid #fff'}}>
                  <Icon n={(D_CATS.find(c=>c[0]===s.cat)||['','place'])[1]} s={21} c="#fff"/>
                </div>
              </div>
            ))}
            <div style={{position:'absolute',left:12,right:12,bottom:96}}>
              <div onClick={()=>{setSel(shop.id);push('detail');}} style={{background:'#fff',borderRadius:14,padding:15,boxShadow:'0 6px 20px rgba(0,0,0,.16)',cursor:'pointer'}}>
                <div className="row" style={{justifyContent:'space-between',gap:8}}>
                  <span style={{fontSize:19,fontWeight:700,color:'#1d2422'}}>{shop.name}</span>
                  <StatusTag status={shop.status}/>
                </div>
                <div style={{fontSize:16,color:'#2f3a37',marginTop:7}}>{shop.summary}</div>
                <div className="row" style={{gap:7,marginTop:8}}>
                  <Icon n="location_on" s={19} c="#7c8683"/><span style={{fontSize:15,color:'#4a5451'}}>{shop.addr}</span>
                </div>
                <div style={{fontSize:13.5,color:'#8b9491',marginTop:7}}>最終確認 {shop.last}</div>
              </div>
            </div>
          </div>
        </>
      )}

      {cur==='detail' && (
        <>
          <DBar title="支援情報の詳細" onBack={back}/>
          {body(
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <Ph label="お店の写真" w="100%" h={180} r={14}/>
              <div className="row" style={{justifyContent:'space-between',gap:8}}>
                <span style={{fontSize:24,fontWeight:900,color:'#1d2422'}}>{shop.name}</span>
                <StatusTag status={shop.status}/>
              </div>
              <div style={{fontSize:17,color:'#2f3a37',lineHeight:1.65}}>{shop.summary}</div>
              <div style={{background:'#fff',borderRadius:14,border:'1px solid #e2e7e5',overflow:'hidden'}}>
                {[['schedule','提供時間',shop.hours],['location_on','住所',shop.addr],['call','電話番号',shop.tel],
                  ['redeem','支援内容',shop.summary],['payments','料金',shop.price],['inventory_2','数量制限',shop.limit],
                  ['update','最終確認日時',shop.last],['task_alt','確認方法',shop.check]].map(([icon,label,val],i)=>(
                  <div key={label} style={{display:'flex',gap:11,padding:'14px 15px',borderTop:i?'1px solid #eef1f0':'none'}}>
                    <Icon n={icon} s={21} c="#8b9491"/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13.5,color:'#8b9491'}}>{label}</div>
                      <div style={{fontSize:16.5,color:'#1d2422',marginTop:3,lineHeight:1.55}}>{val}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{display:'flex',gap:10}}>
                <div style={{flex:1}}><BigBtn bg={GRN}><Icon n="call" s={24} c="#fff"/>電話する</BigBtn></div>
                <div style={{flex:1}}><BigBtn bg="#fff" fg={GRN_D} bd={GRN}><Icon n="near_me" s={24} c={GRN_D}/>道案内を見る</BigBtn></div>
              </div>
              <BigBtn bg="#fff" fg={PINK} bd="#f0c6ca" onClick={()=>setThanks(p=>({...p,[shop.id]:!p[shop.id]}))}>
                <Icon n="favorite" s={24} c={thanks[shop.id]?PINK:'#e9b7bc'}/>
                ありがとうを送る　{shop.thanks+(thanks[shop.id]?1:0)}
              </BigBtn>
            </div>
          )}
        </>
      )}

      {cur==='filter' && (
        <>
          <DBar title="絞り込み" onBack={back}/>
          {body(
            <div style={{display:'flex',flexDirection:'column',gap:22}}>
              {[['営業状況',D_FILTERS.status,fStatus,setFStatus],['料金',D_FILTERS.price,fPrice,setFPrice]].map(([title,opts,val,set])=>(
                <div key={title}>
                  <div style={{fontSize:17,fontWeight:700,color:'#1d2422',marginBottom:10}}>{title}</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:9}}>
                    {opts.map(o=>(
                      <div key={o} onClick={()=>set(o)} style={{padding:'11px 16px',borderRadius:10,cursor:'pointer',fontSize:15.5,fontWeight:700,
                        background:val===o?GRN:'#fff',color:val===o?'#fff':'#3a4441',border:`1.5px solid ${val===o?GRN:'#d3dad8'}`}}>{o}</div>
                    ))}
                  </div>
                </div>
              ))}
              <div>
                <div style={{fontSize:17,fontWeight:700,color:'#1d2422',marginBottom:10}}>その他</div>
                <div style={{background:'#fff',borderRadius:12,border:'1px solid #e2e7e5',overflow:'hidden'}}>
                  {D_FILTERS.other.map((o,i)=>(
                    <div key={o} onClick={()=>setFOther(p=>({...p,[o]:!p[o]}))} className="row"
                      style={{gap:12,padding:'16px 15px',borderTop:i?'1px solid #eef1f0':'none',cursor:'pointer'}}>
                      <Icon n={fOther[o]?'check_box':'check_box_outline_blank'} s={26} c={fOther[o]?GRN:'#b6bfbc'}/>
                      <span style={{fontSize:16.5,color:'#1d2422'}}>{o}</span>
                    </div>
                  ))}
                </div>
              </div>
              <BigBtn bg={GRN} onClick={back}>この条件で検索する</BigBtn>
            </div>
          )}
        </>
      )}

      {cur==='support' && (
        <>
          <DBar title="支援したい方へ" onBack={back}/>
          {body(
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div style={{fontSize:15,color:'#5b6663',lineHeight:1.7,textAlign:'center'}}>支援しているお店やプロジェクトを<br/>応援できます</div>
              {D_SUPPORT_WAYS.map(([title,sub,icon,c,bg],i)=>(
                <div key={title} onClick={()=>{if(i===0)push('shops');if(i===1){setDonor(YOKA_FUND);push('donate');}if(i===2)push('donors');if(i===3)push('volunteer');if(i===4)push('share');}} className="row"
                  style={{gap:13,padding:'18px 16px',borderRadius:14,background:bg,cursor:'pointer',minHeight:82}}>
                  <Icon n={icon} s={28} c={c}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:18,fontWeight:700,color:c}}>{title}</div>
                    <div style={{fontSize:14.5,color:'#5b6663',marginTop:4}}>{sub}</div>
                  </div>
                  <Icon n="chevron_right" s={24} c="#b6bfbc"/>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {cur==='shops' && (
        <>
          <DBar title="支援中のお店一覧" onBack={back}/>
          {body(
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div style={{fontSize:15,color:'#5b6663',textAlign:'center'}}>被災者支援をしているお店を応援しよう</div>
              {D_SUPPORT_SHOPS.map(s=>(
                <div key={s.id} onClick={()=>{setSelShop(s.id);push('shopDetail');}}
                  style={{background:'#fff',borderRadius:14,border:'1px solid #e2e7e5',padding:14,display:'flex',gap:13,cursor:'pointer'}}>
                  <Ph label="写真" w={82} h={82} r={11}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:18,fontWeight:700,color:'#1d2422'}}>{s.name}</div>
                    <div style={{fontSize:14.5,color:'#4a5451',marginTop:4,lineHeight:1.55}}>{s.note}</div>
                    <div className="row" style={{gap:8,marginTop:11}}>
                      <div className="row" style={{gap:5,padding:'10px 12px',borderRadius:9,background:PINK}}>
                        <Icon n="payments" s={17} c="#fff"/><span style={{fontSize:14,fontWeight:700,color:'#fff'}}>100円から募金</span>
                      </div>
                      <div onClick={(e)=>{e.stopPropagation();setCheers(p=>({...p,[s.id]:!p[s.id]}));}} className="row"
                        style={{gap:5,padding:'10px 12px',borderRadius:9,cursor:'pointer',
                          background:cheers[s.id]?'#fdeff0':'#fff',border:`1.5px solid ${cheers[s.id]?PINK:'#e2c9cc'}`}}>
                        <Icon n={cheers[s.id]?'favorite':'favorite_border'} s={17} c={PINK}/>
                        <span style={{fontSize:14,fontWeight:700,color:PINK}}>{cheers[s.id]?'応援中':'応援する'}</span>
                      </div>
                    </div>
                    {cheers[s.id] && <div className="fade" style={{fontSize:13,color:'#b0787f',marginTop:7}}>お店に「ありがとう」が届きました</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {cur==='shopDetail' && (
        <>
          <DBar title="お店のページ" onBack={back}/>
          {body(
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <Ph label="お店の写真" w="100%" h={180} r={14}/>
              <div style={{fontSize:24,fontWeight:900,color:'#1d2422'}}>{sshop.name}</div>
              <div style={{fontSize:17,color:'#2f3a37',lineHeight:1.65}}>{sshop.note}</div>

              <div style={{background:'#fff',borderRadius:14,border:'1px solid #e2e7e5',padding:16}}>
                <div style={{fontSize:15,fontWeight:700,color:'#3a4441',marginBottom:8}}>お店からのメッセージ</div>
                <div style={{fontSize:16.5,color:'#1d2422',lineHeight:1.8}}>{sshop.msg}</div>
              </div>

              <div style={{background:'#fff',borderRadius:14,border:'1px solid #e2e7e5',overflow:'hidden'}}>
                {[['location_on','住所',sshop.addr],['call','電話番号',sshop.tel],['schedule','営業時間',sshop.hours]].map(([icon,label,val],i)=>(
                  <div key={label} style={{display:'flex',gap:11,padding:'14px 15px',borderTop:i?'1px solid #eef1f0':'none'}}>
                    <Icon n={icon} s={21} c="#8b9491"/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13.5,color:'#8b9491'}}>{label}</div>
                      <div style={{fontSize:16.5,color:'#1d2422',marginTop:3}}>{val}</div>
                    </div>
                  </div>
                ))}
              </div>

              <BigBtn bg={PINK} onClick={()=>{setDonor(null);push('donate');}}>
                <Icon n="payments" s={26} c="#fff"/>100円から募金する
              </BigBtn>
              <BigBtn bg="#fff" fg={GRN_D} bd={GRN}>
                <Icon n="shopping_bag" s={24} c={GRN_D}/>商品を購入して応援
              </BigBtn>
            </div>
          )}
        </>
      )}

      {cur==='donate' && (
        <>
          <DBar title="募金で応援する" onBack={back}/>
          {body(
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              <div style={{background:'#fff',borderRadius:14,border:'1px solid #e2e7e5',padding:16}}>
                <div style={{fontSize:14,color:'#8b9491'}}>応援先</div>
                <div style={{fontSize:20,fontWeight:700,color:'#1d2422',marginTop:5,lineHeight:1.5}}>{recipient}</div>
                {donor && <div style={{fontSize:14.5,color:'#5b6663',marginTop:6,lineHeight:1.6}}>{donor[1]}</div>}
              </div>
              <div>
                <div style={{fontSize:18,fontWeight:700,color:'#1d2422',marginBottom:4}}>金額を選んでください</div>
                <div style={{fontSize:14.5,color:'#7c8683',marginBottom:12}}>100円から応援できます</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:11}}>
                  {D_AMOUNTS.map(a=>{
                    const on=amount===a;
                    return (
                      <div key={a} onClick={()=>setAmount(a)} style={{minHeight:70,borderRadius:13,cursor:'pointer',
                        display:'flex',alignItems:'center',justifyContent:'center',fontSize:a.length>6?16:20,fontWeight:700,
                        background:on?GRN:'#fff',color:on?'#fff':'#1d2422',border:`2px solid ${on?GRN:'#d3dad8'}`}}>{a}</div>
                    );
                  })}
                </div>
              </div>
              <div style={{background:'#fff',borderRadius:14,border:'1px solid #e2e7e5',padding:16,fontSize:15,color:'#4a5451',lineHeight:1.8}}>
                {isFund
                  ? 'ここに募金されたお金は、YOKAがまとめて被災地の支援活動へお届けします。'
                  : 'ご支援は、このお店が支援を続けるための仕入れ・燃料などの費用に使われます。'}
                <br/>※デモ表示のため、実際の決済は行われません。
              </div>
              <BigBtn bg={PINK} onClick={()=>push('donateConfirm')}>確認画面へ</BigBtn>
            </div>
          )}
        </>
      )}

      {cur==='donateConfirm' && (
        <>
          <DBar title="内容の確認" onBack={back}/>
          {body(
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              <div style={{fontSize:17,color:'#4a5451',lineHeight:1.7,textAlign:'center'}}>この内容でよろしいですか？</div>
              <div style={{background:'#fff',borderRadius:14,border:'1px solid #e2e7e5',overflow:'hidden'}}>
                {[['応援先',recipient],['金額',amount],['お支払い方法','デモのため決済は行われません']].map(([label,val],i)=>(
                  <div key={label} style={{padding:'16px 15px',borderTop:i?'1px solid #eef1f0':'none'}}>
                    <div style={{fontSize:14,color:'#8b9491'}}>{label}</div>
                    <div style={{fontSize:19,fontWeight:700,color:'#1d2422',marginTop:4}}>{val}</div>
                  </div>
                ))}
              </div>
              <BigBtn bg={PINK} onClick={()=>push('donateDone')}>この内容で募金する</BigBtn>
              <BigBtn bg="#fff" fg="#3a4441" bd="#d3dad8" onClick={back}>戻って修正する</BigBtn>
            </div>
          )}
        </>
      )}

      {cur==='donateDone' && (
        <>
          <DBar title="完了"/>
          {body(
            <div style={{display:'flex',flexDirection:'column',gap:18,alignItems:'center',paddingTop:24}}>
              <div style={{width:96,height:96,borderRadius:'50%',background:'#e3f3e8',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <Icon n="check" s={52} c={GRN}/>
              </div>
              <div style={{fontSize:23,fontWeight:900,color:'#1d2422',textAlign:'center',lineHeight:1.5}}>ご支援ありがとう<br/>ございました</div>
              <div style={{fontSize:17,color:'#4a5451',textAlign:'center',lineHeight:1.8}}>{recipient} へ<br/>{amount} をお送りしました（デモ）。</div>
              <div style={{width:'100%',background:'#fff',borderRadius:14,border:'1px solid #e2e7e5',padding:16,fontSize:15,color:'#4a5451',lineHeight:1.8}}>
                これはデモ表示です。実際の募金機能は準備中です。
              </div>
              <div style={{width:'100%'}}><BigBtn bg={GRN} onClick={()=>reset(donor?'support':'shops')}>{donor?'支援メニューに戻る':'お店の一覧に戻る'}</BigBtn></div>
            </div>
          )}
        </>
      )}

      {cur==='donors' && (
        <>
          <DBar title="寄付で応援する" onBack={back}/>
          {body(
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div style={{fontSize:15,color:'#5b6663',textAlign:'center',lineHeight:1.7}}>公式の寄付先一覧です</div>
              {D_DONORS.map(([name,note])=>(
                <div key={name} style={{background:'#fff',borderRadius:14,border:'1px solid #e2e7e5',padding:16}}>
                  <div style={{fontSize:18,fontWeight:700,color:'#1d2422',lineHeight:1.5}}>{name}</div>
                  <div style={{fontSize:15,color:'#4a5451',marginTop:6,lineHeight:1.65}}>{note}</div>
                  <div style={{marginTop:12}}>
                    <BigBtn bg="#fff" fg={GRN_D} bd={GRN} onClick={()=>{setDonor([name,note]);push('donate');}}>寄付する</BigBtn>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {cur==='volunteer' && (
        <>
          <DBar title="ボランティアに参加する" onBack={back}/>
          {body(
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div style={{fontSize:15,color:'#5b6663',textAlign:'center',lineHeight:1.7}}>募集中のボランティアです</div>
              {D_VOLS.map(([title,place,when,need])=>(
                <div key={title} style={{background:'#fff',borderRadius:14,border:'1px solid #e2e7e5',padding:16}}>
                  <div style={{fontSize:18,fontWeight:700,color:'#1d2422',lineHeight:1.5}}>{title}</div>
                  <div style={{fontSize:15,color:'#4a5451',marginTop:8,lineHeight:1.7}}>{place}<br/>{when}</div>
                  <div style={{fontSize:14,color:'#8b9491',marginTop:6}}>{need}</div>
                  <div style={{marginTop:12}}><BigBtn bg="#fff" fg={GRN_D} bd={GRN}>参加を申し込む</BigBtn></div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {cur==='share' && (
        <>
          <DBar title="情報をシェア・拡散する" onBack={back}/>
          {body(
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div style={{fontSize:16,color:'#4a5451',textAlign:'center',lineHeight:1.8}}>支援情報を広めて、<br/>必要な人に届けましょう</div>
              <div style={{background:'#fff',borderRadius:14,border:'1px solid #e2e7e5',padding:16,fontSize:16,color:'#1d2422',lineHeight:1.8}}>
                大和市の支援情報マップ「YOKA MAP」で、いま営業しているお店や給水所を確認できます。
              </div>
              {[['LINEで送る','chat','#2f9e6b'],['メールで送る','mail','#3b7dd8'],['リンクをコピーする','link','#8b5cd6']].map(([label,icon,c])=>(
                <BigBtn key={label} bg="#fff" fg="#1d2422" bd="#d3dad8"><Icon n={icon} s={24} c={c}/>{label}</BigBtn>
              ))}
            </div>
          )}
        </>
      )}

      {cur==='form' && (
        <>
          <DBar title="情報を提供する" onBack={nav.length>1?back:null}/>
          {body(
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              <div style={{fontSize:16,color:'#4a5451',lineHeight:1.7,textAlign:'center'}}>支援情報を教えてください</div>
              {D_FORM.map(([label,ph])=>(
                <div key={label}>
                  <div style={{fontSize:15,fontWeight:700,color:'#3a4441',marginBottom:7}}>{label}</div>
                  <div style={{padding:'16px 14px',borderRadius:11,background:'#fff',border:'1.5px solid #d3dad8',fontSize:16,color:'#a3aca9'}}>{ph}</div>
                </div>
              ))}
              <BigBtn bg={GRN}>確認画面へ</BigBtn>
              <div style={{fontSize:13.5,color:'#8b9491',textAlign:'center',lineHeight:1.7}}>送信された情報は自治体・運営が確認のうえ掲載されます。</div>
            </div>
          )}
        </>
      )}

      {cur==='my' && (
        <>
          <DBar title="マイページ" onBack={nav.length>1?back:null}/>
          {body(
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div style={{background:'#fff',borderRadius:14,border:'1px solid #e2e7e5',padding:16}}>
                <div style={{fontSize:19,fontWeight:700,color:'#1d2422'}}>YOKA 花子</div>
                <div style={{fontSize:15,color:'#5b6663',marginTop:6,lineHeight:1.6}}>安否登録済み<br/>避難所「大和小学校」</div>
              </div>
              <BigBtn bg="#fff" fg={GRN_D} bd={GRN} onClick={exitDisaster}>
                <Icon n="restart_alt" s={24} c={GRN_D}/>平常モードに戻す
              </BigBtn>
            </div>
          )}
        </>
      )}

      <TabBar cur={tabFor} set={onTab} accent={GRN} items={tabs}/>
    </>
  );
}


window.Disaster = Disaster;
