import { useEffect, useRef, useState } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { BriefcaseBusiness, UserRound, UsersRound, Bell, ChevronDown, Menu, X, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { request } from '../../services/workflowService';
import './admin-header.css';

export default function AdminHeader(){
  const {user,logout}=useAuth();const {pathname}=useLocation();const navigate=useNavigate();
  const [mobile,setMobile]=useState(false),[profile,setProfile]=useState(false);
  const [notifications,setNotifications]=useState(null);
  const header=useRef(null),profileArea=useRef(null),profileButton=useRef(null),menuButton=useRef(null);
  useEffect(()=>{
    const close=e=>{if(!profileArea.current?.contains(e.target))setProfile(false);if(!header.current?.contains(e.target))setMobile(false);};
    document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close);
  },[]);
  useEffect(()=>{
    let active=true,controller;
    const refresh=()=>{controller?.abort();controller=new AbortController();request('/api/notifications',{signal:controller.signal}).then(rows=>{if(active&&Array.isArray(rows))setNotifications({token:user.token,count:rows.filter(r=>!r.leida).length});}).catch(()=>{if(active&&!controller.signal.aborted)setNotifications(null);});};
    refresh();window.addEventListener('focus',refresh);window.addEventListener('gtel:notifications-changed',refresh);
    return()=>{active=false;controller?.abort();window.removeEventListener('focus',refresh);window.removeEventListener('gtel:notifications-changed',refresh);};
  },[pathname,user.token]);
  const count=notifications?.token===user.token?notifications.count:null;
  const name=[user.nombres,user.apellidos].filter(Boolean).join(' ')||'Administrador';
  const close=()=>{setMobile(false);setProfile(false);};
  return <header className="admin-header" ref={header} onKeyDown={e=>{if(e.key==='Escape'){if(profile){setProfile(false);profileButton.current?.focus();}else if(mobile){setMobile(false);menuButton.current?.focus();}}}}>
    <div className="admin-header-inner">
      <Link to="/admin" className="admin-brand" onClick={close} aria-label="GTEL Talento, inicio de administración"><span className="admin-brand-icon"><BriefcaseBusiness size={20}/></span><span><strong>GTEL Talento</strong><small>Administración</small></span></Link>
      <nav id="admin-navigation" aria-label="Navegación de administración" className={'admin-navigation'+(mobile?' is-open':'')} onClick={e=>{if(e.target.closest('a'))close();}}>
        <NavLink end to="/admin">Inicio</NavLink>
        <NavLink to="/admin/auditoria">Auditoría</NavLink>
        <NavLink to="/notificaciones" title={count===null?'Notificaciones: contador no disponible':count+' sin leer'}><Bell size={15} aria-hidden="true"/>Notificaciones{count>0&&<span className="admin-unread" aria-label={count+' notificaciones sin leer'}>{count>99?'99+':count}</span>}</NavLink>
        <NavLink to="/ofertas">Ofertas</NavLink>
        <Link to="/mis-postulaciones" className="admin-perspective"><UserRound size={15} aria-hidden="true"/>Vista candidato</Link>
        <Link to="/reclutador/dashboard" className="admin-perspective"><UsersRound size={15} aria-hidden="true"/>Vista reclutador</Link>
      </nav>
      <div className="admin-actions">
        <div ref={profileArea} className="admin-profile" onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setProfile(false);}}>
          <button ref={profileButton} className="admin-profile-trigger" type="button" aria-expanded={profile} aria-controls="admin-profile-options" aria-label={'Perfil de '+name} onClick={()=>{setProfile(!profile);setMobile(false);}}><span className="admin-avatar">{user.foto?<img src={user.foto} alt=""/>:<UserRound size={18}/>}</span><span className="admin-profile-name">{name}<small>Administrador</small></span><ChevronDown size={15} aria-hidden="true"/></button>
          {profile&&<div id="admin-profile-options" className="admin-profile-options"><p><strong>{name}</strong><span>{user.email}</span></p><Link to="/perfil" onClick={close}><Settings size={16}/>Ajustes de perfil</Link><button type="button" onClick={()=>{close();logout();navigate('/',{replace:true});}}><LogOut size={16}/>Cerrar sesión</button></div>}
        </div>
        <button ref={menuButton} type="button" className="admin-menu-toggle" aria-controls="admin-navigation" aria-expanded={mobile} aria-label={mobile?'Cerrar menú de administración':'Abrir menú de administración'} onClick={()=>{setMobile(!mobile);setProfile(false);}}>{mobile?<X size={21}/>:<Menu size={21}/>}</button>
      </div>
    </div>
  </header>;
}
