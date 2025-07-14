import { useState, useEffect, useRef } from "react";
import Plot from "react-plotly.js";

export default function OdeViewer() {
    const [s, setS] = useState(1);
    const [a, setA] = useState(0.5);
    const [d, setD] = useState(0.2);

    const dt = 0.01;
    const windowSize = 5; // seconds
    const maxPoints = 3000;

    // Parameter refs
    const sRef = useRef(s);
    const aRef = useRef(a);
    const bRef = useRef(d);

    // Simulation state refs
    const tRef = useRef(0);
    const kRef = useRef(1);

    // Store points as array of [t, k]
    const pointsRef = useRef<{ t: number; k: number; a: number; s: number }[]>([
        { t: 0, k: 1, a: a, s: s }
    ]);


    // For animation frame timing
    const requestRef = useRef<number>(0);
    const lastTimeRef = useRef<number | null>(null);

    // React state for plotting
    const [plotData, setPlotData] = useState<{
        t: number[];
        k: number[];
        p: number[];
        c: number[];
        i: number[];
    }>({ t: [0], k: [1], p: [1], c: [s], i: [(1 - s)] });


    // Update refs on param change
    useEffect(() => { sRef.current = s; }, [s]);
    useEffect(() => { aRef.current = a; }, [a]);
    useEffect(() => { bRef.current = d; }, [d]);

    useEffect(() => {
        const step = (time: number) => {
            if (lastTimeRef.current === null) lastTimeRef.current = time;
            const elapsed = (time - lastTimeRef.current) / 1000;

            let acc = 0;
            while (acc < elapsed) {
                const k = kRef.current;
                const dk = sRef.current * Math.pow(k, aRef.current) - bRef.current * k;
                kRef.current += dk * dt;
                tRef.current += dt;
                acc += dt;

                pointsRef.current.push({
                    t: tRef.current,
                    k: kRef.current,
                    a: aRef.current,
                    s: sRef.current,
                });

                // Keep only points within windowSize and maxPoints
                while (pointsRef.current.length > maxPoints || (pointsRef.current.length && pointsRef.current[0].t < tRef.current - windowSize)) {
                    pointsRef.current.shift();
                }
            }

            const tArray = pointsRef.current.map(p => p.t);
            const kArray = pointsRef.current.map(p => p.k);
            const pArray = pointsRef.current.map(p => Math.pow(p.k, p.a));
            const cArray = pointsRef.current.map(p => p.s * Math.pow(p.k, p.a));
            const iArray = pointsRef.current.map(p => (1 - p.s) * Math.pow(p.k, p.a));

            setPlotData({
                t: tArray,
                k: kArray,
                p: pArray,
                c: cArray,
                i: iArray,
            });



            lastTimeRef.current = time;
            requestRef.current = requestAnimationFrame(step);
        };

        requestRef.current = requestAnimationFrame(step);
        return () => cancelAnimationFrame(requestRef.current!);
    }, []);

    const kMax = Math.max(...plotData.k, 1); // fallback min max =1 to avoid zero range
    const kMargin = kMax * 0.1;
    const kRange = [0, kMax + kMargin];

    const yMax = Math.max(...plotData.p, 1); // fallback min max =1 to avoid zero range
    const yMargin = yMax * 0.1;
    const yRange = [0, kMax + yMargin];

    return (
        <div>
            <div style={{ maxWidth: 600, marginBottom: 16 }}>
                <label>s: {s.toFixed(2)}</label>
                <input type="range" min="0" max="1" step="0.01" value={s} onChange={e => setS(+e.target.value)} />
                <br/>
                <label>d: {d.toFixed(2)}</label>
                <input type="range" min="0" max="1" step="0.01" value={d} onChange={e => setD(+e.target.value)} />
                <br/>
                <label>a: {a.toFixed(2)}</label>
                <input type="range" min="0" max="1" step="0.01" value={a} onChange={e => setA(+e.target.value)} />
            </div>
            <Plot
                data={[{ x: plotData.t, y: plotData.k, type: "scatter", mode: "lines", name: "k(t)" }]}
                layout={{
                    width: 600,
                    height: 400,
                    title: { text: "Capital" },
                    yaxis: {
                        range: kRange, // fixes y-axis lower bound to 0, upper bound auto
                        autorange: false,
                    },
            }}
            />
            <Plot
                data={[
                    { x: plotData.t, y: plotData.c, type: "scatter", mode: "lines", name: "investment" },
                    { x: plotData.t, y: plotData.i, type: "scatter", mode: "lines", name: "consumption" },
                    { x: plotData.t, y: plotData.p, type: "scatter", mode: "lines", name: "production" }
                ]}
                layout={{
                    width: 600,
                    height: 400,
                    title: { text: "Output" },
                    yaxis: {
                        range: yRange, // fixes y-axis lower bound to 0, upper bound auto
                        autorange: false,
                    },
                }}
            />
        </div>
    );
}
