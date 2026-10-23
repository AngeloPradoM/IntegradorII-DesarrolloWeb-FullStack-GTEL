import { Link, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { Briefcase, LogOut, TicketCheck, Wrench } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ui/ThemeToggle';
import NotificationBell from '../components/layout/NotificationBell';

export default function TechnicianLayout(){
 const {user,logout}=useAuth();const navigate=useNavigate();
 if(user?.rol!=='TECNICO'||!user?.token)return <Navigate to="/" replace/>;
 const exit=()=>{logout();navigate('/',{replace:true});};
 return <div className="min-h-dvh bg-brand-bg dark:bg-slate-950 dark:text-white">
  <header className="sticky top-0 z-40 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"><div className="mx-auto flex min-h-16 max-w-[1488px] items-center gap-4 px-4 sm:px-6"><Link to="/tecnico/tickets" className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-red text-white"><Briefcase className="h-5 w-5"/></span><span><strong className="block text-sm text-brand-navy dark:text-white">GTEL Talento</strong><small className="text-xs text-slate-500">Soporte técnico</small></span></Link><nav className="ml-6 hidden md:block"><Link to="/tecnico/tickets" className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-brand-red dark:bg-red-950/30"><TicketCheck className="h-4 w-4"/>Tickets</Link></nav><div className="ml-auto flex items-center gap-3"><ThemeToggle/><NotificationBell/><span className="hidden text-right text-xs sm:block"><strong className="block">{user.email}</strong><small className="text-slate-500">Técnico de sistemas</small></span><button onClick={exit} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:text-brand-red dark:border-slate-700" aria-label="Cerrar sesión"><LogOut className="h-4 w-4"/></button></div></div></header>
  <main><Outlet/></main>
  <div className="fixed bottom-4 right-4 hidden rounded-full bg-brand-navy p-3 text-white shadow-lg sm:grid"><Wrench className="h-5 w-5"/></div>
 </div>;
}
