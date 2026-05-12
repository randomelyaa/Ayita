import { useState, useEffect, useRef } from "react";

const RECURRING = [
  { id:'r1', name:'Revisar Notion de finanzas', minutes:10, priority:'high', category:'Ahorralium', isRecurring:true },
  { id:'r2', name:'Revisar correos', minutes:10, priority:'high', category:'Administración', isRecurring:true },
  { id:'r3', name:'Asignar tareas del día', minutes:10, priority:'high', category:'BUT', isRecurring:true },
  { id:'r4', name:'Revisar cuentas de clientes', minutes:10, priority:'high', category:'BUT', isRecurring:true },
];
const CATS = ['BUT','Ahorralium','Administración','Casa','Otros'];
const CCOL = { BUT:'#3D8F6E', Ahorralium:'#C97B3A', Administración:'#5B7EC9', Casa:'#B85C5C', Otros:'#8A8070' };
const PD = { high:{c:'#B85C5C',bg:'#F9EDEB',l:'Alta'}, medium:{c:'#C97B3A',bg:'#FBF1E8',l:'Media'}, low:{c:'#3D8F6E',bg:'#EAF3EE',l:'Baja'} };
const PO = { high:0, medium:1, low:2 };
const PHASES = [
  { name:'Fase Luna', emoji:'🌙', range:[1,5], color:'#7B9ED9', tip:'Energía baja · reflexión y creatividad ligera', recs:['Revisión tranquila','Journaling','Admin simples','Creatividad libre'] },
  { name:'Fase Primavera', emoji:'🌱', range:[6,13], color:'#4CAF84', tip:'Energía creciente · nuevos proyectos y planificación', recs:['Nuevos proyectos','Brainstorming','Estrategia','Reuniones'] },
  { name:'Fase Sol', emoji:'☀️', range:[14,17], color:'#D4885A', tip:'Pico de energía · comunicación y alto rendimiento', recs:['Ventas y pitches','Videos','Networking','Presentaciones'] },
  { name:'Fase Otoño', emoji:'🍂', range:[18,28], color:'#C97B3A', tip:'Energía descendente · detalles y cierre de ciclos', recs:['Edición','Métricas','Organizar','Finalizar proyectos'] },
];
const ACHS = [
  { id:'first_task', emoji:'🌱', name:'Primera tarea', desc:'Completaste tu primera tarea', check:s=>s.total>=1 },
  { id:'streak_3', emoji:'🔥', name:'3 días de racha', desc:'3 días consecutivos activa', check:s=>s.streak>=3 },
  { id:'streak_7', emoji:'🌿', name:'7 días de racha', desc:'Una semana sin parar', check:s=>s.streak>=7 },
  { id:'streak_30', emoji:'💚', name:'Un mes de foco', desc:'30 días de racha', check:s=>s.streak>=30 },
  { id:'perfect_day', emoji:'✨', name:'Día perfecto', desc:'Todas las tareas del día completadas', check:s=>s.perfect>=1 },
  { id:'perfect_5', emoji:'🌙', name:'5 días perfectos', desc:'5 días perfectos acumulados', check:s=>s.perfect>=5 },
  { id:'tasks_10', emoji:'⚡', name:'10 tareas', desc:'10 tareas completadas en total', check:s=>s.total>=10 },
  { id:'tasks_50', emoji:'🏆', name:'50 tareas', desc:'50 tareas completadas', check:s=>s.total>=50 },
  { id:'first_note', emoji:'📝', name:'Primera nota', desc:'Creaste tu primera nota', check:s=>s.notes>=1 },
  { id:'focus_5', emoji:'🎯', name:'Modo foco x5', desc:'Usaste el modo foco 5 veces', check:s=>s.focus>=5 },
];

const playSound = type => {
  try {
    const ctx = new (window.AudioContext||window.webkitAudioContext)();
    const seq = type==='chime'?[[528,0],[660,0.15],[792,0.3]]:type==='complete'?[[523,0],[659,0.12],[784,0.24],[1047,0.36]]:[[1100,0]];
    seq.forEach(([freq,delay])=>{
      const o=ctx.createOscillator(),g=ctx.createGain();
      o.connect(g);g.connect(ctx.destination);
      o.type='sine';o.frequency.value=freq;
      const t=ctx.currentTime+delay;
      g.gain.setValueAtTime(0,t);
      g.gain.linearRampToValueAtTime(type==='tick'?0.04:0.18,t+0.03);
      g.gain.exponentialRampToValueAtTime(0.001,t+(type==='tick'?0.07:0.75));
      o.start(t);o.stop(t+(type==='tick'?0.09:0.9));
    });
  } catch {}
};

const Confetti = ({active,onDone}) => {
  const ref = useRef();
  useEffect(()=>{
    if(!active)return;
    const cv=ref.current; if(!cv)return;
    const ctx=cv.getContext('2d');
    cv.width=cv.offsetWidth; cv.height=cv.offsetHeight;
    const cols=['#4CAF84','#D4885A','#F5F0E8','#7B9ED9','#B85C5C','#3D8F6E','#FFD700'];
    const pts=Array.from({length:90},()=>({x:Math.random()*cv.width,y:-15,vx:(Math.random()-0.5)*4,vy:Math.random()*4+2,c:cols[Math.floor(Math.random()*cols.length)],s:Math.random()*9+4,r:Math.random()*360,vr:(Math.random()-0.5)*10}));
    let af;
    const draw=()=>{
      ctx.clearRect(0,0,cv.width,cv.height);
      let alive=false;
      pts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;p.vy+=0.06;
        if(p.y<cv.height+20)alive=true;
        ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.r*Math.PI/180);
        ctx.fillStyle=p.c;ctx.fillRect(-p.s/2,-p.s/4,p.s,p.s/2);ctx.restore();
      });
      if(alive)af=requestAnimationFrame(draw);
      else{ctx.clearRect(0,0,cv.width,cv.height);onDone&&onDone();}
    };
    af=requestAnimationFrame(draw);
    return()=>cancelAnimationFrame(af);
  },[active]);
  if(!active)return null;
  return <canvas ref={ref} style={{position:'fixed',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:999}}/>;
};

