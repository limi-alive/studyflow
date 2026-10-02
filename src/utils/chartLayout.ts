/** Layout helpers only. These never change the underlying study totals. */
export function axisTickIndices(length: number, width: number): number[] {
  const n = Math.max(0, Math.floor(length));
  if (n === 0) return [];
  if (n === 1) return [0];
  const available = Number.isFinite(width) ? Math.max(160, width) : 320;
  const count = Math.min(n, Math.max(2, Math.min(12, Math.floor((available - 48) / 64) + 1)));
  return Array.from({ length: count }, (_, i) => Math.round(i * (n - 1) / (count - 1)));
}

export function chartX(index: number, count: number, width: number, inset = 28): number {
  return count <= 1 ? width / 2 : inset + (width - inset * 2) * index / (count - 1);
}

export function finiteChartValue(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0;
}
