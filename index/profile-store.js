// Browser-only prototype. No session, tokens, passwords or remote storage.
(() => {
  const key='gtel-local-profile-v1';
  const initial={id:'local',nombres:'Usuario',apellidos:'Demo',email:'demo@example.test',telefono:'900000001',ubicacion:'Lima',correoContacto:'',localidad:'Lima',foto:''};
  window.previewProfile={
    read(){try{const value=JSON.parse(localStorage.getItem(key)||'null');return value&&typeof value==='object'&&!Array.isArray(value)?{...initial,...value}:{...initial};}catch{return {...initial};}},
    save(profile){try{const safe=Object.fromEntries(Object.keys(initial).map(k=>[k,profile[k]??initial[k]]));localStorage.setItem(key,JSON.stringify(safe));return true;}catch{return false;}},
    clear(){try{localStorage.removeItem(key);}catch{/* Storage unavailable. */}}
  };
})();
