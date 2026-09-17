const GEOREF_ENDPOINT='https://apis.datos.gob.ar/georef/api/v2.0/localidades';
const DEFAULT_LIMIT=10;
const DEBOUNCE_MS=180;

export const PROVINCES=['Buenos Aires','Catamarca','Chaco','Chubut','Córdoba','Corrientes','Entre Ríos','Formosa','Jujuy','La Pampa','La Rioja','Mendoza','Misiones','Neuquén','Río Negro','Salta','San Juan','San Luis','Santa Cruz','Santa Fe','Santiago del Estero','Tierra del Fuego, Antártida e Islas del Atlántico Sur','Tucumán'];

// Catálogo local pequeño para que el formulario siga funcionando aunque Georef no responda.
// Georef se consulta sólo para completar búsquedas que no estén en este catálogo.
const LOCAL_CITIES=[
 ['Ciudad Autónoma de Buenos Aires','Buenos Aires'],['La Plata','Buenos Aires'],['Mar del Plata','Buenos Aires'],['Bahía Blanca','Buenos Aires'],['Tandil','Buenos Aires'],['San Nicolás de los Arroyos','Buenos Aires'],['Olavarría','Buenos Aires'],['Pergamino','Buenos Aires'],['Azul','Buenos Aires'],['Avellaneda','Buenos Aires'],
 ['San Fernando del Valle de Catamarca','Catamarca'],['Andalgalá','Catamarca'],['Resistencia','Chaco'],['Barranqueras','Chaco'],['Rawson','Chubut'],['Comodoro Rivadavia','Chubut'],['Puerto Madryn','Chubut'],
 ['Córdoba','Córdoba'],['Villa María','Córdoba'],['Río Cuarto','Córdoba'],['Villa Carlos Paz','Córdoba'],['Villa Allende','Córdoba'],['Alta Gracia','Córdoba'],['San Francisco','Córdoba'],
 ['Corrientes','Corrientes'],['Goya','Corrientes'],['Paraná','Entre Ríos'],['Concordia','Entre Ríos'],['Formosa','Formosa'],['San Salvador de Jujuy','Jujuy'],['Santa Rosa','La Pampa'],['La Rioja','La Rioja'],
 ['Mendoza','Mendoza'],['Godoy Cruz','Mendoza'],['Guaymallén','Mendoza'],['San Rafael','Mendoza'],['Posadas','Misiones'],['Apóstoles','Misiones'],['Neuquén','Neuquén'],['Bariloche','Río Negro'],['Viedma','Río Negro'],['Allen','Río Negro'],
 ['Salta','Salta'],['San Juan','San Juan'],['San Luis','San Luis'],['Río Gallegos','Santa Cruz'],['Santa Fe','Santa Fe'],['Rosario','Santa Fe'],['Rafaela','Santa Fe'],['Santiago del Estero','Santiago del Estero'],['Añatuya','Santiago del Estero'],['Ushuaia','Tierra del Fuego, Antártida e Islas del Atlántico Sur'],['San Miguel de Tucumán','Tucumán']
].map(([name,province],index)=>({id:`local-${index+1}`,name,province}));

export const CITIES=LOCAL_CITIES;
export const normalizeCity=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es-AR').trim();
const normalizeProvince=normalizeCity;
let catalogPromise=null;

const loadOfficialCatalog=()=>{
 if(catalogPromise)return catalogPromise;
 const url=new URL(GEOREF_ENDPOINT);url.searchParams.set('max','5000');
 catalogPromise=fetch(url,{headers:{Accept:'application/json'}}).then(response=>{if(!response.ok)throw new Error(`Georef respondió con estado ${response.status}`);return response.json()}).then(data=>(Array.isArray(data.localidades)?data.localidades:[]).map(location=>({id:String(location.id??''),name:String(location.nombre??'').trim(),province:String(location.provincia?.nombre??'').trim()})).filter(location=>location.id&&location.name&&location.province)).catch(()=>[]);
 return catalogPromise;
};

const mergeCatalog=async()=>LOCAL_CITIES;
export const findLocation=value=>CITIES.find(item=>normalizeCity(item.name)===normalizeCity(value));
export const findLocationProvince=value=>findLocation(value)?.province||'';
export async function searchProvinces(value,{maxResults=DEFAULT_LIMIT}={}){const query=normalizeProvince(value);if(!query)return[];return PROVINCES.filter(province=>normalizeProvince(province).startsWith(query)).slice(0,maxResults)}
export async function searchLocations(value,{maxResults=DEFAULT_LIMIT,province='',signal}={}){
 const query=normalizeCity(value);if(!query)return[];
 const locations=await mergeCatalog();if(signal?.aborted)throw new DOMException('La búsqueda fue cancelada.','AbortError');
 const wantedProvince=normalizeProvince(typeof province==='function'?province():province),seen=new Set();
 return locations.filter(location=>!wantedProvince||normalizeProvince(location.province)===wantedProvince).filter(location=>normalizeCity(location.name).startsWith(query)).filter(location=>{if(seen.has(`${location.id}|${location.province}`))return false;seen.add(`${location.id}|${location.province}`);return true}).sort((a,b)=>a.name.localeCompare(b.name,'es')||a.province.localeCompare(b.province,'es')).slice(0,maxResults);
}

