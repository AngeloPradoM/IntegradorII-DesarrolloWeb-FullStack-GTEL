import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
export default function useSavedJobs(){
 const {user}=useAuth();const key='gtel-saved-jobs:'+encodeURIComponent(user?.id==null?'guest':String(user.id));
 const [cache,setCache]=useState({key:null,ids:[]});
 function read(){try{const value=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(value)?value.filter(id=>typeof id==='string'||typeof id==='number'):[];}catch{return [];}}
 const saved=cache.key===key?cache.ids:read();
 function toggleSave(id){const next=saved.includes(id)?saved.filter(value=>value!==id):[...saved,id];try{localStorage.setItem(key,JSON.stringify(next));}catch{/* Current tab still works when storage is unavailable. */}setCache({key,ids:next});}
 return {saved,toggleSave};
}
