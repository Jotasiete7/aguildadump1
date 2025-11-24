import React from 'react';

const SatView = () => {
    return (
        <div style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0, zIndex: 100 }}>
            <iframe
                src="satview/index.html"
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Harmony SatView"
            />
        </div>
    );
};

export default SatView;
