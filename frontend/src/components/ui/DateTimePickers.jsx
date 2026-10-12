import { useLayoutEffect, useRef } from 'react';
import './pickerElements';

// Controlled React bridge: readable text in the field, ISO value in React state.
function Picker({kind, label, name, value, onChange, disabled=false}) {
  const ref=useRef(null);
  useLayoutEffect(()=>{
    const element=ref.current;
    if(element.isoValue!==(value||''))element.setISOValue(value||'');
    element.trigger.disabled=disabled;
    element.trigger.setAttribute('aria-required','true');
    if(disabled&&element.panel.matches(':popover-open'))element.close();
    const listener=event=>onChange(event.detail.iso);
    element.addEventListener(kind+'change',listener);
    return ()=>element.removeEventListener(kind+'change',listener);
  },[kind,value,onChange,disabled]);
  const Tag=kind==='date'?'gtel-date-picker':'gtel-time-picker';
  return <Tag ref={ref} label={label} name={name} />;
}
export function DatePicker(props){return <Picker {...props} kind="date" />;}
export function TimePicker(props){return <Picker {...props} kind="time" />;}

const durations=[[15,'15 min'],[30,'30 min'],[60,'1 hr'],[90,'1:30 hr'],[120,'2 hr']];
export function DurationPicker({value,onChange,disabled=false}){
  const supported=durations.some(([minutes])=>minutes===Number(value));
  return <label>Duración<select name="minutes" required disabled={disabled} value={supported?value:''} onChange={e=>onChange(Number(e.target.value))} className="block w-full rounded border p-2">
    {!supported&&<option value="" disabled>Selecciona una duración (máximo 2 hr)</option>}
    {durations.map(([minutes,label])=><option key={minutes} value={minutes}>{label}</option>)}
  </select></label>;
}
