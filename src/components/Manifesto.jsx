import React from 'react';

const Manifesto = () => {
    return (
        <div className="manifesto-container">
            <section id="manifesto-da-guilda">
                <h1 className="manifesto-titulo">Nossa Essência. Nosso Códex.</h1>
                <h2 className="manifesto-slogan">A Guilda: Estratégia, Nicho e Legado.</h2>

                <div className="manifesto-secao">
                    <h3 className="secao-titulo">I. O Legado da Forja</h3>
                    <p className="secao-paragrafo">
                        Nossa jornada começou com a fundação do comércio, atuando na intermediação de grandes volumes e na consolidação de recursos. Essa base nos tornou peritos em logística e alianças. Hoje, o foco mudou, mas o aprendizado permanece: <strong>não somos varejo</strong>, mas a ponte para o nível mestre. O palco do nosso trabalho agora é o <span className="destaque-rubro">nicho</span> e o <span className="destaque-rubro">serviço de alto valor agregado</span>.
                    </p>
                </div>

                <div className="manifesto-secao">
                    <h3 className="secao-titulo">II. Os Pilares da Confiança</h3>
                    <p className="secao-paragrafo">
                        A Guilda é um refúgio de profissionais, e a <strong>Confiança</strong> é o nosso aço mais valioso. Adotamos os mais <span className="destaque-rubro">nobres princípios</span> de justiça e lealdade. Nossa comunidade não é pública; é construída por filtros rigorosos de fama, comportamento e princípios justos. Para nós, a confiança mútua é o catalisador que garante a qualidade inegável de tudo que fazemos.
                    </p>
                </div>

                <div className="manifesto-secao">
                    <h3 className="secao-titulo">III. A Missão Estratégica</h3>
                    <p className="secao-paragrafo">
                        Operamos com autonomia e sustentabilidade, garantidas por nossas <em>skills</em> diversificadas, que abrangem desde a extração e alquimia, até a administração de <em>deeds</em> e grandes projetos de engenharia civil. Nossa meta é a **ascensão estratégica**. Para as alianças e comunidades, somos o acesso exclusivo a <span className="destaque-rubro">serviços de alta relevância</span> e a uma rede de profissionais que definem a excelência no comércio de Wurm.
                    </p>
                </div>
            </section>
        </div>
    );
};

export default Manifesto;
