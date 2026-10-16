import { TrendingUp, TrendingDown } from 'lucide-react';
import useCountUp from '../hooks/useCountUp';

const tones = {
  blue:  { chip: 'from-brand-500/30 to-cyan-500/10 text-brand-200', line: '#9B83FF', glow: 'bg-brand-500/20' },
  green: { chip: 'from-emerald-500/30 to-emerald-500/5 text-emerald-300', line: '#34D399', glow: 'bg-emerald-500/20' },
  red:   { chip: 'from-coral-500/30 to-coral-500/5 text-coral-300', line: '#FB7185', glow: 'bg-coral-500/20' },
  amber: { chip: 'from-amber-500/30 to-amber-500/5 text-amber-300', line: '#FBBF24', glow: 'bg-amber-500/20' },
};

/** Tiny line chart of recent values, drawn with SVG. */
function Sparkline({ data, color }) {
  if (!data || data.length < 2) return null;
  const w = 120, h = 36, max = Math.max(...data), min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - 4 - ((v - min) / span) * (h - 8)]);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const id = `spark-${color.slice(1)}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="-mb-1 h-8 w-24 flex-shrink-0" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.35" /><stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${w},${h} L0,${h} Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts.at(-1)[0]} cy={pts.at(-1)[1]} r="3" fill={color} />
    </svg>
  );
}

/**
 * KPI card. `value` is a number shown through `format` with a count-up animation.
 * trend: % change vs. the previous period (undefined hides the badge).
 * trendGoodWhenDown: for expenses a decrease is shown in green.
 */
export default function StatCard({ title, value, format = (v) => v, subtitle, icon: Icon, trend, trendGoodWhenDown = false, color = 'blue', spark, delay = 0 }) {
  const t = tones[color];
  const shown = useCountUp(value);
  const good = trend !== undefined && (trendGoodWhenDown ? trend <= 0 : trend >= 0);

  return (
    <div className="stat-card group overflow-hidden animate-rise" style={{ animationDelay: `${delay}ms` }}>
      <div className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl transition-opacity duration-500 opacity-60 group-hover:opacity-100 ${t.glow}`} />
      <div className="relative flex items-start justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ring-1 ring-inset ring-white/10 ${t.chip}`}>
          <Icon size={20} />
        </div>
        {trend !== undefined && (
          <span className={`badge ring-1 ring-inset ${good ? 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/20' : 'bg-coral-500/10 text-coral-300 ring-coral-400/20'}`}>
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="relative mt-5 text-[13px] font-medium text-white/50">{title}</p>
      <p className="num relative mt-1 whitespace-nowrap font-display text-[1.45rem] font-extrabold leading-tight tracking-tight text-white">{format(shown)}</p>
      <div className="relative mt-2 flex items-end justify-between gap-2">
        {subtitle ? <p className="text-xs text-white/35">{subtitle}</p> : <span />}
        <Sparkline data={spark} color={t.line} />
      </div>
    </div>
  );
}
