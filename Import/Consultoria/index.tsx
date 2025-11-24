import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ComposedChart
} from "recharts";
import {
  FileText,
  Upload,
  Download,
  Activity,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  LayoutDashboard,
  Search,
  Briefcase,
  PieChart as PieIcon,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Trash2
} from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

type TradeType = "SUPPLY" | "DEMAND";

interface TradeRecord {
  id: number;
  date: Date;
  player: string;
  type: TradeType;
  product: string;
  price: number | null; // in copper
  ql: number | null;
  rarity: string;
  isHighValue: boolean;
  message: string;
}

interface MarketAnalysis {
  healthScore: number;
  totalVolume: number;
  supplyCount: number;
  demandCount: number;
  hhi: number;
  concentrationLabel: string;
  gaps: { product: string; demand: number; supply: number; ratio: number; gapScore: number }[];
  saturation: { product: string; demand: number; supply: number; saturation: number }[];
  competitors: { player: string; volume: number; avgPrice: number; strategy: string; avgQl: number; hvPercent: number }[];
  trends: { date: string; avgPrice: number; volume: number }[];
  topProducts: { name: string; value: number }[];
  hourlyActivity: { hour: number; supply: number; demand: number }[];
  bestHour: number;
}

const PROFILES: Record<string, { keywords: string[]; highValue: string[] }> = {
  ARCHAEOLOGIST: {
    keywords: ["fragment", "statue", "colossus", "pillar", "tower", "obelisk", "statuette", "arm", "leg", "torso", "head", "report", "papyrus", "journal", "trowel", "brush", "sarcophagus", "cache", "rift"],
    highValue: ["complete report", "statuette", "sarcophagus", "rare", "supreme", "gold"],
  },
  BLACKSMITH: {
    keywords: ["lump", "iron", "steel", "seryll", "glimmer", "adamantine", "pickaxe", "shovel", "hatchet", "sword", "axe", "shield", "hammer", "anvil", "nails", "rivets", "blade", "tool"],
    highValue: ["seryll", "glimmer", "adamantine", "rare", "supreme", "100ql", "90ql"],
  },
  CARPENTER: {
    keywords: ["wood", "plank", "log", "shaft", "bow", "cart", "wagon", "ship", "knarr", "corbita", "bed", "table", "chair", "barrel", "crate", "mallet", "spindle", "rope", "caravel", "boat"],
    highValue: ["knarr", "corbita", "caravel", "rare", "supreme", "large cart"],
  },
  MASONRY: {
    keywords: ["brick", "stone", "mortar", "clay", "shard", "marble", "slate", "pottery", "colossus", "slab", "statue", "chimney", "forge", "oven", "altar"],
    highValue: ["marble", "slate", "colossus", "rare", "supreme", "altar"],
  },
  TAILOR: {
    keywords: ["cotton", "wemp", "cloth", "leather", "hide", "scale", "drake", "dragon", "armor", "vest", "jacket", "boot", "saddle", "needle", "string"],
    highValue: ["drake", "dragon", "rare", "supreme", "dragon scale"],
  },
};

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

// ============================================================================
// LOGIC ENGINE (PORTED FROM PYTHON)
// ============================================================================

const parseCurrency = (text: string): number | null => {
  if (!text) return null;
  const pattern = /(\d+(?:\.\d+)?)\s*(g|s|c|gold|silver|copper)/gi;
  let total = 0;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const val = parseFloat(match[1]);
    const unit = match[2].toLowerCase()[0];
    if (unit === 'g') total += val * 10000;
    else if (unit === 's') total += val * 100;
    else if (unit === 'c') total += val;
  }
  return total > 0 ? total : null;
};

const extractQuality = (text: string): number | null => {
  const m = text.match(/\b(?:ql|quality)[\s:]*(\d{2,3})/i);
  return m ? parseInt(m[1]) : null;
};

