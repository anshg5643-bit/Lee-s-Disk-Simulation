const $ = (id) => document.getElementById(id);
const materials = { ebonite:{name:'Ebonite',k:.16}, cardboard:{name:'Cardboard',k:.055}, wood:{name:'Pine wood',k:.12}, acrylic:{name:'Acrylic',k:.19} };
const state = { phase:'setup', t1:25, t2:25, elapsed:0, steadyT:0, steadyT1:0, heatingTimer:null, coolingTimer:null, readings:[], camera:false, handLandmarker:null, lastGesture:0 };
const values = () => ({ material:$('material').value, d:+$('diameter').value/1000, x:+$('thickness').value/1000, m:+$('mass').value, s:+$('specificHeat').value });
const display = () => {
  $('t1').textContent = `${state.t1.toFixed(1)} °C`; $('t2').textContent = `${state.t2.toFixed(1)} °C`;
  const minutes=Math.floor(state.elapsed/60).toString().padStart(2,'0'), seconds=Math.floor(state.elapsed%60).toString().padStart(2,'0'); $('clock').textContent=`${minutes}:${seconds}`;
  document.querySelector('.thermometer.one').style.setProperty('--fill',`${Math.max(6,Math.min(88,(state.t2-18)/.88))}%`);
  document.querySelector('.thermometer.two').style.setProperty('--fill',`${Math.max(6,Math.min(88,(state.t1-18)/.88))}%`);
};
const syncLabels = () => { const v=values(); $('diameterOut').textContent=`${($('diameter').value)} mm`; $('thicknessOut').textContent=`${(+$('thickness').value).toFixed(1)} mm`; $('massOut').textContent=`${v.m.toFixed(2)} kg`; $('specificHeatOut').textContent=`${v.s} J kg⁻¹ K⁻¹`; };
const targetTemps = () => { const k=materials[values().material].k; return { t1:99.2, t2: 57 + Math.min(15,k*48) }; };
function setStatus(text, kind='info') { window.Monika&&Monika.notify(text); $('statusNote').textContent=text; $('statusNote').style.background=kind==='good'?'#e1f5eb':kind==='warn'?'#fff2d6':''; }
function heat() {
  if(state.phase==='cooling') return MAIT.toast('Reset the apparatus before a new heating run.');
  if(state.phase==='steady') return MAIT.toast('Steady state reached — capture the readings, then remove the chamber.');
  state.phase='heating'; $('heaterButton').textContent='Heating…'; $('heaterButton').disabled=true; $('powerLed').classList.add('live'); $('powerLed').querySelector('b').textContent='Heater on'; $('steamCloud').hidden=false; $('heaterTarget').classList.add('active'); setStatus('Steam is heating the specimen. Watch the disc temperature approach a stable value.');
  const goal=targetTemps();
  state.heatingTimer=setInterval(()=>{ state.elapsed+=4; state.t1 += (goal.t1-state.t1)*.085; state.t2 += (goal.t2-state.t2)*.043; display(); if(Math.abs(goal.t2-state.t2)<.22){ clearInterval(state.heatingTimer); state.t1=goal.t1; state.t2=goal.t2; state.steadyT=goal.t2; state.steadyT1=goal.t1; state.phase='steady'; $('heaterButton').textContent='Steady state'; $('captureButton').disabled=false; $('heaterTarget').classList.remove('active'); $('coolTarget').classList.add('active'); setStatus(`Steady state reached. Record T₁ = ${state.t1.toFixed(1)} °C and T₂ = ${state.t2.toFixed(1)} °C, then remove the chamber.`, 'good'); MAIT.toast('Steady state reached. Capture your readings.'); } },250);
}
function capture() { if(state.phase!=='steady') return MAIT.toast('Wait until the steady-state indicator appears.'); $('captureButton').disabled=true; $('captureButton').textContent='T₁ & T₂ captured'; setStatus('Readings saved. Now remove the steam chamber immediately to begin cooling.', 'good'); MAIT.toast('Steady readings captured.'); }
function cooling() {
  if(state.phase!=='steady') return MAIT.toast('First heat the disc until it reaches steady state.');
  state.phase='cooling'; $('powerLed').classList.remove('live'); $('powerLed').querySelector('b').textContent='Chamber removed'; $('steamCloud').hidden=true; $('chamber').style.transform='';$('chamber').style.opacity='.18'; $('chamberLabel').textContent='CHAMBER REMOVED'; $('coil').style.opacity='.18'; $('coolTarget').classList.remove('active'); $('heaterButton').textContent='Heating completed'; setStatus('Cooling run underway. The virtual stopwatch records disc temperatures near T₂.', 'good');
  const v=values(), A=Math.PI*v.d*v.d/4, delta=state.steadyT1-state.steadyT, idealSlope=materials[v.material].k*A*delta/(v.m*v.s*v.x); let samples=0;
  state.coolingTimer=setInterval(()=>{ state.elapsed+=10; const noise=(Math.sin(samples*2.21)*.045)+(Math.cos(samples*.73)*.02); state.t2=Math.max(22,state.steadyT-idealSlope*(samples*10)+noise); state.t1=24.7; state.readings.push({time:samples*10,temp:state.t2}); samples++; display(); renderReadings(); if(samples>=10 || state.t2<state.steadyT-5){ clearInterval(state.coolingTimer); state.phase='done'; calculate(); setStatus('Cooling run complete. The result uses a least-squares cooling slope from the recorded values.', 'good'); MAIT.toast('Cooling run complete — k calculated.'); } },420);
}
function renderReadings(){ const rows=state.readings.slice(-6).map(r=>`<div class="reading"><span>${String(r.time).padStart(3,'0')} s</span><b>${r.temp.toFixed(2)} °C</b></div>`).join(''); $('readingRows').innerHTML=rows || '<div class="reading"><span>—</span><span>Awaiting cooling run</span></div>'; }
function calculate(){ const pts=state.readings; const n=pts.length, meanX=pts.reduce((a,p)=>a+p.time,0)/n, meanY=pts.reduce((a,p)=>a+p.temp,0)/n; const slope=pts.reduce((a,p)=>a+(p.time-meanX)*(p.temp-meanY),0)/pts.reduce((a,p)=>a+(p.time-meanX)**2,0); const v=values(), A=Math.PI*v.d*v.d/4; const k=v.m*v.s*v.x*Math.abs(slope)/(A*(state.steadyT1-state.steadyT)); $('resultK').textContent=`${k.toFixed(3)} W m⁻¹ K⁻¹`; $('resultMeta').textContent=`Slope |dT/dt| = ${Math.abs(slope).toFixed(4)} K s⁻¹ · ${materials[v.material].name} specimen`; $('dataNote').textContent=`SYNTHETIC DATA · A = ${A.toExponential(3)} m² · T₁ − T₂ = ${(state.steadyT1-state.steadyT).toFixed(1)} K · ${n} cooling readings used.`; fetch('/api/save-result',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({material:materials[v.material].name,thermal_conductivity:k,parameters:{diameter_m:v.d,thickness_m:v.x,mass_kg:v.m,specific_heat_J_kgK:v.s,T1_C:state.steadyT1,T2_C:state.steadyT,area_m2:A,slope_K_s:Math.abs(slope)},readings:pts})}).then(r=>r.json()).then(data=>{if(data.ok) MAIT.toast('Synthetic result saved to your account.'); else MAIT.toast(data.message||'Result could not be saved.');}).catch(()=>MAIT.toast('Could not save result. Check your connection and sign-in.')); }
function reset(){ clearInterval(state.heatingTimer); clearInterval(state.coolingTimer); Object.assign(state,{phase:'setup',t1:25,t2:25,elapsed:0,steadyT:0,steadyT1:0,readings:[]}); $('heaterButton').textContent='Start heater'; $('heaterButton').disabled=false; $('captureButton').disabled=true; $('captureButton').textContent='Capture T₁ & T₂'; $('powerLed').classList.remove('live'); $('powerLed').querySelector('b').textContent='Heater off'; $('steamCloud').hidden=true; $('chamber').style.opacity='1'; $('chamberLabel').textContent='STEAM CHAMBER'; $('coil').style.opacity='1'; $('heaterTarget').classList.remove('active'); $('coolTarget').classList.remove('active'); $('readingRows').innerHTML='<div class="reading"><span>—</span><span>Awaiting cooling run</span></div>'; $('resultK').textContent='—'; $('resultMeta').textContent='Complete a cooling run to calculate k.'; $('dataNote').textContent='The reported slope is a least-squares estimate close to the steady disc temperature.'; setStatus('Set the dimensions and start the heater. Wait until the disc reaches steady state.'); display(); }
async function loadHands(){ if(state.handLandmarker) return; const {FilesetResolver,HandLandmarker}=await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/+esm'); const vision=await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'); state.handLandmarker=await HandLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',delegate:'GPU'},runningMode:'VIDEO',numHands:1}); }
['diameter','thickness','mass','specificHeat','material'].forEach(id=>$(id).addEventListener('input',syncLabels)); $('heaterButton').addEventListener('click',heat); $('heaterTarget').addEventListener('click',heat); $('captureButton').addEventListener('click',capture); $('coolTarget').addEventListener('click',cooling); $('reset').addEventListener('click',reset); $('cameraButton').addEventListener('click',startCamera); window.addEventListener('beforeunload',stopCamera); syncLabels(); display();

