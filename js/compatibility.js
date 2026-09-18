// Matriz orientativa para transfusión de glóbulos rojos. La decisión clínica siempre corresponde al centro de salud.
const canDonate={
 'O-':['O-','O+','A-','A+','B-','B+','AB-','AB+'],'O+':['O+','A+','B+','AB+'],
 'A-':['A-','A+','AB-','AB+'],'A+':['A+','AB+'],'B-':['B-','B+','AB-','AB+'],'B+':['B+','AB+'],
 'AB-':['AB-','AB+'],'AB+':['AB+']
};

const BLOOD_GROUP=/^(AB|A|B|O)([+-])$/;

export function bloodKey(type,rh){
 const normalizedType=String(type??'').trim().toUpperCase().replace(/\s+/g,'');
 const direct=BLOOD_GROUP.exec(normalizedType);
 if(direct)return `${direct[1]}${direct[2]}`;
 const normalizedRh=String(rh??'').trim().toUpperCase().replace(/\s+/g,'');
 const combined=BLOOD_GROUP.exec(`${normalizedType}${normalizedRh}`);
 return combined?`${combined[1]}${combined[2]}`:'';
}

export const isCompatible=(donorType,donorRh,neededType,neededRh)=>{
 const donor=bloodKey(donorType,donorRh),needed=bloodKey(neededType,neededRh);
 return Boolean(donor&&needed&&canDonate[donor]?.includes(needed));
};

export const compatibilityNotice='La compatibilidad indicada por RedVital es orientativa. La validación definitiva corresponde al centro de salud.';
