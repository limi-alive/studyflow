export type TrendPoint = { label: string; value: number; compare?: number };

type Props = {
  points: TrendPoint[];
  height?: number;
  compact?: boolean;
};

function toPolyline(values: number[], width: number, height: number, padX: number, padY: number, max: number) {
  if (!values.length) return '';
  const usableW = width - padX * 2;
  const usableH = height - padY * 2;
  return values.map((value, index) => {
    const x = padX + (values.length === 1 ? usableW / 2 : (index / (values.length - 1)) * usableW);
    const y = padY + usableH - (value / Math.max(max, 1)) * usableH;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');
}

export function TrendChart({ points, height = 270, compact = false }: Props) {
  const width = 900;
  const padX = compact ? 18 : 34;
  const padY = compact ? 18 : 28;
  const values = points.map(point => point.value);
  const compare = points.map(point => point.compare ?? 0);
  const max = Math.max(...values, ...compare, 1);
  const line = toPolyline(values, width, height, padX, padY, max);
  const compareLine = toPolyline(compare, width, height, padX, padY, max);
  const area = line ? `${padX},${height-padY} ${line} ${width-padX},${height-padY}` : '';
  const yTicks = [0.25, 0.5, 0.75, 1];

  return <div className={`trend-chart ${compact ? 'compact' : ''}`}>
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Study time trend chart" preserveAspectRatio="none">
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity=".42"/>
          <stop offset="68%" stopColor="var(--accent)" stopOpacity=".09"/>
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/>
        </linearGradient>
        <filter id="trendGlow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      {yTicks.map(tick => <line key={tick} x1={padX} x2={width-padX} y1={padY + (height-padY*2)*(1-tick)} y2={padY + (height-padY*2)*(1-tick)} className="trend-gridline"/>)}
      {area && <polygon points={area} fill="url(#trendFill)"/>}
      {compareLine && <polyline points={compareLine} className="trend-compare" fill="none"/>}
      {line && <polyline points={line} className="trend-line" fill="none" filter="url(#trendGlow)"/>}
      {points.map((point, index) => {
        const [x,y] = line.split(' ')[index]?.split(',').map(Number) ?? [0,0];
        return <circle key={`${point.label}-${index}`} cx={x} cy={y} r={compact ? 3.5 : 4.5} className="trend-dot"><title>{point.label}: {Math.round(point.value/60)} min</title></circle>;
      })}
    </svg>
    {!compact && <div className="trend-axis">{points.map((point,index) => <span key={`${point.label}-${index}`}>{point.label}</span>)}</div>}
  </div>;
}
