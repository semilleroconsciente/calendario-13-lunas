// core-audio.js — extraído de renderer.js (núcleo compartido, scope top-level).
// notificación sonora + desbloqueo autoplay. Carga diferida antes de renderer.js (ver index.html).
// === SONIDO DE NOTIFICACIÓN ===
let _notifyAudio = null;
function getNotifyAudio(){
  if(_notifyAudio) return _notifyAudio;
  try{
    _notifyAudio = new Audio('assets/notify.mp3');
    _notifyAudio.preload='auto';
    _notifyAudio.volume=0.9;
  }catch(e){ _notifyAudio=null; }
  return _notifyAudio;
}
function playNotifySound(){
  try{
    const a=getNotifyAudio();
    if(!a) return;
    a.currentTime=0;
    const p=a.play();
    if(p && p.catch) p.catch(()=>{});
  }catch(e){}
  try{ if(navigator.vibrate) navigator.vibrate([400,200,400]); }catch(e){}
}
// desbloquear audio en primer gesto (autoplay policy móvil)
try{
  const unlock=()=>{
    const a=getNotifyAudio();
    if(a){
      a.muted=true;
      const p=a.play();
      if(p && p.then) p.then(()=>{ a.pause(); a.currentTime=0; a.muted=false; }).catch(()=>{ a.muted=false; });
    }
    document.removeEventListener('click', unlock);
    document.removeEventListener('touchstart', unlock);
  };
  document.addEventListener('click', unlock, {once:true});
  document.addEventListener('touchstart', unlock, {once:true});
}catch(e){}
