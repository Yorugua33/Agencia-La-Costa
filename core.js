// Núcleo compartido por index.html (pasajero), chofer.html y operador.html
import{initializeApp}from"https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import*as D from"https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";
import*as A from"https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
export{D,A};

// Multi-agencia: cada agencia es un nodo raíz. Se elige con ?a=ID (por defecto la actual).
export const AG=new URLSearchParams(location.search).get('a')||'remis_la_costa';
const app=initializeApp({apiKey:"AIzaSyCISoo1sEPLUzp5kE_S8LG21PKfZmEt-c0",authDomain:"remis-la-costa.firebaseapp.com",databaseURL:"https://remis-la-costa-default-rtdb.firebaseio.com",projectId:"remis-la-costa",storageBucket:"remis-la-costa.firebasestorage.app",messagingSenderId:"191343784342",appId:"1:191343784342:web:7089e6c64f228abc8e2db7"});
export const db=D.getDatabase(app),auth=A.getAuth(app);
export const P=p=>D.ref(db,`${AG}/${p}`);
export const TS=D.serverTimestamp();
// Escritura atómica multi-ruta: o se guarda todo o no se guarda nada
export const multi=u=>D.update(D.ref(db),Object.fromEntries(Object.entries(u).map(([k,v])=>[`${AG}/${k}`,v])));
export const ensureAnon=()=>new Promise((ok,ko)=>A.onAuthStateChanged(auth,u=>u?ok(u):A.signInAnonymously(auth).catch(ko)));

// Utilidades
export const $=s=>document.querySelector(s);
export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const money=n=>Number.isFinite(+n)&&n!==''&&n!=null?'$'+(+n).toLocaleString('es-AR'):'—';
export const ago=t=>{if(!t)return'';const m=Math.max(0,Math.round((Date.now()-t)/60000));return m<1?'ahora':m<60?`hace ${m} min`:`hace ${Math.floor(m/60)} h ${m%60} m`};
export const ESTADOS={pendiente:['Buscando unidad','warn'],en_camino:['En camino','info'],a_bordo:['En viaje','ok'],finalizado:['Finalizado','mut'],cancelada:['Cancelado','bad'],cancelado:['Cancelado','bad']};
export const chip=e=>{const[t,c]=ESTADOS[e]||[e,'mut'];return`<span class="chip ${c}">${esc(t)}</span>`};

// Configuración por agencia (editable en {agencia}/config sin tocar código)
const DEF={nombre:'Remis La Costa',comision:17,tarifaBase:7500,centro:[-37.258,-56.872],telefono:'',zonas:['Ostende','Pinamar','Valeria del Mar','Cariló','Cisra Esmeralda','Villa Gesell','Mar del Plata']};
export const loadCfg=async()=>{try{return{...DEF,...((await D.get(P('config'))).val()||{})}}catch{return DEF}};

// Un solo listener por clave: al cambiar de chat/viaje se cierra el anterior (evita fugas y lecturas duplicadas)
const subs=new Map();
export const listen=(key,q,cb)=>{subs.get(key)?.();subs.set(key,D.onValue(q,s=>cb(s.val()),e=>console.warn(key,e.message)))};

// Mapa
export const mkMap=(id,c)=>{const m=L.map(id).setView(c,14);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(m);setTimeout(()=>m.invalidateSize(),300);return m};
export const pin=(e,c)=>L.divIcon({className:'',html:`<div class="pin" style="--c:${c}">${e}</div>`,iconSize:[34,34],iconAnchor:[17,17]});

// Avisos
export const toast=(t,m='')=>{let h=$('#toast');if(!h){h=document.createElement('div');h.id='toast';document.body.append(h)}const d=document.createElement('div');d.innerHTML=`<b>${esc(t)}</b><div class="mut">${esc(m)}</div>`;h.append(d);setTimeout(()=>d.remove(),4500)};
export const beep=()=>{try{const a=new AudioContext(),o=a.createOscillator(),g=a.createGain();o.frequency.value=1500;o.connect(g);g.connect(a.destination);g.gain.setValueAtTime(.25,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+.35);o.start();o.stop(a.currentTime+.35)}catch{}};

// Chat reutilizable (pasajero↔central, chofer↔central)
export const chatBind=(sel,path,me)=>listen('chat'+sel,P(path),v=>{const b=$(sel);b.innerHTML=Object.values(v||{}).sort((a,b)=>a.ts-b.ts).map(m=>`<div class="msg ${m.de===me?'me':''}">${esc(m.texto)}</div>`).join('')||'<div class="mut c">Sin mensajes</div>';b.scrollTop=1e9});
export const chatSend=(path,me,t)=>{t=t.trim();if(t)D.push(P(path),{de:me,texto:t.slice(0,500),ts:Date.now()})};

// Ticket térmico 58 mm
export const printTicket=(title,rows,foot='')=>{const w=open('','_blank','width=320,height=520');if(!w)return toast('Ventana bloqueada','Permití pop-ups para imprimir');w.document.write(`<html><head><title>${esc(title)}</title><style>@page{size:58mm auto;margin:0}body{font:11px 'Courier New',monospace;width:48mm;margin:0 auto;padding:6px 0}hr{border:0;border-top:1px dashed #000}.c{text-align:center;font-weight:bold;font-size:13px}</style></head><body><div class="c">${esc(title)}</div><hr>${rows.map(([a,b])=>`<div><b>${esc(a)}</b> ${esc(b)}</div>`).join('')}<hr><div class="c" style="font-size:10px">${esc(foot)}</div></body></html>`);w.document.close();w.focus();setTimeout(()=>w.print(),300)};
