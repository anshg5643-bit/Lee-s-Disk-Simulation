/* Assistant page: the chat UI is driven by the global Monika robot (monika.js) */
(function(){
  const form=document.getElementById('chatForm'),input=document.getElementById('chatInput');
  const ready=fn=>window.Monika?fn():setTimeout(()=>ready(fn),100);
  form.addEventListener('submit',e=>{e.preventDefault();const q=input.value;input.value='';ready(()=>Monika.handle(q));});
  document.getElementById('micButton').addEventListener('click',()=>ready(()=>{Monika.setVoice(!Monika.isVoice());sync();}));
  document.querySelectorAll('.prompt').forEach(b=>b.addEventListener('click',()=>ready(()=>Monika.handle(b.textContent.replace('?','').trim()))));
  const vt=document.getElementById('voiceToggle');
  const mic=document.getElementById('micButton');
  const sync=()=>{const on=!!(window.Monika&&Monika.isVoice());vt.textContent='Hands-free voice: '+(on?'On · click to stop':'Off · click to start');if(mic){mic.classList.toggle('mic-on',on);mic.title=on?'Stop hands-free voice':'Start hands-free voice';mic.setAttribute('aria-pressed',String(on));}};
  vt.addEventListener('click',()=>ready(()=>{Monika.setVoice(!Monika.isVoice());sync()}));
  ready(sync);
})();