/* ===== Holo-lab: hand-tracking HUD, drag-the-chamber, voice commands ===== */
const stage=document.querySelector('.sim-stage'),hud=$('hud'),hx=hud.getContext('2d'),video=$('webcam');
const HC=[[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]],TIPS=[4,8,12,16,20];
const P={x:-99,y:-99,pinch:false,src:'',lm:null,conf:0,trail:[],hold:0,fired:false,drag:null,seen:0,t:0};
const TARGETS=[['heaterTarget',()=>heat()],['captureTarget',()=>capture()],['coolTarget',()=>cooling()]];
let fps=60,prev=performance.now();
const rel=e=>{const r=e.getBoundingClientRect(),s=stage.getBoundingClientRect();return{x:r.left-s.left,y:r.top-s.top,w:r.width,h:r.height}};
const inside=(r,p,m=0)=>p.x>r.x-m&&p.x<r.x+r.w+m&&p.y>r.y-m&&p.y<r.y+r.h+m;
stage.addEventListener('pointermove',e=>{if(performance.now()-P.seen<800)return;const s=stage.getBoundingClientRect();P.x=e.clientX-s.left;P.y=e.clientY-s.top;P.src='mouse'});
stage.addEventListener('pointerdown',e=>{if(P.src==='mouse'&&!e.target.closest('button'))P.pinch=true});
addEventListener('pointerup',()=>{if(P.src==='mouse')P.pinch=false});
function corners(x,y,w,h,c){const k=14;hx.strokeStyle=c;hx.lineWidth=2;[[x,y,1,1],[x+w,y,-1,1],[x,y+h,1,-1],[x+w,y+h,-1,-1]].forEach(([a,b,dx,dy])=>{hx.beginPath();hx.moveTo(a+dx*k,b);hx.lineTo(a,b);hx.lineTo(a,b+dy*k);hx.stroke()})}
function ring(r,f){hx.save();hx.strokeStyle='#ffd23f';hx.lineWidth=5;hx.shadowColor='#ffd23f';hx.shadowBlur=16;hx.beginPath();hx.arc(r.x+r.w/2,r.y+r.h/2,Math.max(r.w,r.h)/2+8,-Math.PI/2,-Math.PI/2+Math.min(1,f)*Math.PI*2);hx.stroke();hx.restore()}
function frame(now){
  const dt=now-prev;prev=now;fps+=(1000/Math.max(dt,1)-fps)*.08;
  const s=stage.getBoundingClientRect(),W=Math.round(s.width),H=Math.round(s.height);if(hud.width!==W||hud.height!==H){hud.width=W;hud.height=H}
  hx.clearRect(0,0,W,H);
  if(state.camera&&state.handLandmarker&&video.readyState>=2&&now-P.t>28){P.t=now;
    try{const r=state.handLandmarker.detectForVideo(video,now),l=r.landmarks&&r.landmarks[0];
      if(l){P.lm=l.map(p=>({x:(1-p.x)*W,y:p.y*H}));P.x+=(P.lm[8].x-P.x)*.55;P.y+=(P.lm[8].y-P.y)*.55;
        const sz=Math.hypot(l[0].x-l[9].x,l[0].y-l[9].y)||.1;P.pinch=Math.hypot(l[4].x-l[8].x,l[4].y-l[8].y)/sz<.32;
        P.conf=(r.handednesses&&r.handednesses[0]&&r.handednesses[0][0]&&r.handednesses[0][0].score)||.9;P.src='hand';P.seen=now}
      else{P.lm=null;if(P.src==='hand'){P.pinch=false;P.drag=null}}}catch(e){}}
  /* targets: hold a pinch ~0.65 s */
  let hot=null;TARGETS.forEach(([id,fn])=>{const e=$(id),r=rel(e),h=inside(r,P,12)&&P.src!=='';e.classList.toggle('hover',h);if(h&&!e.disabled)hot=[r,fn]});
  if(hot&&P.src==='hand'&&P.pinch&&!P.drag&&!P.fired){P.hold+=dt;ring(hot[0],P.hold/650);if(P.hold>650){P.fired=true;P.hold=0;hot[1]()}}else if(!hot||!P.pinch)P.hold=0;
  /* grab the steam chamber and lift it */
  const ch=$('chamber'),cr=rel(ch);
  if(P.pinch&&!P.drag&&!hot&&!P.fired&&state.phase!=='cooling'&&state.phase!=='done'&&inside(cr,P,10))P.drag={y0:P.y};
  if(P.drag){const dy=Math.max(0,P.drag.y0-P.y);ch.style.transform=`translate(-50%,${-dy}px)`;
    if(!P.pinch||dy>110){const ok=dy>110;P.drag=null;P.fired=true;ch.style.transform='';if(ok){if(state.phase==='steady')cooling();else MAIT.toast('Reach steady state before lifting the chamber.')}}}
  if(!P.pinch){P.fired=false}
  /* HUD drawing */
  hx.save();hx.font='11px "DM Mono",monospace';hx.shadowColor='#00f0ff';hx.shadowBlur=10;
  const sy=(now/14)%H;const g=hx.createLinearGradient(0,sy-30,0,sy);g.addColorStop(0,'rgba(0,240,255,0)');g.addColorStop(1,'rgba(0,240,255,.22)');hx.fillStyle=g;hx.fillRect(0,sy-30,W,30);
  corners(10,10,W-20,H-20,'rgba(0,240,255,.7)');hx.fillStyle='#7ff3ff';
  hx.fillText(`CAM ${state.camera?'ON':'OFF'}  ·  INPUT ${P.src==='hand'?'HAND':P.src==='mouse'?'POINTER':'—'}  ·  ${Math.round(fps)} FPS  ·  PHASE ${state.phase.toUpperCase()}`,22,H-22);
  if(state.phase==='steady'&&!P.drag){hx.fillStyle='#ff9bea';const x=cr.x+cr.w/2;hx.fillText('▲ PINCH & LIFT CHAMBER',x-70,cr.y-14)}
  if(state.camera&&!P.lm&&P.src!=='mouse'){hx.fillStyle=`rgba(255,210,63,${.5+.5*Math.sin(now/260)})`;hx.fillText('SCANNING… SHOW YOUR HAND TO THE CAMERA',W/2-120,H-48)}
  if(P.lm&&P.src==='hand'){
    hx.lineCap='round';hx.strokeStyle='rgba(0,240,255,.95)';hx.lineWidth=3;HC.forEach(([a,b])=>{hx.beginPath();hx.moveTo(P.lm[a].x,P.lm[a].y);hx.lineTo(P.lm[b].x,P.lm[b].y);hx.stroke()});
    P.lm.forEach((p,i)=>{const t=TIPS.includes(i);hx.fillStyle=t?'#ff4fd8':'#eaffff';hx.beginPath();hx.arc(p.x,p.y,t?6:3.5,0,7);hx.fill()});
    const xs=P.lm.map(p=>p.x),ys=P.lm.map(p=>p.y),x0=Math.min(...xs)-20,y0=Math.min(...ys)-20,bw=Math.max(...xs)-x0+20,bh=Math.max(...ys)-y0+20;
    corners(x0,y0,bw,bh,P.pinch?'#ffd23f':'#00f0ff');hx.fillStyle=P.pinch?'#ffd23f':'#7ff3ff';hx.fillText(`HAND ${Math.round(P.conf*100)}% · ${P.pinch?'PINCH ✊':'OPEN ✋'}`,x0,y0-6)}
  if(P.src){P.trail.push({x:P.x,y:P.y});if(P.trail.length>16)P.trail.shift();P.trail.forEach((p,i)=>{hx.fillStyle=`rgba(255,79,216,${i/32})`;hx.beginPath();hx.arc(p.x,p.y,2+i/4,0,7);hx.fill()});
    hx.strokeStyle=P.pinch?'#ffd23f':'#ff4fd8';hx.lineWidth=2.5;hx.beginPath();hx.arc(P.x,P.y,P.pinch?9:16,0,7);hx.moveTo(P.x-24,P.y);hx.lineTo(P.x-8,P.y);hx.moveTo(P.x+8,P.y);hx.lineTo(P.x+24,P.y);hx.moveTo(P.x,P.y-24);hx.lineTo(P.x,P.y-8);hx.moveTo(P.x,P.y+8);hx.lineTo(P.x,P.y+24);hx.stroke()}
  hx.restore();requestAnimationFrame(frame)}
