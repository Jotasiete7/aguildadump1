import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Codex from './components/Codex';
import Manifesto from './components/Manifesto';
import Dashboard from './components/tools/Dashboard';
import Recipes from './components/tools/Recipes';
import WeaponsGuide from './components/tools/WeaponsGuide';
import Consultancy from './components/tools/Consultancy';
import SatView from './components/tools/SatView';

function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <>
      <div className="bg-forge"></div>
      <div className="bg-overlay"></div>

      <Router>
        <div className="container">
          {/* Header Fixed */}
          <header>
            <button className="menu-btn" onClick={toggleMenu}>
              {menuOpen ? <X color="#fff" size={32} /> : <Menu color="#fff" size={32} />}
            </button>
          </header>

          {/* Menu Overlay */}
          <div className={`menu-overlay ${menuOpen ? 'open' : ''}`}>
            <ul className="menu-links">
              <li><Link to="/" onClick={toggleMenu}>HOME</Link></li>
              <li><Link to="/codex" onClick={toggleMenu}>CÓDEX</Link></li>
              <li><Link to="/manifesto" onClick={toggleMenu}>MANIFESTO</Link></li>
              <li style={{ borderBottom: '1px solid #333', margin: '20px 0' }}></li>
              <li><Link to="/dashboard" onClick={toggleMenu}>DASHBOARD TABELA DE PREÇOS</Link></li>
              <li><Link to="/recipes" onClick={toggleMenu}>RECEITAS</Link></li>
              <li><Link to="/weapons-guide" onClick={toggleMenu}>GUIA DE ARMAS</Link></li>
              <li><Link to="/consultancy" onClick={toggleMenu}>CONSULTORIA</Link></li>
              <li><Link to="/satview" onClick={toggleMenu}>HARMONY SATVIEW</Link></li>
            </ul>
          </div>

          <div className="app-content">
            <Routes>
              <Route path="/" element={
                <div className="hero">
                  <h1 className="hero-title">A GUILDA</h1>
                  <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                    <Link to="/codex" className="cta-btn">ACESSAR O CÓDEX DE DADOS</Link>
                  </div>
                </div>
              } />

              <Route path="/codex" element={<Codex />} />
              <Route path="/manifesto" element={<Manifesto />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/recipes" element={<Recipes />} />
              <Route path="/weapons-guide" element={<WeaponsGuide />} />
              <Route path="/consultancy" element={<Consultancy />} />
              <Route path="/satview" element={<SatView />} />
            </Routes>
          </div>

          <footer>
            <div className="social-icons">
              <a href="#" className="social-icon" title="Discord">
                {/* Placeholder for "Selo de Cera" Discord Icon */}
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#B00000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#000',
                  fontWeight: 'bold',
                  fontSize: '0.8rem'
                }}>
                  DC
                </div>
              </a>
              <a href="#" className="social-icon">GitHub</a>
            </div>
            <p style={{ marginTop: '20px', color: '#737373', fontSize: '0.8rem' }}>
              © 2025 A Guilda.
            </p>
          </footer>
        </div>
      </Router>
    </>
  );
}

export default App;
