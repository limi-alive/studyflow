import type { UserSettings } from '../types';

export function formatAppDate(value: string | Date, settings?: UserSettings, options: Intl.DateTimeFormatOptions = { year:'numeric', month:'short', day:'numeric' }) {
  const date = typeof value === 'string' ? new Date(value) : value;
  const persianCalendar = settings?.calendarType === 'jalali';
  const locale = persianCalendar ? 'fa-IR-u-ca-persian' : settings?.language === 'fa' ? 'fa-IR' : undefined;
  return new Intl.DateTimeFormat(locale, options).format(date);
}

export function formatAppNumber(value: number, settings?: UserSettings) {
  return new Intl.NumberFormat(settings?.numberFormat === 'persian' ? 'fa-IR' : 'en-US').format(value);
}

export function localText(settings: UserSettings | undefined, english: string, persian: string) {
  return settings?.language === 'fa' ? persian : english;
}