const ensureList=(input,list)=>{if(list)return list;const wrapper=document.createElement('div');wrapper.className='city-autocomplete';input.before(wrapper);wrapper.append(input);const generated=document.createElement('div');generated.id=`${input.id||'location'}-suggestions`;generated.className='city-suggestions';generated.setAttribute('role','listbox');generated.hidden=true;wrapper.append(generated);return generated};
const autocomplete=(input,list,{search,onSelect=()=>{},onInput=()=>{},format=value=>value}={})=>{
 if(!input)return{isValid:()=>false,clear:()=>{},getSelection:()=>null,setProvince:()=>{}};
 if(input._locationAutocomplete)return input._locationAutocomplete;
 list=ensureList(input,list);input.autocomplete='off';input.setAttribute('role','combobox');input.setAttribute('aria-autocomplete','list');input.setAttribute('aria-controls',list.id);input.setAttribute('aria-expanded','false');
 let matches=[],active=-1,selected=null,timer=null,controller=null,province='';
 const close=()=>{list.hidden=true;list.replaceChildren();matches=[];active=-1;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant')};
 const setActive=index=>{active=index;[...list.children].forEach((option,i)=>{option.classList.toggle('active',i===active);option.setAttribute('aria-selected',String(i===active))});if(active>=0)input.setAttribute('aria-activedescendant',list.children[active].id)};
 const choose=index=>{const value=matches[index];if(!value)return;selected=value;input.value=typeof value==='string'?value:value.name;close();input.removeAttribute('aria-invalid');onSelect(input.value,value);input.focus()};
 const render=()=>{active=-1;list.replaceChildren();matches.forEach((value,index)=>{const option=document.createElement('button');option.type='button';option.id=`${list.id}-option-${index}`;option.className='city-suggestion';option.setAttribute('role','option');option.textContent=format(value);option.addEventListener('pointerdown',event=>event.preventDefault());option.addEventListener('mouseenter',()=>setActive(index));option.addEventListener('click',()=>choose(index));list.append(option)});list.hidden=!matches.length;input.setAttribute('aria-expanded',String(matches.length>0))};
 const load=async value=>{const query=String(value??'').trim();if(!query){controller?.abort();close();return}controller?.abort();controller=new AbortController();try{matches=await search(query,{maxResults:DEFAULT_LIMIT,province,signal:controller.signal});render()}catch(error){if(error.name!=='AbortError'){matches=[];close()}}};
 const schedule=value=>{clearTimeout(timer);timer=setTimeout(()=>load(value),DEBOUNCE_MS)};
 input.addEventListener('input',()=>{selected=null;onInput(input.value);if(input.value.trim())schedule(input.value);else{clearTimeout(timer);close()}});
 input.addEventListener('focus',()=>{if(input.value.trim()&&!selected)schedule(input.value)});
 input.addEventListener('keydown',event=>{if(event.key==='Escape'){close();return}if((event.key==='ArrowDown'||event.key==='ArrowUp')&&matches.length){event.preventDefault();setActive((active+(event.key==='ArrowDown'?1:-1)+matches.length)%matches.length)}if(event.key==='Enter'&&active>=0){event.preventDefault();choose(active)}});
 document.addEventListener('pointerdown',event=>{if(!event.target.closest('.city-autocomplete'))close()});
 const api={isValid:()=>!!selected&&input.value===(typeof selected==='string'?selected:selected.name),clear:()=>{selected=null;input.value='';close();onInput('')},getSelection:()=>selected,setValue:value=>{selected=value;input.value=typeof value==='string'?value:value?.name||''},setProvince:value=>{province=value||'';selected=null;if(input.value)load(input.value)}};input._locationAutocomplete=api;return api;
};
export function attachProvinceAutocomplete(input,list,options={}){return autocomplete(input,list,{...options,search:searchProvinces,format:value=>value})}
export function attachCityAutocomplete(input,list,options={}){return autocomplete(input,list,{...options,search:searchLocations,format:value=>`${value.name} — ${value.province}`})}
