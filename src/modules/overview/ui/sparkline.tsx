import { Line, LineChart } from "recharts";
import type { ChangeTone } from "#/modules/overview/metric-change";

const WIDTH = 96;
const HEIGHT = 40;

const TONE_COLORS: Record<ChangeTone, string> = {
    good: "var(--success)",
    bad: "var(--destructive)",
    neutral: "var(--muted-foreground)",
};

interface SparklineProps {
    values: Array<number | null>;
    tone: ChangeTone;
}

/** Decorative: the trend is already written next to it, so it stays hidden from screen readers. */
export function Sparkline({ values, tone }: SparklineProps) {
    const points = values.map((value, day) => ({ day, value }));

    return (
        <div aria-hidden="true" className="shrink-0">
            <LineChart
                width={WIDTH}
                height={HEIGHT}
                data={points}
                margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
            >
                <Line
                    type="monotone"
                    dataKey="value"
                    stroke={TONE_COLORS[tone]}
                    strokeWidth={1.8}
                    dot={false}
                    connectNulls
                    isAnimationActive={false}
                />
            </LineChart>
        </div>
    );
}
