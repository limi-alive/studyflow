/** Display-only Jalali formatting. StudyFlow continues storing UTC ISO timestamps. */
const locale = 'fa-IR-u-ca-persian-nu-arabext';

export function localDayFromKey(key: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) throw new RangeError('Invalid local date key');
  const [year, month, day] = key.split('-').map(Number);
  // Local noon avoids DST and UTC parsing shifting a day in the UI.
  const date = new Date(year, month - 1, day, 12);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    throw new RangeError('Invalid local date key');
  }
  return date;
}

export function jalaliLabel(key: string, options: Intl.DateTimeFormatOptions = {day:'numeric',month:'long',year:'numeric'}) {
  return new Intl.DateTimeFormat(locale,options).format(localDayFromKey(key));
}

export function jalaliRange(keys: readonly string[]) {
  if (!keys.length) return '';
  const first = jalaliLabel(keys[0]);
  const last = jalaliLabel(keys[keys.length - 1]);
  return first === last ? first : `${first} تا ${last}`;
}

export function jalaliNumber(value: number) {
  return new Intl.NumberFormat('fa-IR', {useGrouping:false}).format(value);
}
