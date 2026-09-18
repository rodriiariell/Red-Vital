import{KEYS,read,write}from'./storage.js';import{getUsers,getUser}from'./users.js';
export const activeUser=()=>{const session=read(KEYS.session,null);return session?getUser(session.userId):null};
export function login(email,password){const user=getUsers().find(u=>u.email.toLowerCase()===email.toLowerCase()&&u.password===password);if(!user)return null;write(KEYS.session,{userId:user.id,startedAt:new Date().toISOString()});return user}
export function logout(){localStorage.removeItem(KEYS.session);location.href='index.html'}
export function requireAuth(role){const user=activeUser();if(!user){location.replace(`login.html?next=${encodeURIComponent(location.pathname.split('/').pop()||'panel.html')}`);return null}const allowed=Array.isArray(role)?role:[role];if(role&&!allowed.includes(user.role)){location.replace(user.role==='admin'?'admin.html':'panel.html');return null}return user}
