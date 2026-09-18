const PRIORITIES={
 ALTO:['ALTO','ALTA','HIGH','URGENCY HIGH'],
 MEDIO:['MEDIO','MEDIA','MEDIUM','URGENCY MEDIUM'],
 BAJO:['BAJO','BAJA','LOW','URGENCY LOW']
};

const PRIORITY_PRESENTATION={
 ALTO:{label:'Alto',indicator:'🔴',className:'alto'},
 MEDIO:{label:'Medio',indicator:'🟠',className:'medio'},
 BAJO:{label:'Bajo',indicator:'🟢',className:'bajo'}
};

export function normalizePriority(value){
 const priority=String(value??'').trim().toUpperCase();
 return Object.entries(PRIORITIES).find(([,values])=>values.includes(priority))?.[0]||priority;
}

export function priorityBadge(value){
 const priority=normalizePriority(value),presentation=PRIORITY_PRESENTATION[priority]||{label:priority,className:'default',indicator:'•'};
 return `<span class="priority-badge priority-badge--${presentation.className}" aria-label="Prioridad: ${presentation.label}"><span aria-hidden="true">${presentation.indicator}</span><span>${presentation.label}</span></span>`;
}
