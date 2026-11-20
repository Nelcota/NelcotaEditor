/** Smooth band whose height at each stage is proportional to how many videos reached it. */
export function buildFunnelPath(
    counts: Array<number>,
    size: { width: number; height: number },
): string {
    const first = counts[0] ?? 0;

    if (counts.length < 2 || first === 0) {
        return "";
    }

    const middle = size.height / 2;
    const step = size.width / (counts.length - 1);
    const halfHeight = (count: number) => Math.max(1, (count / first) * middle);
    const points = counts.map((count, index) => ({ x: index * step, half: halfHeight(count) }));
    const curve = (
        from: { x: number; half: number },
        to: { x: number; half: number },
        sign: number,
    ) => {
        const controlX = (from.x + to.x) / 2;

        return `C${controlX} ${middle + sign * from.half} ${controlX} ${middle + sign * to.half} ${to.x} ${middle + sign * to.half}`;
    };
    const upper = points.slice(1).map((point, index) => curve(points[index] ?? point, point, -1));
    const reversed = points.toReversed();
    const lower = reversed
        .slice(1)
        .map((point, index) => curve(reversed[index] ?? point, point, 1));
    const last = reversed[0] ?? points[0];

    return [
        `M0 ${middle - halfHeight(first)}`,
        ...upper,
        `L${last?.x ?? 0} ${middle + (last?.half ?? 0)}`,
        ...lower,
        "Z",
    ].join(" ");
}
