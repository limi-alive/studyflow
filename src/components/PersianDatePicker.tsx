import { useMemo } from 'react';
import { PERSIAN_MONTHS, formatPersianNumber, persianToGregorian, type PersianYmd } from '../utils/persianCalendar';

const years = Array.from({length: 101},(_,i)=>1390+i);

export function PersianDatePicker({value,onChange,label,required=false}: {
  value: PersianYmd; onChange:(next:PersianYmd)=>void; label:string; required?:boolean;
}) {
  const availableDays=useMemo(()=>{
    const valid:number[]=[];
    for(let day=1;day<=31;day++){
      try{persianToGregorian(value.year,value.month,day);valid.push(day);}catch{break;}
    }
    return valid;
  },[value.year,value.month]);
  const update=(part:Partial<PersianYmd>)=>{
    const next={...value,...part};
    const max=Array.from({length:31},(_,i)=>i+1).filter(d=>{try{persianToGregorian(next.year,next.month,d);return true;}catch{return false;}}).length;
    onChange({...next,day:Math.min(next.day,max)});
  };
  return <fieldset className="jalali-date-picker" dir="rtl">
    <legend>{label}</legend>
    <div className="jalali-date-fields">
      <label><span>روز</span><select className="input" required={required} value={value.day} onChange={e=>update({day:Number(e.target.value)})} aria-label={`${label} روز`}>{availableDays.map(d=><option key={d} value={d}>{formatPersianNumber(d)}</option>)}</select></label>
      <label><span>ماه</span><select className="input" value={value.month} onChange={e=>update({month:Number(e.target.value)})} aria-label={`${label} ماه`}>{PERSIAN_MONTHS.map((m,i)=><option key={m} value={i+1}>{m}</option>)}</select></label>
      <label><span>سال</span><select className="input" value={value.year} onChange={e=>update({year:Number(e.target.value)})} aria-label={`${label} سال`}>{years.map(y=><option key={y} value={y}>{formatPersianNumber(y)}</option>)}</select></label>
    </div>
  </fieldset>;
}