requestAnimationFrame(frame);
async function startCamera(){
  if(state.camera) return stopCamera();
  const st=$('cameraStatus');
  try{const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:480}},audio:false});
    video.srcObject=stream;await video.play();stage.classList.add('cam-on');state.camera=true;$('cameraButton').textContent='Disable hand controls';st.textContent='Loading hand-tracking model…';
    await loadHands();st.textContent='Hand tracking live. Hold a pinch over a glowing target, or pinch the chamber and lift it.';MAIT.toast('Hand tracking ready.');window.Monika&&Monika.notify('Hand tracking is live. Pinch a glowing target, or lift the chamber with your fingers.');
  }catch(err){state.camera=false;stage.classList.remove('cam-on');if(video.srcObject){video.srcObject.getTracks().forEach(t=>t.stop());video.srcObject=null}$('cameraButton').textContent='Enable hand controls';st.textContent=`Hand tracking unavailable (${err.message||err}). Use the buttons, mouse or voice.`}
}
function stopCamera(){state.camera=false;if(video.srcObject){video.srcObject.getTracks().forEach(t=>t.stop());video.srcObject=null}stage.classList.remove('cam-on');P.lm=null;P.drag=null;$('chamber').style.transform='';$('cameraButton').textContent='Enable hand controls';$('cameraStatus').textContent='Camera control is off. You can complete every step with buttons, mouse or voice.'}
/* ----- voice-operated lab ----- */
const PH={setup:'ready to start',heating:'heating',steady:'at steady state',cooling:'cooling',done:'complete'};
const statusText=()=>`Chamber ${state.t1.toFixed(1)} degrees, disc ${state.t2.toFixed(1)} degrees, ${PH[state.phase]}. Clock ${$('clock').textContent}.`;
window.LAB={
  next(){const p=state.phase;return p==='setup'?'Say start heater, or hold a pinch over the heater target.':p==='heating'?'Steam is heating. I will tell you when steady state is reached.':p==='steady'?($('captureButton').disabled?'Readings are captured. Now say remove chamber, or pinch the chamber and lift it.':'Say capture readings, then remove the chamber.'):p==='cooling'?'The cooling run is recording. Watch the readings panel.':'Run complete. Thermal conductivity is '+$('resultK').textContent+'. Say reset to try another material.'},
  voice(t){let m;
    if(/(start|begin|turn on|switch on|fire up).*(heat|steam|heater)|^heat\b/.test(t)){const p=state.phase;heat();return p==='setup'?'Heater on. Steam is flowing.':'The heater has already been used. '+LAB.next()}
    if(/(capture|record|note|log|save).*(reading|temperature|t1|t2|values)|^capture/.test(t)){const p=state.phase;capture();return p==='steady'?'Steady readings captured.':'Wait for the steady state first.'}
    if(/(remove|lift|take off|take away).*chamber|start cooling|begin cooling|cool the disc/.test(t)){const p=state.phase;cooling();return p==='steady'?'Chamber removed. Cooling run started.':'Reach steady state before removing the chamber.'}
    if(/\b(reset|start over|restart|try again)\b/.test(t)){reset();return 'Apparatus reset.'}
    if(/(enable|start|turn on|open|activate).*(camera|hand)/.test(t)){if(!state.camera)startCamera();return 'Starting hand tracking. Please allow the camera.'}
    if(/(disable|stop|turn off|close).*(camera|hand)/.test(t)){stopCamera();return 'Hand tracking off.'}
    if(m=t.match(/(ebonite|cardboard|wood|acrylic)/)){if(/material|use|switch|select|choose|change|set/.test(t)){if(state.phase!=='setup')return 'Say reset first, then choose a material.';$('material').value=m[1];$('material').dispatchEvent(new Event('input'));return m[1]+' specimen selected.'}}
    if(m=t.match(/(thickness|diameter|mass|specific heat)\D{0,14}?(\d+(?:\.\d+)?)/)){const id={thickness:'thickness',diameter:'diameter',mass:'mass','specific heat':'specificHeat'}[m[1]],el=$(id);
      if(state.phase!=='setup')return 'Say reset first, then change the '+m[1]+'.';let v=Math.min(+el.max,Math.max(+el.min,+m[2]));el.value=v;el.dispatchEvent(new Event('input'));return `${m[1]} set to ${v}.`}
    if(/(status|temperature|reading|how (hot|warm)|where are we|what.*(t1|t2))/.test(t))return statusText();
    if(/(result|conductivity|answer|what is k)/.test(t)&&state.phase==='done')return 'Thermal conductivity is '+$('resultK').textContent+'.';
    return null}};
