import React from 'react'

function OutlineCanvas() {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    return (
        <div>
            <canvas ref={canvasRef} />
        </div>
    )
}

export default OutlineCanvas