export const KEYS={users:'rv_users_v1',requests:'rv_requests_v1',session:'rv_session_v1',seeded:'rv_seeded_v1',flash:'rv_flash_v1'};
export function read(key,fallback=[]){try{const value=localStorage.getItem(key);return value?JSON.parse(value):fallback}catch{return fallback}}
export function write(key,value){localStorage.setItem(key,JSON.stringify(value));return value}
export function uid(prefix='rv'){return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`}
export function setFlash(text,type='success'){sessionStorage.setItem(KEYS.flash,JSON.stringify({text,type}))}
export function takeFlash(){const flash=readSession(KEYS.flash,null);sessionStorage.removeItem(KEYS.flash);return flash}
function readSession(key,fallback){try{const value=sessionStorage.getItem(key);return value?JSON.parse(value):fallback}catch{return fallback}}
export function seedDemo(){
 if(localStorage.getItem(KEYS.seeded))return;
 const users=[
  {id:'demo_donor',firstName:'Sofía',lastName:'Donante Demo',email:'donante@demo.redvital',password:'Demo1234',phone:'5491100000001',bloodType:'O',rh:'+',city:'Córdoba',role:'donor',available:true,demo:true},
  {id:'demo_patient',firstName:'Martín',lastName:'Responsable Demo',email:'paciente@demo.redvital',password:'Demo1234',phone:'5491100000002',bloodType:'A',rh:'+',city:'Córdoba',role:'patient',available:false,demo:true},
  {id:'demo_admin',firstName:'Ana',lastName:'Administradora Demo',email:'admin@demo.redvital',password:'Demo1234',phone:'',bloodType:'O',rh:'+',city:'Córdoba',role:'admin',available:false,demo:true}
 ];
 const requests=[
  {id:'req_demo_1',ownerId:'demo_patient',bloodType:'O',rh:'+',hospital:'Hospital Central Demo',city:'Córdoba',urgency:'Alta',phone:'5491100000002',email:'paciente@demo.redvital',description:'Solicitud de demostración para coordinar una donación con el centro de salud.',status:'active',createdAt:'2026-08-12T12:00:00.000Z',isExample:true},
  {id:'req_demo_2',ownerId:'demo_patient',bloodType:'A',rh:'+',hospital:'Clínica Comunitaria Demo',city:'Villa Allende',urgency:'Media',phone:'5491100000002',email:'paciente@demo.redvital',description:'Datos ficticios para explorar el funcionamiento de RedVital.',status:'active',createdAt:'2026-08-10T12:00:00.000Z',isExample:true}
 ];
 requests.forEach(request=>{request.urgency={Alta:'ALTO',Media:'MEDIO',Baja:'BAJO'}[request.urgency]||request.urgency});
 write(KEYS.users,users);write(KEYS.requests,requests);localStorage.setItem(KEYS.seeded,'1');
}
export function resetDemo(){Object.values(KEYS).forEach(k=>localStorage.removeItem(k));sessionStorage.clear();seedDemo()}
