import { getUiLanguage } from './uiLanguage';
import type { UserSettings } from '../types';

export function formatAppDate(value: string | Date, settings?: UserSettings, options: Intl.DateTimeFormatOptions = { year:'numeric', month:'short', day:'numeric' }) {
  const date = typeof value === 'string' ? new Date(value) : value;
  // Display language and calendar are independent of reward-period accounting.
  const locale = (settings?.language ?? getUiLanguage()) === 'fa' ? 'fa-IR-u-ca-persian-nu-arabext' : 'en-US-u-ca-gregory-nu-latn';
  return new Intl.DateTimeFormat(locale, options).format(date);
}

export function formatAppNumber(value: number, settings?: UserSettings) {
  return new Intl.NumberFormat((settings?.language ?? getUiLanguage()) === 'fa' ? 'fa-IR' : 'en-US').format(value);
}

export function localText(settings: UserSettings | undefined, english: string, persian: string) {
  return (settings?.language ?? getUiLanguage()) === 'fa' ? persian : english;
}
