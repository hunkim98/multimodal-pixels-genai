import React, { useEffect, useRef, useState } from 'react'
import Canvas from './Canvas';

export interface BrushCanvasProps {
    width: number | string;
    height: number | string;
    canvasWidth: number;
    canvasHeight: number;
    style?: React.CSSProperties;
    brushColor?: string;
}

const BrushCanvas: React.FC<BrushCanvasProps> = (props) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
    const [editor, setEditor] = useState<Canvas | null>(null);


    useEffect(() => {
        const onResize = () => {
            if (containerRef.current && editor) {
                const dpr = window.devicePixelRatio;
                const rect = containerRef.current.getBoundingClientRect();
                editor.setSize(rect.width, rect.height, dpr);
                editor.scale(dpr, dpr);
                editor.render();
            }
        };
        onResize();
        window.addEventListener("resize", onResize);
        return () => {
            window.removeEventListener("resize", onResize);
        };
    }, [editor, containerRef, props.height, props.width]);

    useEffect(() => {
        if (canvasRef.current && backgroundCanvasRef.current) {
            const canvas = new Canvas(canvasRef.current, backgroundCanvasRef.current, props.canvasWidth, props.canvasHeight);
            setEditor(canvas);
        }
    }, [canvasRef, backgroundCanvasRef]);

    return (
        <div
            style={{
                width: props.width,
                height: props.height,
                position: 'relative',
                outline: 'none',
            }}
            ref={containerRef}
            tabIndex={1}
            onMouseDown={() => {
                containerRef.current?.focus();
            }}>
            <canvas ref={backgroundCanvasRef} style={{
                touchAction: 'none',
                position: "absolute",

                ...props.style,
            }} />
            <canvas ref={canvasRef} style={{
                position: "absolute",

                ...props.style,
            }} />
        </div>
    )
}

export default BrushCanvas