const detectRarity = (text: string): string => {
  const t = text.toLowerCase();
  if (t.includes("fantastic")) return "FANTASTIC";
  if (t.includes("supreme")) return "SUPREME";
  if (t.includes("rare")) return "RARE";
  return "COMMON";
};

const generateMockData = (profileKey: string): string => {
  const keywords = PROFILES[profileKey].keywords;
  const players = ["TraderJoe", "CraftyAlice", "SmithyBob", "MerchantMike", "LuxuryLinda", "NewbieNed", "BaronVonLoot"];
  let data = "";
  const now = new Date();
  
  for (let i = 0; i < 200; i++) {
    const date = new Date(now.getTime() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000 - Math.floor(Math.random() * 24) * 60 * 60 * 1000);
    const dateStr = date.toISOString().slice(0, 19).replace("T", " ");
    const player = players[Math.floor(Math.random() * players.length)];
    const isSupply = Math.random() > 0.4; // 60% supply
    const kw = keywords[Math.floor(Math.random() * keywords.length)];
    const ql = Math.floor(Math.random() * 50) + 50;
    const price = Math.floor(Math.random() * 500) + 10;
    const type = isSupply ? "selling" : "buying";
    const rarity = Math.random() > 0.95 ? "rare" : "";
    const coin = Math.random() > 0.8 ? "s" : "c";
    
    const msg = `[${date.getHours().toString().padStart(2, '0')}:00] ${type} ${rarity} ${ql}ql ${kw} for ${price}${coin}`;
    data += `${dateStr} | Event | ${player} | ${msg}\n`;
  }
  return data;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const App = () => {
  const [profile, setProfile] = useState<string>("BLACKSMITH");
  const [fileContent, setFileContent] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [records, setRecords] = useState<TradeRecord[]>([]);
  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Chart Refs for PDF Capture
  const trendsChartRef = useRef<HTMLDivElement>(null);
  const gapsChartRef = useRef<HTMLDivElement>(null);
  const hourlyChartRef = useRef<HTMLDivElement>(null);
  const compChartRef = useRef<HTMLDivElement>(null);

  const processData = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const lines = fileContent.split('\n');
      const newRecords: TradeRecord[] = [];
      const profData = PROFILES[profile];

      lines.forEach((line, idx) => {
        const lower = line.toLowerCase();
        // Basic filtering (same as Python)
        if (!profData.keywords.some(kw => lower.includes(kw))) return;
        const isSupply = ["wts", "selling", "s>"].some(x => lower.includes(x));
        const isDemand = ["wtb", "buying", "b>"].some(x => lower.includes(x));
        if (!isSupply && !isDemand) return;

        const parts = line.split('|');
        if (parts.length < 4) return;

        try {
          const date = new Date(parts[0].trim());
          const player = parts[2].trim();
          const msg = parts[3].trim();
          const productKw = profData.keywords.find(kw => lower.includes(kw)) || "Unknown";
          const product = productKw.charAt(0).toUpperCase() + productKw.slice(1);
          
          newRecords.push({
            id: idx,
            date,
            player,
            type: isSupply ? "SUPPLY" : "DEMAND",
            product,
            price: parseCurrency(msg),
            ql: extractQuality(msg),
            rarity: detectRarity(msg),
            isHighValue: profData.highValue.some(hv => lower.includes(hv)),
            message: msg
          });
        } catch (e) { /* ignore */ }
      });

      setRecords(newRecords);
      runAnalysis(newRecords);
      setIsProcessing(false);
    }, 800);
  };

  const runAnalysis = (data: TradeRecord[]) => {
    if (data.length === 0) return;

    // 1. Maps for calculations
    const demandMap = new Map<string, number>();
    const supplyMap = new Map<string, number>();
    const prodPriceMap = new Map<string, {total: number, count: number}>();
    
    data.forEach(r => {
      if (r.type === "DEMAND") demandMap.set(r.product, (demandMap.get(r.product) || 0) + 1);
      else {
        supplyMap.set(r.product, (supplyMap.get(r.product) || 0) + 1);
        if(r.price) {
            const cur = prodPriceMap.get(r.product) || {total:0, count:0};
            cur.total += r.price;
            cur.count++;
            prodPriceMap.set(r.product, cur);
        }
      }
    });

    // 2. Market Gaps (Equivalent to Python logic)
    const allProducts = Array.from(new Set([...demandMap.keys(), ...supplyMap.keys()]));
    const gaps = allProducts.map(prod => {
      const d = demandMap.get(prod) || 0;
      const s = supplyMap.get(prod) || 0;
      return {
        product: prod,
        demand: d,
        supply: s,
        ratio: s === 0 ? d : d / (s + 1), // Avoiding div by zero, matching logic
        gapScore: (d * 2) - s
      };
    }).sort((a, b) => b.gapScore - a.gapScore);

    // 3. Saturation
    const saturation = allProducts.map(prod => {
        const d = demandMap.get(prod) || 0;
        const s = supplyMap.get(prod) || 0;
        return {
            product: prod,
            demand: d,
            supply: s,
            saturation: d === 0 ? s : s / (d + 1)
        };
    }).filter(x => x.saturation > 2).sort((a, b) => b.saturation - a.saturation);

    // 4. Competitors Logic
    const compMap = new Map<string, { count: number, totalPrice: number, priceCount: number, totalQl: number, qlCount: number, hvCount: number }>();
    data.filter(r => r.type === "SUPPLY").forEach(r => {
      const cur = compMap.get(r.player) || { count: 0, totalPrice: 0, priceCount: 0, totalQl: 0, qlCount: 0, hvCount: 0 };
      cur.count++;
      if (r.price) { cur.totalPrice += r.price; cur.priceCount++; }
      if (r.ql) { cur.totalQl += r.ql; cur.qlCount++; }
      if (r.isHighValue) cur.hvCount++;
      compMap.set(r.player, cur);
    });

    const globalAvgPrice = data.reduce((acc, r) => acc + (r.price || 0), 0) / (data.filter(r => r.price).length || 1);

    const competitors = Array.from(compMap.entries()).map(([player, stats]) => {
      const avg = stats.priceCount > 0 ? stats.totalPrice / stats.priceCount : 0;
      let strategy = "Médio";
      if (avg > 0) {
        if (avg < globalAvgPrice * 0.85) strategy = "Preço Baixo";
        else if (avg > globalAvgPrice * 1.15) strategy = "Premium";
      }
      return {
        player,
        volume: stats.count,
        avgPrice: avg,
        strategy,
        avgQl: stats.qlCount > 0 ? stats.totalQl / stats.qlCount : 0,
        hvPercent: (stats.hvCount / stats.count) * 100
      };
    }).sort((a, b) => b.volume - a.volume);

    // 5. HHI Concentration
    const totalSupply = data.filter(r => r.type === "SUPPLY").length;
    let hhi = 0;
    competitors.forEach(c => {
      const share = (c.volume / totalSupply);
      hhi += share * share; // Sum of squares of shares
    });
    hhi = hhi * 10000; // Standard HHI scale
    const concentrationLabel = hhi < 1500 ? "Competitivo" : hhi < 2500 ? "Moderado" : "Concentrado";

    // 6. Health Score
    const liquidity = Math.min(30, data.length / 100 * 30);
    const supplyCount = data.filter(r => r.type === "SUPPLY").length;
    const demandCount = data.filter(r => r.type === "DEMAND").length;
    const ratio = demandCount > 0 ? supplyCount / demandCount : 0;
    const balance = demandCount > 0 ? 30 * (1 - Math.abs(ratio - 1) / Math.max(ratio, 2)) : 0;
    const diversity = Math.min(20, allProducts.length / 10 * 20);
    const compScore = Math.min(20, competitors.length / 20 * 20);
    const healthScore = liquidity + Math.max(0, balance) + diversity + compScore;

    // 7. Trends (Aggregated by Day)
    const trendsMap = new Map<string, { total: number, count: number, vol: number }>();
    data.forEach(r => {
        const day = r.date.toISOString().split('T')[0];
        const cur = trendsMap.get(day) || { total: 0, count: 0, vol: 0 };
        cur.vol++;
        if (r.price) { cur.total += r.price; cur.count++; }
        trendsMap.set(day, cur);
    });
    const trends = Array.from(trendsMap.entries()).map(([date, stats]) => ({
        date,
        avgPrice: stats.count > 0 ? stats.total / stats.count : 0,
        volume: stats.vol
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 8. Hourly Activity (For Best Time to Sell)
    const hourMap = new Map<number, {s: number, d: number}>();
    for(let i=0; i<24; i++) hourMap.set(i, {s:0, d:0});
    data.forEach(r => {
        const h = r.date.getHours();
        const cur = hourMap.get(h)!;
        if(r.type === "SUPPLY") cur.s++; else cur.d++;
    });
    const hourlyActivity = Array.from(hourMap.entries()).map(([hour, stats]) => ({
        hour, supply: stats.s, demand: stats.d
    }));
    const bestHour = hourlyActivity.reduce((max, cur) => cur.supply > max.supply ? cur : max, hourlyActivity[0]).hour;

    // 9. Top Products (Volume)
    const topProducts = Array.from(demandMap.entries()) // Focus on demand for opportunities
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    setAnalysis({
      healthScore,
      totalVolume: data.length,
      supplyCount,
      demandCount,
      hhi,
      concentrationLabel,
      gaps,
      saturation,
      competitors,
      trends,
      topProducts,
      hourlyActivity,
      bestHour
    });
  };

  useEffect(() => {
    // Initial mock load removed to encourage file upload
  }, [profile]);

  // ============================================================================
  // PDF GENERATION (VISUAL + DATA)
  // ============================================================================

  const generatePDF = async () => {
    if (!analysis) return;
    
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;

    const captureChart = async (ref: React.RefObject<HTMLDivElement>) => {
        if (ref.current) {
            const canvas = await html2canvas(ref.current, { scale: 2, backgroundColor: '#ffffff' });
            return canvas.toDataURL('image/png');
        }
        return null;
    };

    const addHeader = () => {
        doc.setFillColor(30, 41, 59); // Dark Slate Blue
        doc.rect(0, 0, pageWidth, 35, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.text("A Guilda / Jotasiete", margin, 15);
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("DATA INTELLIGENCE DIVISION", margin, 22);
        
        doc.text(`RELATÓRIO: ${profile}`, pageWidth - margin, 15, { align: "right" });
        doc.text(`${new Date().toLocaleDateString()}`, pageWidth - margin, 22, { align: "right" });
    }

    const addFooter = (pageNo: number) => {
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(8);
        doc.text(`Jotasiete Data Intelligence | Confidential Report | Page ${pageNo}`, pageWidth/2, 285, { align: "center" });
    }

    // --- PAGE 1: OVERVIEW ---
    addHeader();
    
    let y = 45;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("1. Visão Executiva de Mercado", margin, y);
    y += 10;

    // Metrics Row (Simulated Box)
    doc.setFillColor(245, 247, 250);
    doc.setDrawColor(220, 220, 220);
    doc.rect(margin, y, contentWidth, 25, 'FD');
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("VOLUME TOTAL", margin + 5, y + 8);
    doc.text("SAÚDE (0-100)", margin + 45, y + 8);
    doc.text("CONCENTRAÇÃO", margin + 85, y + 8);
    doc.text("OFERTA vs DEMANDA", margin + 135, y + 8);

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(`${analysis.totalVolume}`, margin + 5, y + 18);
    doc.text(`${analysis.healthScore.toFixed(1)}`, margin + 45, y + 18);
    doc.text(`${analysis.concentrationLabel}`, margin + 85, y + 18);
    doc.text(`${(analysis.supplyCount / (analysis.demandCount||1)).toFixed(2)}x`, margin + 135, y + 18);

    y += 35;

    // Charts images
    doc.setFontSize(14);
    doc.text("2. Análise de Tendência e Volume", margin, y);
    y += 8;

    const trendImg = await captureChart(trendsChartRef);
    if (trendImg) {
        doc.addImage(trendImg, 'PNG', margin, y, contentWidth, 60);
        y += 65;
    }

    const gapImg = await captureChart(gapsChartRef);
    if (gapImg) {
        doc.text("3. Top Oportunidades (Demanda Não Atendida)", margin, y);
        y += 8;
        doc.addImage(gapImg, 'PNG', margin, y, contentWidth, 70);
    }

    addFooter(1);

    // --- PAGE 2: DEEP DIVE ---
    doc.addPage();
    addHeader();
    y = 45;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("4. Inteligência Competitiva", margin, y);
    y += 10;

    const compImg = await captureChart(compChartRef);
    if (compImg) {
        doc.addImage(compImg, 'PNG', margin, y, contentWidth, 60);
        y += 65;
    }

    doc.setFontSize(14);
    doc.text("5. Melhores Horários (Heatmap)", margin, y);
    y += 10;

    const hourImg = await captureChart(hourlyChartRef);
    if (hourImg) {
        doc.addImage(hourImg, 'PNG', margin, y, contentWidth, 50);
        y += 60;
    }

    // Recommendations Text
    doc.setFontSize(14);
    doc.text("6. Conclusões Estratégicas", margin, y);
    y += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    const recs = [
        `MOMENTO DE ENTRADA: O mercado está ${analysis.healthScore > 60 ? 'aquecido' : 'lento'}. Recomenda-se ação ${analysis.gaps[0]?.ratio > 2 ? 'IMEDIATA' : 'cautelosa'}.`,
        `PRODUTO ALVO: Focar em "${analysis.gaps[0]?.product}" que possui ${analysis.gaps[0]?.demand} pedidos e pouca oferta.`,
        `PREÇO: ${analysis.competitors.filter(c=>c.strategy === 'Preço Baixo').length} competidores estão praticando dumping. Mantenha-se no preço médio (${analysis.trends[analysis.trends.length-1]?.avgPrice.toFixed(0)}c).`,
        `TIMING: O pico de atividade é às ${analysis.bestHour}:00. Poste seus anúncios neste horário.`
    ];

    recs.forEach(r => {
        doc.setFillColor(0, 0, 0);
        doc.circle(margin + 2, y - 1, 1, 'F');
        doc.text(r, margin + 6, y);
        y += 7;
    });

    addFooter(2);

    // Save
    doc.save(`Consultoria_Jotasiete_${profile}.pdf`);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      
      {/* SIDEBAR */}
      <aside className="fixed inset-y-0 left-0 w-72 bg-slate-900 text-white z-20 flex flex-col shadow-2xl">
        <div className="p-6 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3 mb-1">
             <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center text-slate-900 font-bold text-xl">
                J7
             </div>
             <div>
                <h1 className="text-lg font-bold tracking-tight text-white">A GUILDA</h1>
                <p className="text-[10px] text-amber-500 font-semibold tracking-widest uppercase">Data Intelligence</p>
             </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-5 space-y-8">
          {/* Profile Selector */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Users size={14}/> Perfil de Análise
            </label>
            <div className="relative">
                <select 
                value={profile} 
                onChange={(e) => setProfile(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none appearance-none font-medium text-slate-200"
                >
                {Object.keys(PROFILES).map(k => <option key={k} value={k}>{k}</option>)}
                </select>
                <div className="absolute right-3 top-3.5 pointer-events-none text-slate-400">▼</div>
            </div>
          </div>

          {/* Data Source */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileText size={14}/> Fonte de Dados
            </label>
            
            <div className="grid grid-cols-1 gap-3">
                {/* File Upload - HERO ELEMENT */}
                <div className={`relative border-2 border-dashed rounded-xl p-4 transition-all duration-300 ${fileName ? 'border-green-500 bg-green-500/10' : 'border-slate-700 hover:border-amber-500 bg-slate-800/50'}`}>
                    <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => {
                        const f = e.target.files?.[0];
                        if(f) {
                            setFileName(f.name);
                            const r = new FileReader();
                            r.onload = (ev) => setFileContent(ev.target?.result as string);
                            r.readAsText(f);
                        }
                    }} />
                    
                    <div className="flex flex-col items-center text-center">
                        {fileName ? (
                            <>
                                <CheckCircle className="text-green-500 mb-2" size={24} />
                                <p className="text-xs font-bold text-green-400 break-all line-clamp-1">{fileName}</p>
                                <p className="text-[10px] text-slate-400 mt-1">Arquivo carregado</p>
                                <button onClick={(e) => {
                                    e.preventDefault();
                                    setFileName("");
                                    setFileContent("");
                                    setAnalysis(null);
                                }} className="absolute top-2 right-2 text-slate-500 hover:text-red-400">
                                    <Trash2 size={14} />
                                </button>
                            </>
                        ) : (
                            <>
                                <Upload className="text-amber-500 mb-2" size={24} />
                                <p className="text-xs font-bold text-slate-200">Carregar .TXT</p>
                                <p className="text-[10px] text-slate-500 mt-1">Arraste ou clique aqui</p>
                            </>
                        )}
                    </div>
                </div>

                {/* Mock Data - SECONDARY */}
                <button 
                    onClick={() => {
                        setFileName("DEMO_DATA.txt");
                        setFileContent(generateMockData(profile));
                    }}
                    className="w-full text-[10px] text-slate-500 hover:text-slate-300 py-2 transition text-center flex items-center justify-center gap-1"
                >
                    <LayoutDashboard size={12} />
                    Usar Dados de Teste (Demo)
                </button>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-4 border-t border-slate-800">
            <button 
                onClick={processData}
                disabled={isProcessing || !fileContent}
                className={`w-full py-4 rounded-lg shadow-xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all duration-300
                    ${isProcessing || !fileContent ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white hover:shadow-amber-500/20'}`}
            >
                {isProcessing ? <Activity className="animate-spin" size={18}/> : <Target size={18} />}
                PROCESSAR DADOS
            </button>
            {!fileContent && (
                <p className="text-[10px] text-center text-slate-600 mt-2">Carregue um arquivo para iniciar</p>
            )}
          </div>
        </div>
        
        <div className="p-4 bg-slate-950 text-[10px] text-center text-slate-600 font-mono">
            Jotasiete Engine v3.1 | Secure Mode
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="ml-72 p-10">
        
        {/* Top Bar */}
        <header className="flex justify-between items-start mb-10">
            <div>
                <h2 className="text-3xl font-light text-slate-900">Dashboard de Consultoria</h2>
                <p className="text-slate-500 mt-2 flex items-center gap-2 text-sm">
                    Status do Sistema: <span className="text-green-600 font-bold flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> ONLINE</span>
                </p>
            </div>
            
            {analysis && (
                <button 
                    onClick={generatePDF}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 transition hover:-translate-y-0.5 font-medium group"
                >
                    <Download size={20} className="group-hover:scale-110 transition-transform" />
                    <div>
                        <span className="block text-xs text-slate-400 uppercase tracking-wider">Exportar</span>
                        Relatório PDF
                    </div>
                </button>
            )}
        </header>

        {!analysis ? (
            <div className="flex flex-col items-center justify-center h-[50vh] border-2 border-dashed border-slate-300 rounded-2xl bg-slate-100/50 transition-all">
                <div className={`p-6 rounded-full shadow-sm mb-4 transition-all ${fileName ? 'bg-green-100 text-green-600' : 'bg-white text-slate-300'}`}>
                    {fileName ? <FileText size={48} /> : <LayoutDashboard size={48} />}
                </div>
                <h3 className="text-xl font-semibold text-slate-700">
                    {fileName ? "Arquivo Pronto" : "Aguardando Dados"}
                </h3>
                <p className="text-slate-500 mt-2 max-w-md text-center">
                    {fileName 
                        ? `Arquivo "${fileName}" carregado. Clique em "PROCESSAR DADOS" na barra lateral.` 
                        : "Use a barra lateral esquerda para carregar seu log 'wurm_trade_master...'"}
                </p>
            </div>
        ) : (
            <div className="space-y-8 animate-fade-in">
                
                {/* 1. EXECUTIVE METRICS */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: "Volume Total", val: analysis.totalVolume, icon: Activity, color: "blue", sub: "Transações Analisadas" },
                        { label: "Market Health", val: analysis.healthScore.toFixed(1), icon: CheckCircle, color: analysis.healthScore > 60 ? "green" : "orange", sub: "/ 100 Pontos" },
                        { label: "Concentração", val: analysis.hhi.toFixed(0), icon: Users, color: "purple", sub: analysis.concentrationLabel },
                        { label: "Gap Score", val: analysis.gaps[0]?.ratio.toFixed(1) + "x", icon: TrendingUp, color: "amber", sub: "Maior Oportunidade" }
                    ].map((kpi, i) => (
                        <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-lg bg-${kpi.color}-50 text-${kpi.color}-600`}>
                                    <kpi.icon size={24} />
                                </div>
                                {i === 1 && <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-bold">LIVE</span>}
                            </div>
                            <h3 className="text-3xl font-bold text-slate-800">{kpi.val}</h3>
                            <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide mt-1">{kpi.label}</p>
                            <p className="text-xs text-slate-400 mt-1">{kpi.sub}</p>
                        </div>
                    ))}
                </div>

                {/* 2. CHARTS SECTION (Used for PDF Capture) */}
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Trends Chart */}
                    <div className="col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100" ref={trendsChartRef}>
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">Tendência de Mercado</h3>
                                <p className="text-sm text-slate-500">Evolução de Preço Médio vs Volume de Vendas</p>
                            </div>
                        </div>
                        <div className="h-72 w-full">
                            <ResponsiveContainer>
                                <ComposedChart data={analysis.trends}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="date" tickFormatter={(v) => v.split('-').slice(1).join('/')} fontSize={12} stroke="#94a3b8" />
                                    <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" fontSize={12} />
                                    <YAxis yAxisId="right" orientation="right" stroke="#cbd5e1" fontSize={12} />
                                    <Tooltip 
                                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                                    />
                                    <Bar yAxisId="right" dataKey="volume" name="Volume" fill="#e2e8f0" barSize={20} radius={[4,4,0,0]} />
                                    <Line yAxisId="left" type="monotone" dataKey="avgPrice" name="Preço Médio" stroke="#3b82f6" strokeWidth={3} dot={{r:3, fill:"#3b82f6"}} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Gaps Chart */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100" ref={gapsChartRef}>
                        <h3 className="font-bold text-slate-800 text-lg mb-1">Lacunas de Demanda</h3>
                        <p className="text-sm text-slate-500 mb-6">Produtos com alta procura e baixa oferta</p>
                        <div className="h-72 w-full">
                            <ResponsiveContainer>
                                <BarChart data={analysis.gaps.slice(0, 6)} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="product" type="category" width={90} tick={{fontSize: 11, fill: '#475569'}} />
                                    <Tooltip cursor={{fill: 'transparent'}} />
                                    <Bar dataKey="demand" name="Demanda" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={16} stackId="a" />
                                    <Bar dataKey="supply" name="Oferta" fill="#cbd5e1" radius={[0, 4, 4, 0]} barSize={16} stackId="a" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* 3. STRATEGY ROW */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Competitors Table & Chart */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100" ref={compChartRef}>
                        <h3 className="font-bold text-slate-800 text-lg mb-6">Posicionamento Competitivo</h3>
                        <div className="h-60 w-full mb-4">
                             <ResponsiveContainer>
                                <BarChart data={analysis.competitors.slice(0, 7)}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="player" fontSize={10} />
                                    <YAxis fontSize={10} />
                                    <Tooltip />
                                    <Bar dataKey="volume" fill="#6366f1" name="Volume" radius={[4,4,0,0]} />
                                    <Bar dataKey="avgPrice" fill="#a5b4fc" name="Preço Médio" radius={[4,4,0,0]} />
                                </BarChart>
                             </ResponsiveContainer>
                        </div>
                        <div className="overflow-hidden rounded-lg border border-slate-100">
                             <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
                                    <tr>
                                        <th className="px-4 py-3">Player</th>
                                        <th className="px-4 py-3 text-right">Preço Médio</th>
                                        <th className="px-4 py-3 text-center">Estratégia</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {analysis.competitors.slice(0,4).map((c,i) => (
                                        <tr key={i} className="hover:bg-slate-50">
                                            <td className="px-4 py-2 font-medium text-slate-700">{c.player}</td>
                                            <td className="px-4 py-2 text-right font-mono text-slate-600">{c.avgPrice.toFixed(0)}c</td>
                                            <td className="px-4 py-2 text-center">
                                                <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold
                                                    ${c.strategy === 'Premium' ? 'bg-purple-100 text-purple-700' : 
                                                      c.strategy === 'Preço Baixo' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                                                    {c.strategy}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                             </table>
                        </div>
                    </div>

                    {/* Hourly Heatmap */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100" ref={hourlyChartRef}>
                         <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">Mapa de Calor Horário</h3>
                                <p className="text-sm text-slate-500">Melhores momentos para anunciar</p>
                            </div>
                            <div className="text-right">
                                <span className="block text-xs text-slate-400 uppercase">Melhor Hora</span>
                                <span className="text-xl font-bold text-green-600">{analysis.bestHour}:00</span>
                            </div>
                        </div>
                        <div className="h-60 w-full">
                             <ResponsiveContainer>
                                <BarChart data={analysis.hourlyActivity}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="hour" fontSize={10} tickFormatter={v=>`${v}h`}/>
                                    <YAxis fontSize={10} />
                                    <Tooltip />
                                    <Bar dataKey="demand" stackId="a" fill="#22c55e" name="Demanda" />
                                    <Bar dataKey="supply" stackId="a" fill="#cbd5e1" name="Oferta" />
                                </BarChart>
                             </ResponsiveContainer>
                        </div>
                        <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-100">
                            <h4 className="text-sm font-bold text-green-800 mb-1 flex items-center gap-2">
                                <Briefcase size={16}/> Recomendação J7
                            </h4>
                            <p className="text-xs text-green-700 leading-relaxed">
                                Baseado na atividade, poste anúncios entre <strong>{analysis.bestHour}:00</strong> e <strong>{(analysis.bestHour+2)%24}:00</strong>.
                                Evite competir por atenção durante a madrugada (02:00 - 06:00).
                            </p>
                        </div>
                    </div>

                </div>

                {/* Footer Info */}
                <div className="text-center text-xs text-slate-400 pt-8 pb-4">
                    Jotasiete Data Intelligence © 2025 • Generated via J7 Engine
                </div>
            </div>
        )}
      </main>
    </div>
  );
};

const container = document.getElementById("root");
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}