/* Monika — walking robot lab assistant + site-wide voice control (loaded on every page) */
(()=>{'use strict';
const SS=window.speechSynthesis,SR=window.SpeechRecognition||window.webkitSpeechRecognition,ss=sessionStorage,$=s=>document.querySelector(s);
const S={voice:ss.mv==='1',name:ss.mn||'',ans:'',more:'',rec:null,on:false,talk:false,vo:null,open:false};
const PAGES=[[/sign ?in|log ?in/,'login.html','sign in'],[/register|sign ?up|create (an )?account/,'register.html','registration'],[/dashboard|home/,'dashboard.html','the dashboard'],[/explanation|experiment|theory|principle/,'explanation.html','the experiment explanation'],[/guideline|procedure|instruction/,'guidelines.html','the guidelines'],[/apparatus|equipment|instrument/,'apparatus.html','the apparatus page'],[/simulat|virtual lab|lab bench|holo/,'simulation.html','the holo lab'],[/assistant|chat/,'assistant.html','my assistant page'],[/result|saved|history/,'results.html','your saved results']];
const KB=[
[/\b(hello|hi|hey|namaste|good (morning|afternoon|evening))\b/,()=>`Hello${S.name?' '+S.name:''}! I am Monika, your walking lab robot. Ask me about Lee's disc, or tell me to open a page or run the experiment.`],
[/how are you/,'Running at a steady state, thank you! How is your experiment going?'],
[/who are you|your name|what are you/,'I am Monika, the lab robot of Maharaja Agrasen Institute of Technology. I can explain the experiment, move around the site, and operate the holo lab by voice.'],
[/joke/,'Why did the heat go to school? To get a little more conduction education!'],
[/what next|what should i do|next step|i am stuck|help me with (the )?(experiment|simulation)/,()=>window.LAB?LAB.next():'Open the simulation and I will guide you step by step. Just say open simulation.'],
[/formula|equation|expression|how.*(calculate|find) k/,'At steady state, heat through the specimen equals heat lost by the disc. So k equals M s times the cooling rate dT by dt times thickness x, divided by area A times the temperature difference across the specimen.','M is the disc mass, s its specific heat, dT by dt the cooling rate measured near the steady disc temperature, and A is pi r squared.'],
[/why.*(thin)|thin/,'Bad conductors are used thin so that enough heat flows through them to give a measurable temperature difference, and so that heat lost from the sides stays negligible.','Heat flow equals k A delta T over x, so for small k a thick specimen would pass almost no heat.'],
[/thickness.*(alter|change|nature|conduct)/,'No. Thermal conductivity is a material property. Thickness changes the heat flow rate and thermal resistance, not k itself.'],
[/good conductor|metal.*(not|suitable)/,'For a good conductor the temperature difference across the sample is tiny and unmeasurable, and heat flows so fast that steady disc cooling cannot balance it. So Lee\'s method does not suit it.'],
[/steady/,'Steady state means the two temperatures stop changing. Heat entering the disc through the specimen then equals heat leaving it.','Wait about ten minutes of constant readings in a real lab before recording.'],
[/cool|dt|slope|gradient|graph/,'Remove the chamber, insulate the disc, and record its temperature at equal intervals around the steady temperature. The slope of that cooling curve is dT by dt.'],
[/precaution|safety|careful/,'Keep the specimen the same diameter as the disc, thermometers near the faces, good thermal contact, and record only after the readings stay constant.'],
[/apparatus|equipment|instrument|parts/,'You need the brass Lee disc, steam chamber, specimen, two thermometers, stop watch, boiler, vernier callipers, screw gauge and a balance.'],
[/lee.?s? (method|disc)|why (do we|is).*lee/,'Lee\'s method measures the conductivity of poor conductors like ebonite, glass or cardboard. The cooling disc acts as a calibrated heat-loss reference.'],
[/unit/,'Thermal conductivity is measured in watts per metre kelvin.'],
[/glass|pyrex|value|reference|standard/,'Pyrex glass is about 1.13 watts per metre kelvin. Ebonite is around 0.16 and cardboard around 0.055.'],
[/hand|camera|gesture|pinch|mediapipe/,'In the holo lab, enable hand controls. Pinch a glowing target for under a second to press it, or pinch the steam chamber and lift it up to remove it. The mouse works too.'],
[/voice|command|what can (i|you)|how.*talk/,'Say things like: open simulation, start heater, capture readings, remove chamber, set thickness to four, status, read this page, or ask me any question about the experiment.'],
[/thank/,()=>`You are welcome${S.name?' '+S.name:''}! Happy experimenting.`],
[/bye|good night|see you/,'Goodbye! I will be walking around if you need me.']];
/* ---------- UI ---------- */
const bot=document.createElement('div');bot.id='mk';
bot.innerHTML=`<div id="mkPanel"><div class="mkh"><b>Monika</b><span id="mkLive">tap 🎙 and talk</span><button id="mkX" aria-label="Close">✕</button></div><div id="mkLog" aria-live="polite"></div><div class="mkf"><input id="mkIn" placeholder="Type or speak to Monika…" aria-label="Message Monika"><button id="mkMic" aria-label="Toggle hands-free voice">🎙</button><button id="mkGo" aria-label="Send">➤</button></div><div class="mkt"><label><input type="checkbox" id="mkVc"> Hands-free voice mode (Alt+M)</label><button id="mkRd">Read page</button></div></div>
<div id="mkBot" tabindex="0" role="button" aria-label="Monika, voice assistant. Press to talk"><div id="mkSay"></div><svg viewBox="0 0 90 130" class="rb"><g class="bob"><line x1="45" y1="6" x2="45" y2="18" stroke="#7ee8ff" stroke-width="3"/><circle class="ant" cx="45" cy="5" r="5" fill="#ff4fd8"/><rect x="22" y="18" width="46" height="36" rx="14" fill="#e8f4ff" stroke="#7ee8ff" stroke-width="3"/><rect x="28" y="25" width="34" height="19" rx="9" fill="#06223a"/><circle class="eye" cx="38" cy="34" r="4" fill="#00f0ff"/><circle class="eye" cx="52" cy="34" r="4" fill="#00f0ff"/><rect class="mouth" x="40" y="47" width="10" height="3" rx="1.5" fill="#06223a"/><rect x="26" y="58" width="38" height="34" rx="12" fill="#cfe8ff" stroke="#7ee8ff" stroke-width="3"/><circle class="core" cx="45" cy="75" r="7" fill="#ff4fd8"/><g class="armL"><rect x="12" y="60" width="10" height="28" rx="5" fill="#9fd0ff"/></g><g class="armR"><rect x="68" y="60" width="10" height="28" rx="5" fill="#9fd0ff"/></g></g><g class="legL"><rect x="30" y="92" width="11" height="24" rx="5" fill="#9fd0ff"/><rect x="26" y="113" width="19" height="8" rx="4" fill="#06223a"/></g><g class="legR"><rect x="49" y="92" width="11" height="24" rx="5" fill="#9fd0ff"/><rect x="45" y="113" width="19" height="8" rx="4" fill="#06223a"/></g></svg></div>`;
document.body.appendChild(bot);
const B=$('#mkBot'),L=$('#mkLog'),cls=(c,on)=>bot.classList.toggle(c,on);
B.style.left=(+ss.mx||20)+'px';
function add(t,w){const d=document.createElement('div');d.className='mb '+w;d.textContent=t;L.appendChild(d);L.scrollTop=L.scrollHeight;
 const m=$('#messages');if(m){const b=document.createElement('div');b.className='bubble '+(w=='u'?'user':'bot');b.textContent=t;m.appendChild(b);m.scrollTop=m.scrollHeight}}
function pickVoice(){if(!SS)return;const v=SS.getVoices();S.vo=v.find(x=>/en-IN/i.test(x.lang)&&/female|heera|veena|neerja/i.test(x.name))||v.find(x=>/female|zira|samantha|google uk english female/i.test(x.name)&&/^en/i.test(x.lang))||v.find(x=>/^en/i.test(x.lang))||null}
if(SS){pickVoice();SS.onvoiceschanged=pickVoice}
function mode(){cls('talk',S.talk);cls('listen',S.on);const live=$('#mkLive');if(live&&!S.talk)live.textContent=S.voice?(S.on?'Listening · say “stop listening” to pause':'Voice mode active · reconnecting…'):'Voice off · tap mic to activate'}
let bt;function bubble(t){const e=$('#mkSay');e.textContent=t.length>140?t.slice(0,137)+'…':t;e.classList.add('show');clearTimeout(bt);bt=setTimeout(()=>e.classList.remove('show'),7000)}
function speak(t){if(!SS)return;SS.cancel();const u=new SpeechSynthesisUtterance(t.replace(/°C?/g,' degrees').replace(/₁/g,' one').replace(/₂/g,' two').replace(/K s⁻¹/g,'kelvin per second'));if(S.vo)u.voice=S.vo;u.pitch=1.2;u.rate=1;
 u.onstart=()=>{S.talk=true;if(S.on){try{S.rec.abort()}catch(e){}}mode()};
 u.onend=u.onerror=()=>{S.talk=false;mode();if(S.voice)setTimeout(listen,300)};SS.speak(u)}
function say(t,quiet){add(t,'m');bubble(t);if(!quiet)speak(t)}
function notify(t){say(t,!S.voice)}
function setVoice(on){S.voice=on;ss.mv=on?'1':'0';$('#mkVc').checked=on;document.querySelectorAll('[data-voice-toggle]').forEach(b=>b.textContent='🎙 Voice commands: '+(on?'On':'Off'));if(on){if(!SR){S.voice=false;ss.mv='0';$('#mkVc').checked=false;say('Voice input needs Chrome or Edge. You can still type to me.',true)}else listen()}else{try{S.rec&&S.rec.abort()}catch(e){}}}
function listen(){if(!SR||S.on||S.talk)return;const r=S.rec=new SR();r.lang='en-IN';r.interimResults=true;r.continuous=true;
 r.onstart=()=>{S.on=true;mode()};
 r.onresult=e=>{for(let i=e.resultIndex;i<e.results.length;i++){const R=e.results[i];$('#mkLive').textContent='“'+R[0].transcript+'”';if(R.isFinal)handle(R[0].transcript)}};
 r.onerror=e=>{if(e.error==='not-allowed'||e.error==='service-not-allowed'){setVoice(false);say('The microphone is blocked. Please allow it in the browser address bar, then activate voice again.',true)}else if(e.error==='audio-capture'){say('I cannot access a microphone. Check that one is connected and not in use by another app.',true)}};
 r.onend=()=>{S.on=false;mode();$('#mkLive').textContent=S.voice?'listening…':'tap 🎙 and talk';if(S.voice&&!S.talk)setTimeout(listen,350)};
 try{r.start()}catch(e){}}
/* ---------- commands + conversation ---------- */
function go(url,label){say('Opening '+label+'.');setTimeout(()=>location.href=url,1300)}
function pageText(){const t=[...document.querySelectorAll('main h1,main h2,main h3,main p,main li')].map(e=>(e.innerText||e.textContent||'').trim()).filter(Boolean).join('. ');return (t||'This page has no readable text.').slice(0,900)}
function cmd(raw){const t=raw.toLowerCase().replace(/^(hey |ok |okay )?monika[, ]*/,'').replace(/^(please|can you|could you)\s+/,'').replace(/[.?!]+$/,'').trim();
 let m;
 if(m=t.match(/my name is (\w+)/)){S.name=m[1][0].toUpperCase()+m[1].slice(1);ss.mn=S.name;return `Nice to meet you, ${S.name}! I will remember that for this session.`}
 if(/sign out|log ?out|log me out/.test(t)){say('Signing you out. Goodbye!');setTimeout(()=>location.href='/logout',1300);return ''}
 if(/stop (talking|speaking)|be quiet|quiet|shut up|silence/.test(t)){SS&&SS.cancel();return ''}
 if(/stop listening|voice (mode )?off|mute (the )?mic|turn off voice/.test(t)){setVoice(false);return 'Voice mode is off. Press Alt M or the microphone to wake me.'}
 if(/read (this |the )?(page|screen)|read aloud|read it/.test(t))return pageText();
 if(m=t.match(/(?:enter|type|fill|set)\s+(?:my\s+)?(name|email|password)\s+(?:is\s+|as\s+)?(.+)/)){const f=$(`input[name=${m[1]}]`);if(f){let v=m[2];if(m[1]=='email')v=v.replace(/\s+at(\s+the\s+rate)?\s+/,'@').replace(/\s+dot\s+/g,'.').replace(/\s/g,'');if(m[1]=='password')v=v.replace(/\s/g,'');f.value=v;f.dispatchEvent(new Event('input'));return m[1]=='password'?'Password entered.':`${m[1]} set to ${v}.`}}
 const fm=$('form[method=post],form[data-auth-form]');if(fm&&/\b(submit|sign in now|log me in|create (the )?account now|register now|press (sign in|register))\b/.test(t)){fm.requestSubmit();return 'Submitting.'}
 if(m=t.match(/^(?:open|go to|take me to|show|navigate to|switch to|visit)\s+(?:the\s+)?(.+)/)){for(const p of PAGES)if(p[0].test(m[1])){if(location.pathname.endsWith(p[1])||('/'+p[1]).endsWith(location.pathname))return 'You are already on '+p[2]+'.';go('/'+p[1],p[2]);return ''}}
 if(window.LAB){const r=LAB.voice(t);if(r)return r}
 return null}
function reply(q){const t=q.toLowerCase();
 if(/^(more|tell me more|explain( more| again)?|elaborate|go on|why|how come)\??$/.test(t.trim()))return S.more||'I have nothing more on that one. Ask me another question.';
 if(/repeat|say (that )?again|pardon/.test(t))return S.ans||'I have not said anything yet.';
 for(const [re,a,more] of KB)if(re.test(t)){const r=typeof a=='function'?a():a;S.ans=r;S.more=more||'';return r}
 return 'I can help with the theory, apparatus, precautions and calculation of Lee\'s disc, open any page, or run the lab by voice. Try: why should bad conductors be thin, or: open simulation.'}
function handle(text){text=text.trim();if(!text)return;add(text,'u');bubble('…');$('#mkIn').value='';let r=cmd(text);if(r===null)r=reply(text);if(r)say(r)}
/* ---------- wiring ---------- */
const panel=$('#mkPanel');
function toggle(o){S.open=o===undefined?!S.open:o;panel.classList.toggle('open',S.open);if(S.open)walkTo(innerWidth-110)}
B.onclick=()=>{toggle();if(S.open&&!S.voice&&SR)setVoice(true)};B.onkeydown=e=>{if(e.key=='Enter'||e.key==' '){e.preventDefault();B.onclick()}};
$('#mkX').onclick=()=>toggle(false);$('#mkGo').onclick=()=>handle($('#mkIn').value);$('#mkIn').onkeydown=e=>{if(e.key=='Enter')handle($('#mkIn').value)};
$('#mkMic').onclick=()=>setVoice(!S.voice);$('#mkRd').onclick=()=>say(pageText());
$('#mkVc').onchange=e=>setVoice(e.target.checked);
document.addEventListener('click',e=>{if(e.target.closest('[data-voice-toggle]'))setVoice(!S.voice)});
document.addEventListener('keydown',e=>{if(e.altKey&&e.key.toLowerCase()=='m'){e.preventDefault();setVoice(!S.voice);if(S.voice)toggle(true)}});
/* walking */
function walkTo(x){x=Math.max(8,Math.min(innerWidth-90,x));const c=B.offsetLeft,d=Math.abs(x-c);if(d<10)return;bot.classList.toggle('flip',x<c);bot.classList.add('walking');B.style.transitionDuration=(d/75)+'s';B.style.left=x+'px';ss.mx=x}
B.addEventListener('transitionend',()=>cls('walking',false));
setInterval(()=>{if(!S.talk&&!S.on&&!S.open&&!document.hidden)walkTo(20+Math.random()*(innerWidth-130))},7000);
/* public API */
window.Monika={say,notify,handle,listen,setVoice,open:toggle,isVoice:()=>S.voice};
/* start-up */
$('#mkVc').checked=S.voice;
setTimeout(()=>{if(!ss.hi){ss.hi='1';say(`Hi${S.name?' '+S.name:''}! I am Monika. Click me or press Alt M to talk hands-free.`,true)}else if(S.voice){setVoice(true);bubble('Listening…')}},600);
if($('#messages')){add('Hello! I am Monika, your walking lab robot. Type, tap the microphone, or turn on hands-free voice mode.','m');if(!S.open)toggle(false)}
})();
