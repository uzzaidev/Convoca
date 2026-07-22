const icons={
  menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
  home:'<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10M9 20v-6h6v6"/>',
  users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  wallet:'<path d="M3 6h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z"/><path d="M3 9h18M16 14h2"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  pin:'<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  chevron:'<path d="m9 18 6-6-6-6"/>',
  back:'<path d="m15 18-6-6 6-6"/>',
  trophy:'<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4v2a4 4 0 0 0 4 4M17 6h3v2a4 4 0 0 1-4 4"/>',
  refresh:'<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
  alert:'<path d="M10.3 3.3 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.3a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
  ball:'<circle cx="12" cy="12" r="9"/><path d="m12 7 3 2-1 4h-4L9 9l3-2ZM10 13l-3 3M14 13l3 3M9 9 6 8M15 9l3-1M12 7V4"/>',
  spark:'<path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3Z"/><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z"/>',
  send:'<path d="m22 2-7 20-4-9-9-4 20-7Z"/><path d="M22 2 11 13"/>',
  shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
  coins:'<ellipse cx="12" cy="5" rx="7" ry="3"/><path d="M5 5v5c0 1.7 3.1 3 7 3s7-1.3 7-3V5M5 10v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/>',
  chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z"/>',
  external:'<path d="M14 3h7v7M10 14 21 3"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/>',
  x:'<path d="M18 6 6 18M6 6l12 12"/>',
  circle:'<circle cx="12" cy="12" r="9"/>',
  star:'<path d="m12 2 3 6 7 .9-5 4.8 1.2 6.8L12 17l-6.2 3.5L7 13.7 2 8.9 9 8l3-6Z"/>'
};
function renderIcons(root=document){root.querySelectorAll('[data-icon]').forEach(el=>{const name=el.dataset.icon; el.innerHTML=`<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]||icons.circle}</svg>`;});}
function toast(msg){const t=document.querySelector('.toast');if(!t)return;t.querySelector('[data-toast-text]').textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}
document.addEventListener('DOMContentLoaded',()=>{
  if(new URLSearchParams(location.search).get('embed')==='1')document.body.classList.add('embed');
  renderIcons();
  document.querySelectorAll('[data-choice]').forEach(b=>b.addEventListener('click',()=>{b.parentElement.querySelectorAll('[data-choice]').forEach(x=>x.classList.remove('selected'));b.classList.add('selected')}));
  document.querySelectorAll('[data-demo]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();toast(b.dataset.demo||'Ação demonstrativa')}));
  const confirm=document.querySelector('[data-confirm]'); if(confirm) confirm.addEventListener('click',()=>{confirm.innerHTML='<span data-icon="check"></span> Presença confirmada';confirm.classList.add('btn-primary');renderIcons(confirm);toast('Você está dentro. 15 de 16 confirmados.');const c=document.querySelector('[data-count]');if(c)c.textContent='15';});
  const shuffle=document.querySelector('[data-shuffle]'); if(shuffle) shuffle.addEventListener('click',()=>{document.querySelectorAll('.team-player').forEach((x,i)=>x.style.opacity=.25);setTimeout(()=>{document.querySelectorAll('.team-player').forEach(x=>x.style.opacity=1);toast('Times equilibrados e prontos para jogar.');shuffle.innerHTML='<span data-icon="check"></span> Times confirmados';renderIcons(shuffle)},520)});
  const retry=document.querySelector('[data-retry]'); if(retry) retry.addEventListener('click',()=>{retry.textContent='Tentando novamente…';setTimeout(()=>{document.querySelector('.error-panel').innerHTML='<span class="badge badge-brand"><span data-icon="check"></span> Conexão restaurada</span><h2>Voltamos ao jogo</h2><p>As confirmações foram sincronizadas. Nenhum dado foi perdido.</p><a class="btn btn-primary btn-wide" href="08-confirmacoes.html">Ver confirmações</a>';renderIcons();},650)});
  const create=document.querySelector('[data-create]'); if(create) create.addEventListener('click',e=>{e.preventDefault();toast('Pelada criada. Convites enviados.');setTimeout(()=>location.href='08-confirmacoes.html',900)});
});
