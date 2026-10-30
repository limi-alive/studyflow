import type { UserSettings } from '../types';

export function formatAppDate(value: string | Date, settings?: UserSettings, options: Intl.DateTimeFormatOptions = { year:'numeric', month:'short', day:'numeric' }) {
  void settings;
  const date = typeof value === 'string' ? new Date(value) : value;
  // The Iranian edition uses Jalali for every visible date; ISO data is unchanged.
  const locale = 'fa-IR-u-ca-persian-nu-arabext';
  return new Intl.DateTimeFormat(locale, options).format(date);
}

export function formatAppNumber(value: number, settings?: UserSettings) {
  return new Intl.NumberFormat(settings?.numberFormat === 'persian' ? 'fa-IR' : 'en-US').format(value);
}

export function localText(settings: UserSettings | undefined, english: string, persian: string) {
  return settings?.language === 'fa' ? persian : english;
}
