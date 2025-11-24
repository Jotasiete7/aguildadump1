import React, { useState, useEffect, useMemo } from 'react';
import { recipesCSV } from '../../data/recipesData';

const Recipes = () => {
    const [recipes, setRecipes] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRecipe, setSelectedRecipe] = useState(null);

    useEffect(() => {
        // Parse CSV
        const lines = recipesCSV.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const data = lines.slice(1).map(line => {
            // Handle commas inside quotes if necessary, but simple split works for this specific data
            // A more robust regex split for CSV:
            const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim());
            let obj = {};
            headers.forEach((h, i) => {
                obj[h] = values[i] || '';
            });
            return obj;
        });
        setRecipes(data);
    }, []);

    const filteredRecipes = useMemo(() => {
        if (!searchTerm) return recipes;
        const lower = searchTerm.toLowerCase();
        return recipes.filter(r =>
            r.name.toLowerCase().includes(lower) ||
            r.skill.toLowerCase().includes(lower) ||
            r.mandatory.toLowerCase().includes(lower)
        );
    }, [recipes, searchTerm]);

    const openModal = (recipe) => setSelectedRecipe(recipe);
    const closeModal = () => setSelectedRecipe(null);

    return (
        <div className="recipes-container fade-in">
            <div className="recipes-header">
                <h2 className="section-title">Livro de Receitas</h2>
                <div className="search-wrapper">
                    <input
                        type="text"
                        placeholder="Buscar receita, habilidade ou ingrediente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
            </div>

            <div className="recipes-grid">
                {filteredRecipes.map((recipe, index) => (
                    <div key={index} className="recipe-card" onClick={() => openModal(recipe)}>
                        <div className="recipe-icon">📜</div>
                        <div className="recipe-info">
                            <h3>{recipe.name}</h3>
                            <span className="recipe-skill">{recipe.skill}</span>
                        </div>
                    </div>
                ))}
            </div>

            {selectedRecipe && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="close-btn" onClick={closeModal}>&times;</button>
                        <h2 className="modal-title">{selectedRecipe.name}</h2>

                        <div className="modal-body">
                            <div className="detail-row">
                                <strong>Habilidade:</strong> <span>{selectedRecipe.skill}</span>
                            </div>
                            <div className="detail-row">
                                <strong>Container:</strong> <span>{selectedRecipe.container || 'N/A'}</span>
                            </div>
                            <div className="detail-row">
                                <strong>Utensílio:</strong> <span>{selectedRecipe.cooker || 'N/A'}</span>
                            </div>

                            <div className="ingredients-section">
                                <h3>Ingredientes Obrigatórios</h3>
                                <ul className="ingredients-list">
                                    {selectedRecipe.mandatory.split(';').map((ing, i) => (
                                        <li key={i}>{ing.trim()}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Recipes;
