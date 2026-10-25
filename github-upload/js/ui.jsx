const {useState, useEffect, useRef, useMemo} = React;
const TEAL='#0f8e7f', TEAL_D='#0c7264', GREY='#9aa5a2', RED='#c93348', INK='#22312e', SUB='#6b7674';

const Icon = ({n, s=20, c='#4a5754'}) => (
  <span style={{fontFamily:"'Material Symbols Rounded'",fontSize:s,color:c,lineHeight:1}}>{n}</span>
);

const Ph = ({label, w, h, r=10, dark}) => (
  <div style={{width:w,height:h,borderRadius:r,flex:'none',display:'flex',alignItems:'center',justifyContent:'center',
    background:`repeating-linear-gradient(45deg,${dark?'#ecebe8':'#e9edeb'} 0 6px,${dark?'#f6f5f2':'#f4f7f5'} 6px 12px)`}}>
    <span style={{fontFamily:'ui-monospace,Menlo,monospace',fontSize:8,color:'#9aa5a2',textAlign:'center'}}>{label}</span>
  </div>
);

const Card = ({children, style, className, onClick}) => (
  <div className={className} onClick={onClick} style={{background:'#fff',borderRadius:14,boxShadow:'0 1px 3px rgba(0,0,0,.06)',overflow:'hidden',cursor:onClick?'pointer':undefined,...style}}>{children}</div>
);

const SampleBadge = ({label='サンプル'}) => (
  <span style={{fontSize:10.5,fontWeight:700,padding:'2px 7px',borderRadius:4,background:'#fff4dc',color:'#8a5d00',border:'1px solid #f1d9a4',whiteSpace:'nowrap'}}>{label}</span>
);

const Notice = ({icon='info', children, tone='info'}) => {
  const t = {info:['#eef6f4','#0c7264'], warn:['#fff6e6','#8a5d00'], error:['#fdeced','#b4283c']}[tone];
  return (
    <div style={{display:'flex',gap:9,padding:'12px 13px',borderRadius:12,background:t[0],alignItems:'flex-start'}}>
      <Icon n={icon} s={19} c={t[1]}/>
      <div style={{fontSize:12.5,lineHeight:1.7,color:'#2c3a37',flex:1}}>{children}</div>
    </div>
  );
};

const Btn = ({children, onClick, kind='primary', disabled, style, type='button'}) => {
  const k = {primary:[TEAL,'#fff',TEAL], ghost:['#fff',TEAL_D,'#cfe0d9'], danger:['#fff','#c22e43','#f3c2c7'], plain:['#f1f3f2','#4a5754','#f1f3f2']}[kind];
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:7,width:'100%',
      minHeight:48,padding:'12px 16px',borderRadius:12,border:`1.5px solid ${k[2]}`,background:k[0],color:k[1],fontSize:14.5,fontWeight:700,
      fontFamily:'inherit',cursor:disabled?'default':'pointer',opacity:disabled?.55:1,...style}}>{children}</button>
  );
};

const inputStyle = {width:'100%',boxSizing:'border-box',padding:'12px 13px',borderRadius:10,border:'1.5px solid #dfe5e3',background:'#fff',
  fontSize:15,fontFamily:'inherit',color:INK,outline:'none'};

const Field = ({label, hint, children}) => (
  <label style={{display:'flex',flexDirection:'column',gap:6}}>
    <span style={{fontSize:12.5,fontWeight:700,color:'#3d4a47'}}>{label}</span>
    {children}
    {hint && <span style={{fontSize:11.5,color:'#8a9491'}}>{hint}</span>}
  </label>
);

function useIsMobile() {
  const q = '(max-width: 600px)';
  const [m, setM] = useState(() => window.matchMedia(q).matches);
  useEffect(() => { const mq = window.matchMedia(q); const f = () => setM(mq.matches); mq.addEventListener('change', f); return () => mq.removeEventListener('change', f); }, []);
  return m;
}

