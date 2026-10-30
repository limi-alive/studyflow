import { useMemo } from 'react';
import { useUiLanguage } from '../lib/uiLanguage';
import { PersianDatePicker } from './PersianDatePicker';
import { persianToGregorian, toPersianLocal, type PersianYmd } from '../utils/persianCalendar';

/** Display-only input choice: canonical date storage always remains UTC ISO. */
export function LocalizedDatePicker({ value, onChange, label, required=false }: {
  value: PersianYmd;
  onChange: (date: PersianYmd)=>void;
  label: string;
  required?: boolean;
}) {
  const language=useUiLanguage();
  const gregorian=useMemo(()=>{
    const {year,month,day}=persianToGregorian(value.year,value.month,value.day);
    return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  },[value.year,value.month,value.day]);
  if(language==='fa') return <PersianDatePicker value={value} onChange={onChange} label={label} required={required}/>;
  return <label className="localized-gregorian-date"><span>{label}</span><input className="input" type="date" required={required} value={gregorian} onChange={event=>{
    const [year,month,day]=event.target.value.split('-').map(Number);
    if(!year||!month||!day)return;
    const date=new Date(year,month-1,day,12);
    if(date.getFullYear()!==year||date.getMonth()!==month-1||date.getDate()!==day)return;
    onChange(toPersianLocal(date));
  }}/></label>;
}