export default function Ayita() {
  useEffect(()=>{
    const l=document.createElement('link');l.rel='stylesheet';
    l.href='https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;1,400;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap';
    document.head.appendChild(l);return()=>{try{document.head.removeChild(l);}catch{}};
  },[]);

  const [dark,setDark]=useState(false);
  const [view,setView]=useState('home');
  const [sub,setSub]=useState('cycle');
  const [tasks,setTasks]=useState([]);
  const [done,setDone]=useState([]);
  const [notes,setNotes]=useState([]);
  const [stats,setStats]=useState({streak:0,best:0,total:0,perfect:0,notes:0,focus:0,lastDate:null});
  const [achs,setAchs]=useState([]);
  const [cycle,setCycle]=useState({last:null,len:28});
  const [active,setActive]=useState(null);
  const [tLeft,setTLeft]=useState(0);
  const [tTotal,setTTotal]=useState(0);
  const [running,setRunning]=useState(false);
  const [ciMins,setCiMins]=useState(15);
  const [modal,setModal]=useState(null);
  const [confetti,setConfetti]=useState(false);
  const [newAch,setNewAch]=useState(null);
  const [sortBy,setSortBy]=useState('priority');
  const [fCat,setFCat]=useState('Todas');
  const [form,setForm]=useState({name:'',minutes:25,priority:'medium',category:'BUT',start:'',end:''});
  const [nForm,setNForm]=useState({text:'',category:'BUT'});
  const [loaded,setLoaded]=useState(false);
  const timerRef=useRef(); const ciRef=useRef(0); const ssRef=useRef(null);
  const achRef=useRef(achs);
  
  useEffect(()=>{achRef.current=achs;},[achs]);

  const D=dark?{bg:'#091A0D',bgD:'#0F2218',bgDD:'#162E1C',card:'#0F2218',border:'#1A3522',ink:'#F5F0E8',muted:'#7AAF88',em:'#4CAF84',emL:'#6DC99A',nav:'#091A0D',inp:'#162E1C'}
    :{bg:'#F5F0E8',bgD:'#EDE6D8',bgDD:'#E0D8C8',card:'#FFFFFF',border:'#E0D8C8',ink:'#1A1209',muted:'#8A7E72',em:'#2E7D5E',emL:'#4CAF84',nav:'#FFFFFF',inp:'#F5F0E8'};

  // PASO 1: CARGA DE DATOS USANDO LOCALSTORAGE
  useEffect(()=>{
    const g=(k,fb)=>{
      try{
        const r=localStorage.getItem(k);
        return r?JSON.parse(r):fb;
      }catch(e){return fb;}
    };
    setTasks(g('ay_tasks',[...RECURRING]));
    setDone(g('ay_done',[]));
    setNotes(g('ay_notes',[]));
    setStats(g('ay_stats',{streak:0,best:0,total:0,perfect:0,notes:0,focus:0,lastDate:null}));
    setAchs(g('ay_achs',[]));
    setCycle(g('ay_cycle',{last:null,len:28}));
    setDark(g('ay_dark',false));
    setLoaded(true);
  },[]);

  // PASO 1: GUARDADO DE DATOS USANDO LOCALSTORAGE
  const sv=(k,v)=>{ 
    if(loaded) {
      try {
        localStorage.setItem(k,JSON.stringify(v));
      } catch(e) {}
    }
  };

  useEffect(()=>sv('ay_tasks',tasks),[tasks,loaded]);
  useEffect(()=>sv('ay_done',done),[done,loaded]);
  useEffect(()=>sv('ay_notes',notes),[notes,loaded]);
  useEffect(()=>sv('ay_stats',stats),[stats,loaded]);
  useEffect(()=>sv('ay_achs',achs),[achs,loaded]);
  useEffect(()=>sv('ay_cycle',cycle),[cycle,loaded]);
  useEffect(()=>sv('ay_dark',dark),[dark,loaded]);

  useEffect(()=>{
    clearInterval(timerRef.current);
    if(!running)return;
    timerRef.current=setInterval(()=>{
      ciRef.current++;
      if(ciRef.current%60===0) playSound('tick');
      if(ciRef.current>=ciMins*60){clearInterval(timerRef.current);setRunning(false);ciRef.current=0;playSound('chime');setModal('check');return;}
      setTLeft(t=>{if(t<=1){clearInterval(timerRef.current);setRunning(false);playSound('complete');setModal('timeup');return 0;}return t-1;});
    },1000);
    return()=>clearInterval(timerRef.current);
  },[running,ciMins]);

  const checkAchs=(ns,nl)=>{
    const s={...ns,notes:nl};
    ACHS.forEach(a=>{
      if(!achRef.current.includes(a.id)&&a.check(s)){
        setAchs(p=>{
          const u=[...p,a.id];
          localStorage.setItem('ay_achs',JSON.stringify(u)); // Ajuste aquí también
          return u;
        });
        setNewAch(a); setTimeout(()=>setModal('ach'),400);
      }
    });
  };

  const fmt=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const todayStr=new Date().toISOString().split('T')[0];

  const startTask=task=>{
    setActive(task);setTLeft(task.minutes*60);setTTotal(task.minutes*60);
    setRunning(false);ssRef.current=null;ciRef.current=0;setModal(null);
    const ns={...stats,focus:stats.focus+1};setStats(ns);checkAchs(ns,notes.length);setView('focus');
  };

  const markDone=()=>{
    clearInterval(timerRef.current);setRunning(false);
    const actual=ssRef.current?Math.round((Date.now()-ssRef.current)/60000):active.minutes;
    const newDone=[...done,{...active,actual,at:new Date().toISOString()}];
    setDone(newDone); setTasks(p=>p.filter(t=>t.id!==active.id));
    const yesterday=new Date();yesterday.setDate(yesterday.getDate()-1);
    const yStr=yesterday.toISOString().split('T')[0];
    let ns=stats.streak;
    if(stats.lastDate!==todayStr){ns=(stats.lastDate===yStr)?stats.streak+1:1;}
    const newStats={...stats,total:stats.total+1,streak:ns,best:Math.max(stats.best,ns),lastDate:todayStr};
    setStats(newStats);setModal(null);setConfetti(true);playSound('complete');
    setView('home');checkAchs(newStats,notes.length);
  };

  const getPhase=()=>{
    if(!cycle.last)return null;
    const d=Math.floor((new Date()-new Date(cycle.last))/(864e5))%cycle.len+1;
    return PHASES.find(p=>d>=p.range[0]&&d<=p.range[1])||PHASES[3];
  };
  const phase=getPhase();

  const allSorted=[...tasks].filter(t=>fCat==='Todas'||t.category===fCat)
    .sort((a,b)=>sortBy==='priority'?PO[a.priority]-PO[b.priority]:sortBy==='duration'?a.minutes-b.minutes:(!a.end?1:!b.end?-1:new Date(a.end)-new Date(b.end)));

  const notesByCat=notes.reduce((acc,n)=>{(acc[n.category]=acc[n.category]||[]).push(n);return acc;},{});
  const doneMins=done.reduce((s,t)=>s+(t.actual||t.minutes),0);
  const prog=tTotal>0?(tTotal-tLeft)/tTotal:0;
  const R=88,C=2*Math.PI*R;
  const todayFmt=new Date().toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'});

  const IS={width:'100%',padding:'13px 15px',borderRadius:13,border:`1.5px solid ${D.border}`,fontSize:14,fontFamily:"'DM Sans',sans-serif",background:D.inp,color:D.ink,outline:'none',boxSizing:'border-box'};

  const NavBtn=({id,icon,label})=>(
    <button onClick={()=>setView(id)} style={{flex:1,background:'none',border:'none',display:'flex',flexDirection:'column',alignItems:'center',gap:2,padding:'6px 0',cursor:'pointer',opacity:view===id?1:0.4,transition:'opacity 0.2s'}}>
      <span style={{fontSize:19}}>{icon}</span>
      <span style={{fontSize:9.5,fontFamily:"'DM Sans',sans-serif",fontWeight:view===id?700:400,color:view===id?D.em:D.muted,letterSpacing:'0.03em'}}>{label}</span>
    </button>
  );

  const Card=({children,style={}})=>(
    <div style={{background:D.card,borderRadius:18,padding:'14px 16px',marginBottom:10,border:`1px solid ${D.border}`,boxShadow:dark?'none':'0 2px 12px rgba(0,0,0,0.04)',...style}}>{children}</div>
  );

  const Btn=({onClick,children,style={},variant='primary'})=>{
    const base={padding:'13px',borderRadius:13,border:'none',fontSize:13.5,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",transition:'transform 0.15s'};
    const vs={primary:{background:D.em,color:'#fff',boxShadow:`0 4px 16px ${D.em}44`},ghost:{background:'transparent',color:D.muted,border:`1px solid ${D.border}`},soft:{background:dark?'#0F2218':'#EAF5EF',color:D.em,border:`1.5px solid ${D.em}44`}};
    return <button onClick={onClick} style={{...base,...vs[variant],...style}}>{children}</button>;
  };

  const SectionLabel=({children})=>(
    <div style={{fontSize:10,color:D.muted,fontWeight:700,letterSpacing:'0.09em',textTransform:'uppercase',marginBottom:10,paddingLeft:2}}>{children}</div>
  );

  const Italic=({children,size=22,style={}})=>(
    <div style={{fontFamily:"'Playfair Display',serif",fontStyle:'italic',fontSize:size,color:D.em,fontWeight:600,...style}}>{children}</div>
  );

  const BottomModal=({children})=>(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',display:'flex',alignItems:'flex-end',zIndex:100,backdropFilter:'blur(7px)'}}>
      <div style={{background:D.nav,borderRadius:'26px 26px 0 0',padding:'28px 22px 48px',width:'100%',maxWidth:480,margin:'0 auto'}}>
        <div style={{width:36,height:4,background:D.bgDD,borderRadius:99,margin:'0 auto 22px'}}/>
        {children}
      </div>
    </div>
  );

  const CenterModal=({children})=>(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.65)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,backdropFilter:'blur(10px)',padding:24}}>
      <div style={{background:D.nav,borderRadius:26,padding:'36px 26px',maxWidth:310,width:'100%',textAlign:'center',boxShadow:'0 24px 60px rgba(0,0,0,0.3)',animation:'popIn 0.25s ease'}}>
        {children}
      </div>
    </div>
  );

  return (
    <div style={{fontFamily:"'DM Sans',sans-serif",background:D.bg,minHeight:'100vh',maxWidth:480,margin:'0 auto',display:'flex',flexDirection:'column',transition:'background 0.3s'}}>
      <Confetti active={confetti} onDone={()=>setConfetti(false)}/>

      {/* HEADER */}
      <div style={{background:D.nav,padding:'18px 22px 14px',borderBottom:`1px solid ${D.border}`,boxShadow:dark?'none':'0 1px 16px rgba(0,0,0,0.05)',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <div style={{fontFamily:"'Playfair Display',serif",fontStyle:'italic',fontSize:27,color:D.em,fontWeight:600,letterSpacing:'-0.5px',lineHeight:1}}>Ayita 🌿</div>
            <div style={{fontSize:11,color:D.muted,marginTop:3,fontWeight:300,textTransform:'capitalize'}}>{todayFmt}</div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:9}}>
            {stats.streak>0&&<div style={{background:dark?'#1A3522':'#FFF5E8',borderRadius:20,padding:'5px 11px',display:'flex',alignItems:'center',gap:4}}>
              <span style={{fontSize:13}}>🔥</span><span style={{fontSize:13,fontWeight:700,color:'#D4885A'}}>{stats.streak}</span>
            </div>}
            {phase&&<div style={{background:`${phase.color}22`,borderRadius:20,padding:'5px 11px',display:'flex',alignItems:'center',gap:4}}>
              <span style={{fontSize:13}}>{phase.emoji}</span>
            </div>}
            <button onClick={()=>setDark(d=>!d)} style={{background:D.bgD,border:'none',borderRadius:10,padding:'7px 11px',fontSize:15,cursor:'pointer'}}>{dark?'☀️':'🌙'}</button>
          </div>
        </div>
        {(done.length>0||tasks.length>0)&&<div style={{marginTop:11}}>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:10.5,color:D.muted,marginBottom:5}}>
            <span>{done.length} listas · {doneMins} min</span><span>{tasks.length} pendientes</span>
          </div>
          <div style={{background:D.bgDD,borderRadius:99,height:4}}>
            <div style={{background:`linear-gradient(90deg,${D.em},${D.emL})`,borderRadius:99,height:4,width:`${(done.length/Math.max(done.length+tasks.length,1))*100}%`,transition:'width 0.5s ease'}}/>
          </div>
        </div>}
      </div>

      {/* CONTENT */}
      <div style={{flex:1,overflowY:'auto',padding:view==='focus'?0:'18px 18px 88px'}}>

        {/* ── HOME ── */}
        {view==='home'&&<>
          {phase&&<div style={{borderRadius:20,padding:'16px 18px',marginBottom:14,background:`linear-gradient(135deg,${phase.color}22,${phase.color}0A)`,border:`1.5px solid ${phase.color}44`}}>
            <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:9}}>
              <span style={{fontSize:22}}>{phase.emoji}</span>
              <div><div style={{fontFamily:"'Playfair Display',serif",fontStyle:'italic',fontSize:16,color:phase.color,fontWeight:600}}>{phase.name}</div>
              <div style={{fontSize:10.5,color:D.muted,marginTop:1}}>{phase.tip}</div></div>
            </div>
            <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
              {phase.recs.map(r=><span key={r} style={{fontSize:10,background:`${phase.color}22`,color:phase.color,padding:'3px 9px',borderRadius:99,fontWeight:600}}>{r}</span>)}
            </div>
          </div>}

          <SectionLabel>Rutina diaria 🔁</SectionLabel>
          {RECURRING.map(rt=>{
            const isDone=done.some(d=>d.id===rt.id);
            const inTasks=tasks.some(t=>t.id===rt.id);
            return <div key={rt.id} style={{background:D.card,borderRadius:15,padding:'12px 15px',marginBottom:8,display:'flex',alignItems:'center',gap:11,border:`1px solid ${D.border}`,opacity:isDone?0.55:1}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:isDone?D.muted:CCOL[rt.category],flexShrink:0,boxShadow:isDone?'none':`0 0 0 3px ${CCOL[rt.category]}33`}}/>
              <div style={{flex:1}}>
                <div style={{fontSize:13.5,fontWeight:500,color:D.ink,textDecoration:isDone?'line-through':'none',opacity:isDone?0.6:1}}>{rt.name}</div>
                <div style={{fontSize:10.5,color:D.muted,marginTop:1}}>⏱ 10 min · <span style={{color:CCOL[rt.category]}}>{rt.category}</span></div>
              </div>
              {isDone?<span style={{fontSize:15,color:D.em}}>✓</span>:!inTasks
                ?<button onClick={()=>setTasks(p=>[...p,{...rt}])} style={{background:D.bgD,border:'none',borderRadius:9,padding:'6px 11px',fontSize:11,color:D.muted,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>+ Añadir</button>
                :<button onClick={()=>startTask(rt)} style={{background:D.em,border:'none',borderRadius:9,padding:'6px 11px',fontSize:11,color:'#fff',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",boxShadow:`0 2px 10px ${D.em}44`}}>▶ Empezar</button>
              }
            </div>;
          })}

          {tasks.filter(t=>!t.isRecurring).length>0&&<>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',margin:'16px 0 10px'}}>
              <SectionLabel>Tareas del día</SectionLabel>
              <button onClick={()=>setView('tasks')} style={{fontSize:11,color:D.em,background:'none',border:'none',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",fontWeight:600,marginTop:-8}}>Ver todas →</button>
            </div>
            {tasks.filter(t=>!t.isRecurring).slice(0,3).map(task=>(
              <div key={task.id} style={{background:D.card,borderRadius:15,padding:'12px 15px',marginBottom:8,display:'flex',alignItems:'center',gap:11,border:`1px solid ${D.border}`}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:PD[task.priority].c,flexShrink:0,boxShadow:`0 0 0 3px ${PD[task.priority].c}33`}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13.5,fontWeight:500,color:D.ink,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{task.name}</div>
                  <div style={{fontSize:10.5,color:D.muted,marginTop:2}}>⏱ {task.minutes} min · <span style={{color:CCOL[task.category]}}>{task.category}</span></div>
                </div>
                <button onClick={()=>startTask(task)} style={{background:D.em,color:'#fff',border:'none',borderRadius:10,width:34,height:34,fontSize:13,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:`0 3px 12px ${D.em}44`}}>▶</button>
              </div>
            ))}
          </>}

          <button onClick={()=>setModal('addTask')} style={{width:'100%',padding:'13px',borderRadius:15,border:`1.5px dashed ${D.border}`,background:'transparent',color:D.muted,fontSize:13,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",marginTop:8,display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>＋ Añadir tarea al día</button>

          {done.length>0&&<>
            <div style={{margin:'18px 0 10px'}}><SectionLabel>Completadas hoy</SectionLabel></div>
            {done.map(t=>(
              <div key={t.id+t.at} style={{background:dark?'#0F2218':'#EAF5EF',borderRadius:13,padding:'11px 14px',marginBottom:7,display:'flex',alignItems:'center',gap:9,border:`1px solid ${D.em}22`}}>
                <span style={{color:D.em,fontSize:14,fontWeight:700}}>✓</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,color:D.ink,opacity:0.55,textDecoration:'line-through'}}>{t.name}</div>
                  <div style={{fontSize:10.5,color:D.muted,marginTop:1}}>{t.actual} min reales</div>
                </div>
              </div>
            ))}
          </>}
          {tasks.length===0&&done.length>0&&<div style={{textAlign:'center',padding:'28px 0'}}>
            <div style={{fontSize:38,marginBottom:10}}>🎉</div>
            <Italic size={24}>¡Día perfecto, Ayita!</Italic>
            <div style={{fontSize:13,color:D.muted,marginTop:6}}>Lo conseguiste todas.</div>
          </div>}
        </>}

        {/* ── TASKS ── */}
        {view==='tasks'&&<>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
            <Italic>Todas las tareas</Italic>
            <button onClick={()=>setModal('addTask')} style={{background:D.em,border:'none',borderRadius:10,padding:'8px 15px',fontSize:12,color:'#fff',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>+ Nueva</button>
          </div>
          <div style={{display:'flex',gap:5,marginBottom:8,overflowX:'auto',paddingBottom:4}}>
            {['Todas',...CATS].map(c=>(
              <button key={c} onClick={()=>setFCat(c)} style={{flexShrink:0,padding:'6px 12px',borderRadius:99,border:`1.5px solid ${fCat===c?(CCOL[c]||D.em):D.border}`,background:fCat===c?(CCOL[c]||D.em):'transparent',color:fCat===c?'#fff':D.muted,fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>{c}</button>
            ))}
          </div>
          <div style={{display:'flex',gap:6,marginBottom:14}}>
            {[['priority','Prioridad'],['duration','Duración'],['date','Fecha']].map(([k,l])=>(
              <button key={k} onClick={()=>setSortBy(k)} style={{padding:'6px 12px',borderRadius:10,border:'none',background:sortBy===k?D.bgDD:'transparent',color:sortBy===k?D.ink:D.muted,fontSize:11.5,fontWeight:sortBy===k?600:400,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>{l}</button>
            ))}
          </div>
          {allSorted.length===0&&<div style={{textAlign:'center',padding:'50px 0',color:D.muted}}><div style={{fontSize:30,marginBottom:10}}>🌱</div>Nada aquí todavía</div>}
          {allSorted.map(task=>(
            <div key={task.id} style={{background:D.card,borderRadius:18,padding:'14px 16px',marginBottom:10,border:`1px solid ${D.border}`,boxShadow:dark?'none':'0 2px 10px rgba(0,0,0,0.04)'}}>
              <div style={{display:'flex',alignItems:'flex-start',gap:11}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:PD[task.priority].c,flexShrink:0,marginTop:5,boxShadow:`0 0 0 3px ${PD[task.priority].c}33`}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:500,color:D.ink,marginBottom:6}}>{task.name}</div>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                    <span style={{fontSize:10.5,color:D.muted}}>⏱ {task.minutes} min</span>
                    <span style={{fontSize:10,background:PD[task.priority].bg,color:PD[task.priority].c,padding:'2px 8px',borderRadius:99,fontWeight:600}}>{PD[task.priority].l}</span>
                    <span style={{fontSize:10,background:`${CCOL[task.category]}22`,color:CCOL[task.category],padding:'2px 8px',borderRadius:99,fontWeight:600}}>{task.category}</span>
                    {task.isRecurring&&<span style={{fontSize:10.5,color:D.muted}}>🔁</span>}
                  </div>
                  {(task.start||task.end)&&<div style={{fontSize:10.5,color:D.muted,marginTop:5}}>
                    {task.start&&`📅 ${task.start}`}{task.start&&task.end&&' · '}{task.end&&`🏁 ${task.end}`}
                  </div>}
                </div>
                <div style={{display:'flex',gap:6,flexShrink:0}}>
                  <button onClick={()=>startTask(task)} style={{background:D.em,color:'#fff',border:'none',borderRadius:10,width:34,height:34,fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:`0 3px 12px ${D.em}44`}}>▶</button>
                  <button onClick={()=>setTasks(p=>p.filter(t=>t.id!==task.id))} style={{background:D.bgD,color:D.muted,border:'none',borderRadius:10,width:34,height:34,fontSize:13,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
                </div>
              </div>
            </div>
          ))}
        </>}

        {/* ── FOCUS ── */}
        {view==='focus'&&(!active
          ?<div style={{padding:'0 0 80px'}}>
            <Italic style={{marginBottom:16}}>¿En qué te enfocas?</Italic>
            {tasks.length===0
              ?<div style={{textAlign:'center',padding:'60px 0',color:D.muted}}>
                <div style={{fontSize:32,marginBottom:10}}>🌿</div>
                <div style={{fontSize:14}}>No hay tareas pendientes</div>
                <button onClick={()=>setModal('addTask')} style={{marginTop:16,background:D.em,border:'none',borderRadius:13,padding:'12px 24px',color:'#fff',fontSize:13,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>+ Añadir tarea</button>
              </div>
              :tasks.map(task=>(
                <div key={task.id} style={{background:D.card,borderRadius:18,padding:'14px 16px',marginBottom:10,border:`1px solid ${D.border}`,display:'flex',alignItems:'center',gap:11}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:PD[task.priority].c,flexShrink:0,boxShadow:`0 0 0 3px ${PD[task.priority].c}33`}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13.5,fontWeight:500,color:D.ink,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{task.name}</div>
                    <div style={{fontSize:10.5,color:D.muted,marginTop:2}}>⏱ {task.minutes} min · <span style={{color:CCOL[task.category]}}>{task.category}</span></div>
                  </div>
                  <button onClick={()=>startTask(task)} style={{background:D.em,color:'#fff',border:'none',borderRadius:12,padding:'9px 15px',fontSize:13,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",fontWeight:600,flexShrink:0,boxShadow:`0 3px 12px ${D.em}44`}}>▶ Empezar</button>
                </div>
              ))
            }
          </div>
          :<div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'22px 22px 44px'}}>
            <div style={{width:'100%',background:D.card,borderRadius:20,padding:'15px 18px',marginBottom:22,border:`1px solid ${D.border}`}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:PD[active.priority].c,boxShadow:`0 0 0 3px ${PD[active.priority].c}33`}}/>
                <div style={{fontFamily:"'Playfair Display',serif",fontStyle:'italic',fontSize:16,color:D.ink,flex:1,lineHeight:1.3}}>{active.name}</div>
                <span style={{fontSize:10,background:`${CCOL[active.category]}22`,color:CCOL[active.category],padding:'3px 9px',borderRadius:99,fontWeight:600}}>{active.category}</span>
              </div>
            </div>
            <div style={{position:'relative',width:230,height:230,marginBottom:22}}>
              <svg width="230" height="230" style={{transform:'rotate(-90deg)',filter:`drop-shadow(0 4px 20px ${D.em}33)`}}>
                <circle cx="115" cy="115" r={R} fill="none" stroke={D.bgDD} strokeWidth="10"/>
                <circle cx="115" cy="115" r={R} fill="none" stroke="url(#gr)" strokeWidth="10" strokeDasharray={C} strokeDashoffset={C*(1-prog)} strokeLinecap="round" style={{transition:'stroke-dashoffset 0.9s ease'}}/>
                <defs><linearGradient id="gr" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor={D.em}/><stop offset="100%" stopColor={D.emL}/></linearGradient></defs>
              </svg>
              <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
                <div style={{fontSize:48,fontWeight:300,color:D.ink,letterSpacing:'-3px',lineHeight:1,fontVariantNumeric:'tabular-nums'}}>{fmt(tLeft)}</div>
                <div style={{fontSize:10.5,color:D.muted,marginTop:8}}>{running?'✦ en progreso':ssRef.current?'pausado':'lista para empezar'}</div>
              </div>
            </div>
            <div style={{display:'flex',gap:14,marginBottom:16,alignItems:'center'}}>
              <button onClick={markDone} style={{background:dark?'#0F2218':'#EAF5EF',color:D.em,border:`1.5px solid ${D.em}44`,borderRadius:50,width:54,height:54,fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700}}>✓</button>
              {!running
                ?<button onClick={()=>{if(!ssRef.current)ssRef.current=Date.now();setRunning(true);}} style={{background:`linear-gradient(135deg,${D.em},${D.emL})`,color:'#fff',border:'none',borderRadius:50,width:72,height:72,fontSize:26,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:`0 6px 24px ${D.em}55`}}>▶</button>
                :<button onClick={()=>setRunning(false)} style={{background:D.bgDD,color:D.ink,border:'none',borderRadius:50,width:72,height:72,fontSize:24,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>⏸</button>
              }
              <button onClick={()=>setModal('distracted')} style={{background:D.bgD,color:D.muted,border:'none',borderRadius:50,width:54,height:54,fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>😶</button>
            </div>
            <div style={{fontSize:10.5,color:D.muted,marginBottom:20,textAlign:'center'}}>
              <span style={{background:D.bgD,padding:'4px 13px',borderRadius:99}}>✓ listo · ▶ foco · 😶 me distraje</span>
            </div>
            <div style={{background:D.card,borderRadius:18,padding:'16px 18px',width:'100%',border:`1px solid ${D.border}`}}>
              <div style={{fontSize:10,color:D.muted,marginBottom:9,fontWeight:700,letterSpacing:'0.07em',textTransform:'uppercase'}}>Check-in cada</div>
              <div style={{display:'flex',gap:7}}>
                {[10,15,20,30].map(m=>(
                  <button key={m} onClick={()=>setCiMins(m)} style={{flex:1,background:ciMins===m?D.em:D.bgD,color:ciMins===m?'#fff':D.muted,border:'none',borderRadius:10,padding:'10px 0',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",transition:'all 0.2s'}}>{m}′</button>
                ))}
              </div>
            </div>
            <button onClick={()=>{setActive(null);setRunning(false);clearInterval(timerRef.current);}} style={{marginTop:14,background:'transparent',border:`1px solid ${D.border}`,borderRadius:11,padding:'10px 18px',fontSize:11.5,color:D.muted,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>← Elegir otra tarea</button>
          </div>
        )}

        {/* ── NOTES ── */}
        {view==='notes'&&<>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <Italic>Notas rápidas</Italic>
            <button onClick={()=>setModal('addNote')} style={{background:D.em,border:'none',borderRadius:10,padding:'8px 15px',fontSize:12,color:'#fff',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>+ Nota</button>
          </div>
          {notes.length===0&&<div style={{textAlign:'center',padding:'60px 0',color:D.muted}}>
            <div style={{fontSize:32,marginBottom:10}}>💭</div><div style={{fontSize:14}}>Aquí viven tus ideas</div>
          </div>}
          {CATS.filter(c=>notesByCat[c]?.length>0).map(cat=>(
            <div key={cat} style={{marginBottom:18}}>
              <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:8}}>
                <div style={{width:7,height:7,borderRadius:'50%',background:CCOL[cat]}}/>
                <div style={{fontSize:10,color:CCOL[cat],fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase'}}>{cat}</div>
                <div style={{fontSize:10,color:D.muted}}>({notesByCat[cat].length})</div>
              </div>
              {notesByCat[cat].map(note=>(
                <div key={note.id} style={{background:D.card,borderRadius:14,padding:'12px 15px',marginBottom:6,border:`1px solid ${D.border}`,position:'relative'}}>
                  <div style={{fontSize:13.5,color:D.ink,lineHeight:1.6,paddingRight:22}}>{note.text}</div>
                  <div style={{fontSize:10,color:D.muted,marginTop:5}}>{new Date(note.createdAt).toLocaleDateString('es-ES',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
                  <button onClick={()=>setNotes(p=>p.filter(n=>n.id!==note.id))} style={{position:'absolute',top:10,right:11,background:'none',border:'none',color:D.muted,cursor:'pointer',fontSize:12}}>✕</button>
                </div>
              ))}
            </div>
          ))}
        </>}

        {/* ── YO ── */}
        {view==='yo'&&<>
          <div style={{display:'flex',gap:6,marginBottom:18}}>
            {[['cycle','🌙 Ciclo'],['achievements','🏆 Logros'],['settings','⚙️ Ajustes']].map(([k,l])=>(
              <button key={k} onClick={()=>setSub(k)} style={{flex:1,padding:'9px 0',borderRadius:12,border:`1.5px solid ${sub===k?D.em:D.border}`,background:sub===k?D.em:'transparent',color:sub===k?'#fff':D.muted,fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>{l}</button>
            ))}
          </div>

          {sub==='cycle'&&<>
            <Italic style={{marginBottom:14}}>Tu ciclo</Italic>
            {phase&&<div style={{borderRadius:20,padding:'18px 20px',marginBottom:14,background:`linear-gradient(135deg,${phase.color}22,${phase.color}0A)`,border:`1.5px solid ${phase.color}44`}}>
              <div style={{fontSize:30,marginBottom:8}}>{phase.emoji}</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontStyle:'italic',fontSize:21,color:phase.color,marginBottom:6}}>{phase.name}</div>
              <div style={{fontSize:12.5,color:D.muted,lineHeight:1.7,marginBottom:12}}>{phase.tip}</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {phase.recs.map(r=><span key={r} style={{fontSize:11,background:`${phase.color}22`,color:phase.color,padding:'5px 11px',borderRadius:99}}>{r}</span>)}
              </div>
            </div>}
            <Card>
              <div style={{fontSize:10,color:D.muted,fontWeight:700,letterSpacing:'0.07em',textTransform:'uppercase',marginBottom:13}}>Configurar ciclo</div>
              <div style={{marginBottom:11}}>
                <div style={{fontSize:11.5,color:D.muted,marginBottom:5}}>Primer día del último periodo</div>
                <input type="date" value={cycle.last||''} onChange={e=>setCycle(c=>({...c,last:e.target.value}))} style={IS}/>
              </div>
              <div>
                <div style={{fontSize:11.5,color:D.muted,marginBottom:5}}>Duración del ciclo (días)</div>
                <input type="number" min="21" max="35" value={cycle.len} onChange={e=>setCycle(c=>({...c,len:Number(e.target.value)}))} style={IS}/>
              </div>
            </Card>
            <div style={{marginTop:14}}><SectionLabel>Fases del ciclo</SectionLabel>
              {PHASES.map(p=>(
                <div key={p.name} style={{background:D.card,borderRadius:14,padding:'12px 15px',marginBottom:7,border:`1.5px solid ${p===phase?p.color+'66':D.border}`,display:'flex',gap:11,alignItems:'center'}}>
                  <span style={{fontSize:20}}>{p.emoji}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,color:p.color}}>{p.name}</div>
                    <div style={{fontSize:10.5,color:D.muted,marginTop:1}}>Días {p.range[0]}–{p.range[1]}</div>
                  </div>
                  {p===phase&&<span style={{fontSize:10,background:`${p.color}22`,color:p.color,padding:'3px 9px',borderRadius:99,fontWeight:700}}>Ahora</span>}
                </div>
              ))}
            </div>
          </>}

          {sub==='achievements'&&<>
            <Italic style={{marginBottom:4}}>Logros</Italic>
            <div style={{fontSize:12,color:D.muted,marginBottom:14}}>{achs.length} de {ACHS.length} desbloqueados</div>
            <div style={{background:D.bgDD,borderRadius:99,height:5,marginBottom:18}}>
              <div style={{background:`linear-gradient(90deg,${D.em},${D.emL})`,borderRadius:99,height:5,width:`${(achs.length/ACHS.length)*100}%`,transition:'width 0.5s'}}/>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:9}}>
              {ACHS.map(a=>{
                const ok=achs.includes(a.id);
                return <div key={a.id} style={{background:ok?(dark?'#0F2218':'#EAF5EF'):D.card,borderRadius:16,padding:'16px 13px',border:`1.5px solid ${ok?D.em+'66':D.border}`,opacity:ok?1:0.45,textAlign:'center'}}>
                  <div style={{fontSize:28,marginBottom:7,filter:ok?'none':'grayscale(1)'}}>{a.emoji}</div>
                  <div style={{fontSize:12,fontWeight:600,color:ok?D.em:D.muted,marginBottom:3}}>{a.name}</div>
                  <div style={{fontSize:10,color:D.muted,lineHeight:1.4}}>{a.desc}</div>
                  {ok&&<div style={{fontSize:9,color:D.em,marginTop:5,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em'}}>✓ Desbloqueado</div>}
                </div>;
              })}
            </div>
          </>}

          {sub==='settings'&&<>
            <Italic style={{marginBottom:14}}>Ajustes</Italic>
            <Card>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div style={{fontSize:14,fontWeight:500,color:D.ink}}>Modo oscuro</div>
                  <div style={{fontSize:11,color:D.muted,marginTop:2}}>Verde bosque · inspirado en ti</div>
                </div>
                <button onClick={()=>setDark(d=>!d)} style={{background:dark?D.em:D.bgDD,border:'none',borderRadius:99,width:50,height:28,cursor:'pointer',position:'relative',transition:'background 0.3s'}}>
                  <div style={{width:22,height:22,borderRadius:'50%',background:'#fff',position:'absolute',top:3,left:dark?25:3,transition:'left 0.3s',boxShadow:'0 2px 4px rgba(0,0,0,0.2)'}}/>
                </button>
              </div>
            </Card>
            <Card>
              <div style={{fontSize:10,color:D.muted,fontWeight:700,letterSpacing:'0.07em',textTransform:'uppercase',marginBottom:12}}>Estadísticas</div>
              {[['🔥 Racha actual',`${stats.streak} días`],['🏆 Mejor racha',`${stats.best} días`],['✅ Tareas completadas',stats.total],['🎯 Sesiones de foco',stats.focus],['✨ Días perfectos',stats.perfect]].map(([l,v])=>(
                <div key={l} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 0',borderBottom:`1px solid ${D.border}`}}>
                  <span style={{fontSize:13,color:D.muted}}>{l}</span>
                  <span style={{fontSize:14,fontWeight:700,color:D.em}}>{v}</span>
                </div>
              ))}
            </Card>
            <button onClick={()=>{setDone([]);sv('ay_done',[]);}} style={{width:'100%',background:'transparent',border:`1px solid ${D.border}`,borderRadius:12,padding:'12px',fontSize:12,color:D.muted,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",marginTop:4}}>Reiniciar día</button>
          </>}
        </>}
      </div>

      {/* BOTTOM NAV */}
      <div style={{position:'fixed',bottom:0,left:'50%',transform:'translateX(-50%)',width:'100%',maxWidth:480,background:D.nav,borderTop:`1px solid ${D.border}`,padding:'8px 0 12px',display:'flex',zIndex:50,boxShadow:dark?'none':'0 -2px 20px rgba(0,0,0,0.07)'}}>
        {[['home','🏠','Inicio'],['tasks','📋','Tareas'],['focus','🎯','Foco'],['notes','📝','Notas'],['yo','✨','Yo']].map(([id,icon,label])=>(
          <NavBtn key={id} id={id} icon={icon} label={label}/>
        ))}
      </div>

      {/* ADD TASK MODAL */}
      {modal==='addTask'&&<BottomModal>
        <Italic style={{marginBottom:16}}>Nueva tarea</Italic>
        <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="¿Qué tienes que hacer?" style={{...IS,marginBottom:11}}/>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:11}}>
          <div>
            <div style={{fontSize:10,color:D.muted,marginBottom:5,fontWeight:700,letterSpacing:'0.06em'}}>DURACIÓN (MIN)</div>
            <input type="number" value={form.minutes} min="5" max="240" onChange={e=>setForm(f=>({...f,minutes:e.target.value}))} style={IS}/>
          </div>
          <div>
            <div style={{fontSize:10,color:D.muted,marginBottom:5,fontWeight:700,letterSpacing:'0.06em'}}>PRIORIDAD</div>
            <select value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))} style={{...IS,cursor:'pointer'}}>
              <option value="high">🔴 Alta</option><option value="medium">🟡 Media</option><option value="low">🟢 Baja</option>
            </select>
          </div>
        </div>
        <div style={{marginBottom:11}}>
          <div style={{fontSize:10,color:D.muted,marginBottom:6,fontWeight:700,letterSpacing:'0.06em'}}>CATEGORÍA</div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {CATS.map(c=><button key={c} onClick={()=>setForm(f=>({...f,category:c}))} style={{padding:'6px 12px',borderRadius:9,border:`1.5px solid ${form.category===c?CCOL[c]:D.border}`,background:form.category===c?CCOL[c]:'transparent',color:form.category===c?'#fff':D.muted,fontSize:11.5,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>{c}</button>)}
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
          <div>
            <div style={{fontSize:10,color:D.muted,marginBottom:5,fontWeight:700,letterSpacing:'0.06em'}}>INICIO</div>
            <input type="date" value={form.start} onChange={e=>setForm(f=>({...f,start:e.target.value}))} style={IS}/>
          </div>
          <div>
            <div style={{fontSize:10,color:D.muted,marginBottom:5,fontWeight:700,letterSpacing:'0.06em'}}>FIN</div>
            <input type="date" value={form.end} onChange={e=>setForm(f=>({...f,end:e.target.value}))} style={IS}/>
          </div>
        </div>
        <div style={{display:'flex',gap:9}}>
          <button onClick={()=>setModal(null)} style={{flex:1,padding:'13px',borderRadius:13,border:`1px solid ${D.border}`,background:'transparent',fontSize:13,color:D.muted,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Cancelar</button>
          <button onClick={()=>{if(!form.name.trim())return;setTasks(p=>[...p,{...form,id:Date.now(),minutes:Number(form.minutes)}]);setForm({name:'',minutes:25,priority:'medium',category:'BUT',start:'',end:''});setModal(null);}} style={{flex:2,padding:'13px',borderRadius:13,border:'none',background:D.em,fontSize:14,color:'#fff',fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",boxShadow:`0 4px 16px ${D.em}44`}}>Añadir tarea</button>
        </div>
      </BottomModal>}

      {/* ADD NOTE MODAL */}
      {modal==='addNote'&&<BottomModal>
        <Italic style={{marginBottom:16}}>Nota rápida</Italic>
        <textarea value={nForm.text} onChange={e=>setNForm(f=>({...f,text:e.target.value}))} placeholder="Escribe tu idea aquí..." rows={4} style={{...IS,resize:'none',marginBottom:11,lineHeight:1.6}}/>
        <div style={{marginBottom:16}}>
          <div style={{fontSize:10,color:D.muted,marginBottom:6,fontWeight:700,letterSpacing:'0.06em'}}>CATEGORÍA</div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {CATS.map(c=><button key={c} onClick={()=>setNForm(f=>({...f,category:c}))} style={{padding:'6px 12px',borderRadius:9,border:`1.5px solid ${nForm.category===c?CCOL[c]:D.border}`,background:nForm.category===c?CCOL[c]:'transparent',color:nForm.category===c?'#fff':D.muted,fontSize:11.5,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>{c}</button>)}
          </div>
        </div>
        <div style={{display:'flex',gap:9}}>
          <button onClick={()=>setModal(null)} style={{flex:1,padding:'13px',borderRadius:13,border:`1px solid ${D.border}`,background:'transparent',fontSize:13,color:D.muted,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Cancelar</button>
          <button onClick={()=>{if(!nForm.text.trim())return;const n={...nForm,id:Date.now(),createdAt:new Date().toISOString()};const nn=[...notes,n];setNotes(nn);setNForm({text:'',category:'BUT'});setModal(null);const ns={...stats,notes:nn.length};setStats(ns);checkAchs(ns,nn.length);}} style={{flex:2,padding:'13px',borderRadius:13,border:'none',background:D.em,fontSize:14,color:'#fff',fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",boxShadow:`0 4px 16px ${D.em}44`}}>Guardar nota</button>
        </div>
      </BottomModal>}

      {/* MODALES DE ESTADO */}
      {(modal==='check'||modal==='timeup'||modal==='distracted')&&<CenterModal>
        {modal==='check'&&<>
          <div style={{fontSize:42,marginBottom:12}}>👀</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontStyle:'italic',fontSize:22,color:D.em,marginBottom:7}}>¿Sigues con ello?</div>
          <div style={{fontSize:12.5,color:D.muted,lineHeight:1.75,marginBottom:22}}>Han pasado <strong style={{color:D.ink}}>{ciMins} min</strong>.<br/>¿Cómo vas con <em style={{color:D.em}}>{active?.name}</em>?</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            <button onClick={()=>{setModal(null);ciRef.current=0;setRunning(true);}} style={{padding:'13px',borderRadius:13,border:'none',background:D.em,color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",boxShadow:`0 4px 16px ${D.em}44`}}>Sí, sigo en ello ✨</button>
            <button onClick={markDone} style={{padding:'13px',borderRadius:13,border:`1.5px solid ${D.em}`,background:dark?'#0F2218':'#EAF5EF',color:D.em,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>La terminé ✓</button>
            <button onClick={()=>{setModal(null);setView('tasks');setRunning(false);}} style={{padding:'11px',borderRadius:13,border:'none',background:D.bgD,color:D.muted,fontSize:12,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Cambiar de tarea</button>
          </div>
        </>}
        {modal==='timeup'&&<>
          <div style={{fontSize:42,marginBottom:12}}>🎯</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontStyle:'italic',fontSize:22,color:D.em,marginBottom:7}}>¡Tiempo!</div>
          <div style={{fontSize:12.5,color:D.muted,lineHeight:1.75,marginBottom:22}}>El tiempo de <em style={{color:D.em}}>{active?.name}</em> llegó a su fin.</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            <button onClick={markDone} style={{padding:'13px',borderRadius:13,border:'none',background:D.em,color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",boxShadow:`0 4px 16px ${D.em}44`}}>Completada ✓</button>
            <button onClick={()=>{setTLeft(active.minutes*60);setTTotal(active.minutes*60);setModal(null);}} style={{padding:'11px',borderRadius:13,border:`1px solid ${D.border}`,background:'transparent',color:D.muted,fontSize:12,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Necesito más tiempo</button>
          </div>
        </>}
        {modal==='distracted'&&<>
          <div style={{fontSize:42,marginBottom:12}}>🌿</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontStyle:'italic',fontSize:22,color:D.em,marginBottom:7}}>Sin juicio 💚</div>
          <div style={{fontSize:12.5,color:D.muted,lineHeight:1.75,marginBottom:22}}>Pasa. Lo importante es volver.</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            <button onClick={()=>{setModal(null);ciRef.current=0;setRunning(true);}} style={{padding:'13px',borderRadius:13,border:'none',background:D.em,color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",boxShadow:`0 4px 16px ${D.em}44`}}>Volver a la tarea 🔄</button>
            <button onClick={()=>{setModal(null);setView('tasks');setRunning(false);}} style={{padding:'11px',borderRadius:13,border:'none',background:D.bgD,color:D.muted,fontSize:12,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Elegir otra tarea</button>
          </div>
        </>}
      </CenterModal>}

      {/* LOGRO DESBLOQUEADO */}
      {modal==='ach'&&newAch&&<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,backdropFilter:'blur(12px)',padding:24}}>
        <div style={{background:D.nav,borderRadius:26,padding:'40px 28px',maxWidth:290,width:'100%',textAlign:'center',boxShadow:'0 24px 60px rgba(0,0,0,0.35)',animation:'popIn 0.3s ease'}}>
          <div style={{fontSize:50,marginBottom:12}}>{newAch.emoji}</div>
          <div style={{fontSize:10,color:D.em,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:6}}>¡Logro desbloqueado!</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontStyle:'italic',fontSize:22,color:D.ink,marginBottom:8}}>{newAch.name}</div>
          <div style={{fontSize:12.5,color:D.muted,lineHeight:1.6,marginBottom:22}}>{newAch.desc}</div>
          <button onClick={()=>{setModal(null);setNewAch(null);}} style={{padding:'13px 32px',borderRadius:13,border:'none',background:D.em,color:'#fff',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",boxShadow:`0 4px 16px ${D.em}44`}}>¡Genial! 🎉</button>
        </div>
      </div>}

      <style>{`
        @keyframes popIn{from{opacity:0;transform:scale(0.88);}to{opacity:1;transform:scale(1);}}
        *{-webkit-tap-highlight-color:transparent;box-sizing:border-box;}
        input[type="date"]::-webkit-calendar-picker-indicator{filter:${dark?'invert(1)':'none'};cursor:pointer;}
        ::-webkit-scrollbar{width:0;}
        button:active{transform:scale(0.96);}
        select option{background:${dark?'#0F2218':'#fff'};color:${dark?'#F5F0E8':'#1A1209'};}
        textarea::placeholder,input::placeholder{color:${D.muted};opacity:0.7;}
      `}</style>
    </div>
  );
}
