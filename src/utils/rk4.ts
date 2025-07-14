export function rk4(
    f: (t: number, y: number[], params: any) => number[],
    y0: number[],
    t0: number,
    t1: number,
    dt: number,
    params: any
): { t: number[]; y: number[][] } {
    const ts = [];
    const ys = [];

    let y = [...y0];
    let t = t0;

    while (t <= t1) {
        ts.push(t);
        ys.push([...y]);

        const k1 = f(t, y, params);
        const k2 = f(t + dt / 2, y.map((yi, i) => yi + dt / 2 * k1[i]), params);
        const k3 = f(t + dt / 2, y.map((yi, i) => yi + dt / 2 * k2[i]), params);
        const k4 = f(t + dt, y.map((yi, i) => yi + dt * k3[i]), params);

        y = y.map((yi, i) => yi + dt / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
        t += dt;
    }

    return { t: ts, y: ys };
}
