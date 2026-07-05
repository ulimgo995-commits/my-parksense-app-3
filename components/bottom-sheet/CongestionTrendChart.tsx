interface CongestionTrendChartProps {
  /** 0(여유) ~ 1(혼잡) 사이의 24개 시간대별 점유율 */
  hourlyOccupancy: number[];
  currentHour: number;
}

const WIDTH = 260;
const HEIGHT = 80;
const PADDING_X = 4;
const PADDING_TOP = 6;
const PLOT_HEIGHT = 56;

function toPoint(hour: number, occupancy: number): [number, number] {
  const x = PADDING_X + (hour / 23) * (WIDTH - PADDING_X * 2);
  const y = PADDING_TOP + (1 - occupancy) * PLOT_HEIGHT;
  return [x, y];
}

/** Bottom Sheet 상세 정보에 표시되는 24시간 혼잡도 추이 미니 차트 (샘플 데이터 기반) */
export function CongestionTrendChart({ hourlyOccupancy, currentHour }: CongestionTrendChartProps) {
  const points = hourlyOccupancy.map((value, hour) => toPoint(hour, value));
  const linePath = points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const baselineY = PADDING_TOP + PLOT_HEIGHT;
  const lastPoint = points[points.length - 1] ?? [WIDTH - PADDING_X, baselineY];
  const firstPoint = points[0] ?? [PADDING_X, baselineY];
  const areaPath = `${linePath} L${lastPoint[0]} ${baselineY} L${firstPoint[0]} ${baselineY} Z`;
  const current = points[Math.min(Math.max(currentHour, 0), 23)];

  return (
    <div className="flex gap-2">
      <div className="flex h-20 shrink-0 flex-col justify-between py-0.5 text-[10px] text-text-secondary">
        <span>혼잡</span>
        <span>보통</span>
        <span>여유</span>
      </div>
      <div className="min-w-0 flex-1">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full"
          role="img"
          aria-label={`시간대별 혼잡도 추이 그래프, 현재 ${currentHour}시 기준`}
        >
          <title>시간대별 혼잡도 추이</title>
          <line x1={PADDING_X} y1={PADDING_TOP} x2={WIDTH - PADDING_X} y2={PADDING_TOP} stroke="#E5E7EB" strokeWidth="1" />
          <line
            x1={PADDING_X}
            y1={PADDING_TOP + PLOT_HEIGHT / 2}
            x2={WIDTH - PADDING_X}
            y2={PADDING_TOP + PLOT_HEIGHT / 2}
            stroke="#E5E7EB"
            strokeWidth="1"
          />
          <line x1={PADDING_X} y1={baselineY} x2={WIDTH - PADDING_X} y2={baselineY} stroke="#E5E7EB" strokeWidth="1" />
          <path d={areaPath} fill="#EF4444" fillOpacity="0.08" stroke="none" />
          <path d={linePath} fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {current && (
            <>
              <line
                x1={current[0]}
                y1={PADDING_TOP}
                x2={current[0]}
                y2={baselineY}
                stroke="#EF4444"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <circle cx={current[0]} cy={current[1]} r="4" fill="#EF4444" stroke="#FFFFFF" strokeWidth="2" />
            </>
          )}
        </svg>
        <div className="flex items-center justify-between text-[10px] text-text-secondary">
          <span>00시</span>
          <span>12시</span>
          <span>24시</span>
        </div>
      </div>
    </div>
  );
}
