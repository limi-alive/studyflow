import { useEffect, useId, useRef, useState } from 'react';
import { axisTickIndices, chartX, finiteChartValue } from '../utils/chartLayout';

export type TrendPoint = { label: string; value: number; compare?: number };

type Props = { points: TrendPoint[]; height?: number; compact?: boolean };

/** The axis uses the SAME x-coordinates as the data, not a separate flex row. */
export function TrendChart({ points, height = 270, compact = false }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const id = useId().replace(/:/g, '');
  const [width, setWidth] = useState(640);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const measure = () => setWidth(Math.max(160, Math.round(node.getBoundingClientRect().width)));
    measure();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const plotHeight = compact ? 128 : width < 540 ? 176 : height;
  const insetY = 20;
  const baseline = plotHeight - insetY;
  const values = points.map(point => finiteChartValue(point.value));
  const comparisons = points.map(point => finiteChartValue(point.compare));
  const hasCompare = points.some(point => typeof point.compare === 'number');
  const maximum = Math.max(60, ...values, ...comparisons);
  const ticks = axisTickIndices(points.length, width);
  const y = (value: number) => baseline - value / maximum * (plotHeight - insetY * 2);
  const line = values.map((value, i) => `${chartX(i, points.length, width)},${y(value)}`).join(' ');
  const compareLine = comparisons.map((value, i) => `${chartX(i, points.length, width)},${y(value)}`).join(' ');
  const firstX = chartX(0, points.length, width);
  const lastX = chartX(Math.max(0, points.length - 1), points.length, width);
  const area = `${firstX},${baseline} ${line} ${lastX},${baseline}`;
  const empty = values.every(value => value === 0);
  const labelWidth = ticks.length > 1 ? Math.min(84, (width - 56) / (ticks.length - 1) - 10) : 100;

  return <div ref={root} className={`trend-chart sf-trend${compact ? ' compact' : ''}`}>
    <div className="sf-trend__plot" style={{ height: plotHeight }}>
      <svg className="sf-trend__svg" preserveAspectRatio="none" viewBox={`0 0 ${width} ${plotHeight}`} width={width} height={plotHeight} role="img" aria-labelledby={`${id}-title`}>
        <title id={`${id}-title`}>Study time by date. {empty ? 'No study time in this period.' : `${points.length} data points.`}</title>
        <defs><linearGradient id={`${id}-fill`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity=".28"/>
          <stop offset="100%" stopColor="var(--accent)" stopOpacity=".015"/>
        </linearGradient></defs>
        {[0, .25, .5, .75, 1].map(tick => <line key={tick} x1={28} x2={width - 28} y1={y(tick * maximum)} y2={y(tick * maximum)} className="sf-trend__grid"/>) }
        {points.length > 1 && <polygon points={area} fill={`url(#${id}-fill)`}/>}
        {hasCompare && points.length > 1 && <polyline points={compareLine} className="sf-trend__compare"/>}
        {points.length > 1 && <polyline points={line} className="sf-trend__line"/>}
        {points.map((point, index) => (points.length <= 14 || ticks.includes(index)) && <circle key={index} cx={chartX(index, points.length, width)} cy={y(values[index])} r="3" className="sf-trend__dot"><title>{point.label}: {Math.round(values[index] / 60)} min</title></circle>)}
      </svg>
      {empty && !compact && <span className="sf-trend__empty">Your study sessions will appear here.</span>}
    </div>
    {!compact && <div className="sf-trend__axis" aria-hidden="true">
      {ticks.map(index => <span key={index} title={points[index].label} data-point-index={index} style={{ left: `${chartX(index, points.length, width) / width * 100}%`, maxWidth: labelWidth }}>{points[index].label}</span>)}
    </div>}
  </div>;
}