function Phone({children, mobile}) {
  if (mobile) {
    return (
      <div style={{width:'100vw',height:'100dvh',position:'relative',overflow:'hidden',background:'#f4f6f5',
        '--top':'calc(env(safe-area-inset-top) + 8px)','--bot':'calc(env(safe-area-inset-bottom) + 10px)'}}>
        <div style={{height:'100%',display:'flex',flexDirection:'column',position:'relative',overflow:'hidden'}}>{children}</div>
      </div>
    );
  }
  return (
    <div style={{width:402,height:874,borderRadius:48,overflow:'hidden',position:'relative',background:'#f4f6f5',flex:'none',
      boxShadow:'0 40px 80px rgba(0,0,0,.18), 0 0 0 1px rgba(0,0,0,.12)','--top':'54px','--bot':'26px'}}>
      <div style={{position:'absolute',top:11,left:'50%',transform:'translateX(-50%)',width:126,height:37,borderRadius:24,background:'#000',zIndex:1500}}/>
      <div style={{height:'100%',display:'flex',flexDirection:'column',position:'relative',overflow:'hidden'}}>{children}</div>
      <div style={{position:'absolute',bottom:0,left:0,right:0,zIndex:1500,height:34,display:'flex',justifyContent:'center',alignItems:'flex-end',paddingBottom:8,pointerEvents:'none'}}>
        <div style={{width:139,height:5,borderRadius:100,background:'rgba(0,0,0,.25)'}}/>
      </div>
    </div>
  );
}

function TabBar({items, cur, set, accent}) {
  return (
    <div style={{position:'absolute',left:0,right:0,bottom:0,padding:'8px 6px var(--bot)',background:'rgba(255,255,255,.96)',
      backdropFilter:'blur(12px)',borderTop:'1px solid rgba(0,0,0,.07)',display:'flex',zIndex:1000}}>
      {items.map(([id,label,icon])=>{
        const c = cur===id ? accent : GREY;
        return (
          <div key={id} onClick={()=>set(id)} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3,cursor:'pointer',minHeight:44,justifyContent:'center'}}>
            <Icon n={icon} s={23} c={c}/>
            <span style={{fontSize:9.5,fontWeight:700,color:c}}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

const Logo = () => (
  <div style={{position:'relative',width:20,height:20}}>
    {[['6px',0,null,null,'#4bb7a5'],[null,'5px',0,null,'#7cc35c'],[null,null,'2px','0','#f0b04a'],['2px',null,null,'0','#ea6f86'],['0','5px',null,null,'#5b9bd8']]
      .map(([l,t,r,b,c],i)=>(<div key={i} style={{position:'absolute',left:l,top:t,right:r,bottom:b,width:8,height:8,borderRadius:'50%',background:c}}/>))}
  </div>
);

function PageHead({title, onBack, children}) {
  return (
    <div style={{padding:'var(--top) 14px 12px',background:'#fff',boxShadow:'0 1px 0 rgba(0,0,0,.06)',flex:'none'}}>
      <div className="row" style={{height:40}}>
        <div style={{width:64}}>
          {onBack && <div onClick={onBack} className="row" style={{gap:2,cursor:'pointer',minHeight:40}}>
            <Icon n="arrow_back" s={22} c={TEAL_D}/><span style={{fontSize:13,fontWeight:700,color:TEAL_D}}>戻る</span></div>}
        </div>
        <div style={{flex:1,textAlign:'center',fontSize:15,fontWeight:700,color:INK}}>{title}</div>
        <div style={{width:64}}/>
      </div>
      {children}
    </div>
  );
}

const Scroll = ({children, pad='14px 14px 110px', style}) => (
  <div className="scroll fade" style={{flex:1,overflow:'auto',padding:pad,...style}}>{children}</div>
);

const ExtLink = ({href, children}) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="row" style={{gap:10,padding:'13px 14px',borderTop:'1px solid #f0f2f1',color:INK}}>
    <span style={{fontSize:13.5,flex:1}}>{children}</span><Icon n="open_in_new" s={17} c="#9aa5a2"/>
  </a>
);
