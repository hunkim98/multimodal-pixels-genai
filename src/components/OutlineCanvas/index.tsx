import React from 'react'

export interface OutlineCanvasProps {
    width: number | string;
    height: number | string;
    style?: React.CSSProperties;
    brushColor?: string;
}

function OutlineCanvas() {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const backgroundCanvasRef = React.useRef<HTMLCanvasElement>(null);


    return (
        <div>
            <canvas ref={backgroundCanvasRef} />
            <canvas ref={canvasRef} />
        </div>
    )
}

export default OutlineCanvas