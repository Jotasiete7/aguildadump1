import React from 'react';

const Codex = () => {
    const cards = [
        { title: "Gráficos Anuais", desc: "Dados estatísticos e performance da guilda.", icon: "📊" },
        { title: "Consultoria Estratégica", desc: "Planejamento e otimização de recursos.", icon: "♟️" },
        { title: "Orçamento e Suprimentos", desc: "Gestão financeira e logística.", icon: "💰" },
        { title: "Extração de Materiais", desc: "Relatórios de qualidade e mineração.", icon: "⛏️" },
        { title: "Venda de Deeds", desc: "Administração de propriedades e terras.", icon: "📜" },
        { title: "Canal de Comunicação", desc: "Acesso direto ao nosso servidor Discord.", icon: "💬", link: "https://discord.gg/enRV6qwY" }
    ];

    return (
        <div className="codex-container">
            {cards.map((card, index) => (
                <div key={index} className="data-card" onClick={() => card.link && window.open(card.link, '_blank')}>
                    <div className="card-icon">{card.icon}</div>
                    <h3 className="card-title">{card.title}</h3>
                    <p className="card-desc">{card.desc}</p>
                </div>
            ))}
        </div>
    );
};

export default Codex;
