import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Consultancy = () => {
    return (
        <div className="consultancy-container fade-in">
            {/* Sidebar */}
            <div className="consultancy-sidebar">
                <Link to="/dashboard" className="btn-back">
                    <ArrowLeft size={16} /> Voltar ao Códex
                </Link>
            </div>

            {/* Main Content - Iframe */}
            <div className="consultancy-main">
                <iframe
                    src="/consultoria.html"
                    title="Consultoria"
                    style={{
                        width: '100%',
                        height: '100%',
                        border: 'none'
                    }}
                />
            </div>
        </div>
    );
};

export default Consultancy;
