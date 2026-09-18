import{activeUser,logout}from'./auth.js';import{takeFlash}from'./storage.js';import{priorityBadge}from'./priorities.js';
const e=(tag,attrs={},text='')=>{const n=document.createElement(tag);Object.entries(attrs).forEach(([k,v])=>k==='class'?n.className=v:n.setAttribute(k,v));n.textContent=text;return n};
export function brand(){const a=e('a',{class:'brand',href:'index.html','aria-label':'RedVital, inicio'});a.append(e('img',{class:'brand-logo',src:'assets/logo-redvital.png',alt:'RedVital'}));return a}
export function renderShell(){
 const user=activeUser(),isHome=document.body.dataset.page==='home',header=e('header',{class:'site-header'}),nav=e('nav',{class:'nav container','aria-label':'Navegación principal'});nav.append(brand());const menu=e('button',{class:'menu-btn','aria-label':'Abrir menú','aria-expanded':'false'},'☰'),links=e('div',{class:'nav-links'});
 const publicItems=[['Inicio',isHome?'#inicio':'index.html'],['Cómo funciona',isHome?'#como-funciona':'index.html#como-funciona'],['Iniciar sesión','login.html'],['Registrarse','registro.html']];
 const donorItems=[['Inicio','index.html'],['Cómo funciona','index.html#como-funciona'],['Solicitudes','solicitudes.html'],['Mi perfil','perfil.html']];
 const patientItems=[['Inicio','index.html'],['Mis solicitudes','mis-solicitudes.html'],['Publicar solicitud','nueva-solicitud.html'],['Mi perfil','perfil.html']];
 const adminItems=[['Inicio','index.html'],['Usuarios','admin.html#usuarios'],['Solicitudes','admin.html#solicitudes'],['Administración','admin.html#administracion']];
 const items=!user?publicItems:user.role==='donor'?donorItems:user.role==='patient'?patientItems:adminItems;
 items.forEach(([label,href],i)=>{const a=e('a',{class:`nav-link${!user&&i===items.length-1?' btn btn-primary':''}`,href},label);links.append(a)});if(user){const b=e('button',{class:'btn btn-text',type:'button'},'Cerrar sesión');b.addEventListener('click',logout);links.append(b)}menu.addEventListener('click',()=>{const open=links.classList.toggle('open');menu.setAttribute('aria-expanded',open);document.body.classList.toggle('menu-open',open)});nav.append(menu,links);header.append(nav);document.body.prepend(header);
 const footer=e('footer',{class:'site-footer'}),wrap=e('div',{class:'container'});wrap.innerHTML=`<div class="footer-grid"><div><a class="brand" href="index.html" aria-label="RedVital, inicio"><img class="brand-logo" src="assets/logo-redvital.png" alt="RedVital"></a><p>Una red que acerca personas para coordinar donaciones con centros de salud.</p></div><div><h3>Navegación</h3><div class="footer-links"><a href="index.html">Inicio</a><a href="index.html#como-funciona">Cómo funciona</a><a href="index.html#privacidad">Privacidad</a></div></div><div><h3>Importante</h3><p>RedVital no reemplaza hospitales, bancos de sangre ni profesionales de salud.</p><a href="mailto:contacto@redvital.demo">Contacto</a></div></div><div class="footer-bottom">© <span data-year></span> RedVital · MVP académico con datos demostrativos.</div>`;footer.append(wrap);document.body.append(footer);document.querySelectorAll('[data-year]').forEach(x=>x.textContent=new Date().getFullYear());
 const flash=takeFlash();if(flash)showMessage(flash.text,flash.type)
}
export function showMessage(text,type='info',target=document.querySelector('[data-message]')){if(!target)return;target.className=`message message-${type} show`;target.setAttribute('role',type==='error'?'alert':'status');target.textContent=text;target.scrollIntoView({behavior:'smooth',block:'nearest'})}
let formErrorTimer;
export function hideFormMessage(target=document.querySelector('[data-message]')){clearTimeout(formErrorTimer);formErrorTimer=undefined;if(!target)return;target.classList.remove('show','leaving');target.replaceChildren()}
export function showFormMessage(title,text,type='success',target=document.querySelector('[data-message]')){if(!target)return;clearTimeout(formErrorTimer);formErrorTimer=undefined;if(target.parentElement!==document.body)document.body.append(target);const icon=e('span',{class:'form-message__icon','aria-hidden':'true'},type==='success'?'✓':'✕'),copy=e('div',{class:'form-message__copy'}),heading=e('strong',{},title),detail=e('p',{},text);copy.append(heading,detail);target.replaceChildren(icon,copy);target.className=`form-message form-message--${type} show`;target.setAttribute('role',type==='error'?'alert':'status');if(type==='error')formErrorTimer=setTimeout(()=>hideFormMessage(target),4000)}
export function formatDate(iso){return new Intl.DateTimeFormat('es-AR',{dateStyle:'medium'}).format(new Date(iso))}
export function requestCard(r,actions=[]){const isExample=r.isExample===true||r.demo===true,card=e('article',{class:`card request-card${isExample?' request-card--example':''}`}),header=e('div',{class:'request-card__header'}),blood=e('div',{class:'request-blood'}),main=e('div',{class:'request-main'});blood.innerHTML=`<span class="blood">${r.bloodType}${r.rh}</span>`;header.innerHTML=`<div class="request-card__priority">${priorityBadge(r.urgency)}${isExample?' <span class="badge badge-example">Ejemplo ficticio</span>':''}</div>`;header.prepend(blood);main.innerHTML=`<div class="request-card__location"><span aria-hidden="true">⌖</span><span>${escapeText(r.city)}</span></div><h3>${escapeText(r.hospital)}</h3><p class="request-card__description">${escapeText(r.description)}</p><div class="request-meta"><span>◷ ${formatDate(r.createdAt)}</span><span>${r.status==='active'?'Activa':'Resuelta'}</span></div>${isExample?'<p class="example-disclosure">Los ejemplos mostrados son ficticios y se incluyen únicamente para explicar el funcionamiento de RedVital.</p>':''}`;card.append(header,main);if(actions.length){const row=e('div',{class:'request-actions'});actions.forEach(a=>row.append(a));card.append(row)}return card}
export function action(label,href,kind='outline'){const a=e('a',{class:`btn btn-${kind}`,href},label);return a}
export function escapeText(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
export function initials(user){return `${user.firstName?.[0]||''}${user.lastName?.[0]||''}`.toUpperCase()}
export function confirmDialog(title,text,onConfirm){const d=document.querySelector('#confirm-dialog');d.querySelector('h2').textContent=title;d.querySelector('p').textContent=text;const yes=d.querySelector('[data-confirm]'),fresh=yes.cloneNode(true);yes.replaceWith(fresh);fresh.addEventListener('click',()=>{d.close();onConfirm()},{once:true});d.showModal()}

function prepareInternalNavigation(){
 if(document.body.dataset.page!=='home')return;
 const start=document.querySelector('main .hero');
 if(start&&!start.id)start.id='inicio';
}

document.addEventListener('click',event=>{
 const link=event.target.closest('a[href^="#"]');
 if(!link)return;
 const hash=link.getAttribute('href');
 let target;
 try{target=document.querySelector(hash)}catch{return}
 if(!target)return;
 event.preventDefault();
 const links=link.closest('.nav-links');
 if(links){
  links.classList.remove('open');
  document.querySelector('.menu-btn')?.setAttribute('aria-expanded','false');
  document.body.classList.remove('menu-open');
 }
 target.scrollIntoView({behavior:'smooth',block:'start'});
 history.pushState(null,'',hash);
});

queueMicrotask(prepareInternalNavigation);
