"use client";
import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'; 
import { useRouter } from "next/navigation"

const TradingBotsAnalysis = () => {
  const [selectedBot, setSelectedBot] = useState('all');
  const [leverage, setLeverage] = useState(1);
  const [chartMode, setChartMode] = useState('comparative');
  
  // 🔹 Aquí vos cargás tu objeto botsData con tus datos
    const botsData = {
    'Año 2025': [3.0978453961439487,-2.8632620943137748,3.3143398444506915,3.1453125052594206,-2.8042228188425575,3.1734044154369188,3.193876565298795,-2.788095969260139,3.0663158335299476,3.1012236840913046],
    'Año 2024': [-2.8693975097029925,3.1122795179854013,-3.101096273441973,3.0934371183711535,3.0989195255373594,-2.7452402585376654,-2.7724309871723833,3.181208404904004,-3.173406888917731,3.2971751756298078,3.2112626531744297,3.0780066278610283,-2.8671240217885643,-2.9518586613190343,3.2207150382964027,3.0859315879222327,-3.06246895157308,3.102921709779642],
    'Año 2023': [3.217266109208927,-3.5109008471729433,3.0678262270647383,3.154373386666729,-2.8374381860428017,3.124903233222362,-2.792963101504058,-3.0333620579257476,3.2636460613268548,-3.005630702002627,3.559432930376289,3.085398116466509],
    'Año 2022': [-2.979626535520318,3.1957421691684584,3.0910637980557967,-2.7491567667737318,3.099150236503243,-2.770156350025622,3.0933424406417713,-2.83682711264004,-3.006900185882845,3.172529549672407,-2.7430666430196338,3.064321933817313,3.1059094740053776,3.0672951360857006],
    'Año 2021': [3.401931345849246,-2.786238404848457,3.0671062500245974,-2.77062880034549,3.136202608809934,4.387781794362035,3.2362546585573337,3.135781974816893,-2.799143226128845,3.098196576283689,3.088214934698246,3.107622497275131,-2.75324792809923,3.2646688497846528]
  };

  // 🔹 función existente para calcular métricas
  const calculateReturns = (trades, leverageMultiplier = 1) => {
    const leveragedTrades = trades.map(t => t * leverageMultiplier);
    const linearReturn = leveragedTrades.reduce((sum, pct) => sum + pct, 0);
    const compoundReturn = leveragedTrades.reduce((acc, pct) => acc * (1 + pct / 100), 1);
    const compoundReturnPct = (compoundReturn - 1) * 100;
    const winningTrades = leveragedTrades.filter(t => t > 0);
    const losingTrades = leveragedTrades.filter(t => t < 0);
    const winRate = (winningTrades.length / leveragedTrades.length) * 100;
    const avgWin = winningTrades.reduce((sum, t) => sum + t, 0) / winningTrades.length;
    const avgLoss = losingTrades.reduce((sum, t) => sum + t, 0) / losingTrades.length;
    const largestWin = Math.max(...leveragedTrades);
    const largestLoss = Math.min(...leveragedTrades);

    let peak = 100;
    let maxDrawdown = 0;
    let currentCapital = 100;

    leveragedTrades.forEach(pct => {
      currentCapital = currentCapital * (1 + pct / 100);
      if (currentCapital > peak) peak = currentCapital;
      const drawdown = ((peak - currentCapital) / peak) * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });

    return {
      linearReturn,
      compoundReturnPct,
      totalTrades: leveragedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate,
      avgWin,
      avgLoss,
      profitFactor: Math.abs(avgWin * winningTrades.length) / Math.abs(avgLoss * losingTrades.length),
      largestWin,
      largestLoss,
      maxDrawdown,
      finalCapital: currentCapital
    };
  };
  const router = useRouter();
  const results = useMemo(() => {
    const out = {};
    for (const botName in botsData) {
      out[botName] = calculateReturns(botsData[botName], leverage);
    }
    return out;
  }, [leverage, botsData]);

  // 🔹 función NUEVA para curva de capital
  const getEquityCurve = (trades, leverageMultiplier = 1) => {
    let capital = 100;
    return trades.map((pct, index) => {
      capital = capital * (1 + (pct * leverageMultiplier) / 100);
      return { trade: index + 1, capital };
    });
  };

  const getBotData = () => {
    if (selectedBot === 'all') {
      return Object.entries(results);
    }
    return [[selectedBot, results[selectedBot]]];
  };

  const getStatusColor = (value) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getStatusBg = (value) => {
    if (value > 0) return 'bg-green-50';
    if (value < 0) return 'bg-red-50';
    return 'bg-gray-50';
  };

  // 🔹 dataset para gráfico comparativo
  const comparativeData = (() => {
  const curves = {};
  let maxLength = 0;
  
  // Generar curvas y encontrar la longitud máxima
  for (const botName in botsData) {
    curves[botName] = getEquityCurve(botsData[botName], leverage);
    if (curves[botName].length > maxLength) {
      maxLength = curves[botName].length;
    }
  }

  // Crear array combinado hasta la longitud máxima
  const combined = [];
  for (let i = 0; i < maxLength; i++) {
    const row = { trade: i + 1 };
    for (const botName in curves) {
      // Si este bot tiene datos para este trade, usarlos; si no, null
      row[botName] = i < curves[botName].length ? curves[botName][i].capital : null;
    }
    combined.push(row);
  }
  return combined;
})();

// 🔹 NUEVO: Gráfico secuencial acumulado (todos los años conectados)
  const sequentialData = (() => {
    let capital = 100;
    let tradeCounter = 0;
    const sequential = [];
    
    // Ordenar los bots por año (1Y, 2Y, 3Y, 4Y, 5Y)
    const sortedBots = Object.keys(botsData).sort((a, b) => {
      const yearA = parseInt(a.match(/(\d+)Y/)?.[1] || '0');
      const yearB = parseInt(b.match(/(\d+)Y/)?.[1] || '0');
      return yearA - yearB;
    });

    sortedBots.forEach((botName, botIndex) => {
      const trades = botsData[botName];
      
      trades.forEach((pct, tradeIndex) => {
        tradeCounter++;
        capital = capital * (1 + (pct * leverage) / 100);
        
        sequential.push({
          trade: tradeCounter,
          capital: capital,
          bot: botName,
          year: botIndex + 1,
          tradeInYear: tradeIndex + 1
        });
      });
    });

    return sequential;
  })();

  const irAInit = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Análisis Detallado de Bots de Trading</h1>
          <p className="text-slate-600">Comparación de rendimientos lineales vs compuestos con apalancamiento</p>
        </div>

        {/* Apalancamiento */}
        <div className="mb-6 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">⚡ Nivel de Apalancamiento</h3>
          <div className="flex gap-3 flex-wrap">
            {[1, 2, 3, 5, 10].map(lev => (
              <button
                key={lev}
                onClick={() => setLeverage(lev)}
                className={`px-6 py-3 rounded-lg font-bold transition-all ${
                  leverage === lev 
                    ? 'bg-purple-600 text-white shadow-lg transform scale-105' 
                    : 'bg-slate-100 text-slate-700 hover:bg-purple-50'
                }`}
              >
                x{lev}
              </button>
            ))}
          </div>
          {leverage > 1 && (
            <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <p className="text-sm text-red-700">
                <strong>⚠️ Advertencia:</strong> Con apalancamiento x{leverage}, cada ganancia y pérdida se multiplica por {leverage}. El riesgo aumenta exponencialmente.
              </p>
            </div>
          )}
        </div>

        <div className="mb-4 sm:mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedBot('all')}
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all whitespace-nowrap text-sm sm:text-base flex-shrink-0 ${
              selectedBot === 'all' 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'bg-white text-slate-700 hover:bg-blue-50'
            }`}
          >
            Ver Todos
          </button>
          {Object.keys(results).map(bot => (
            <button
              key={bot}
              onClick={() => setSelectedBot(bot)}
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all whitespace-nowrap text-sm sm:text-base flex-shrink-0 ${
                selectedBot === bot 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'bg-white text-slate-700 hover:bg-blue-50'
              }`}
            >
              {bot}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:gap-6">
          {getBotData().map(([botName, data]) => (
            <div key={botName} className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Card Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
                    {botName}
                  </h2>
                  {leverage > 1 && (
                    <span className="bg-purple-500 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold text-white self-start sm:ml-auto">
                      Apalancamiento x{leverage}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-6">
                {/* Métricas */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className={`${getStatusBg(data.linearReturn)} rounded-lg p-6 border-2 border-slate-200`}>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-slate-600" />
                      <h3 className="font-semibold text-slate-700">Rendimiento Lineal</h3>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">Suma simple de todos los profitPct</p>
                    <div className={`text-4xl font-bold ${getStatusColor(data.linearReturn)}`}>
                      {data.linearReturn > 0 ? '+' : ''}{data.linearReturn.toFixed(2)}%
                    </div>
                  </div>

                  <div className={`${getStatusBg(data.compoundReturnPct)} rounded-lg p-6 border-2 border-slate-200`}>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="w-5 h-5 text-slate-600" />
                      <h3 className="font-semibold text-slate-700">Rendimiento Compuesto</h3>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">Multiplicación acumulativa (reinversión)</p>
                    <div className={`text-4xl font-bold ${getStatusColor(data.compoundReturnPct)}`}>
                      {data.compoundReturnPct > 0 ? '+' : ''}{data.compoundReturnPct.toFixed(2)}%
                    </div>
                  </div>
                </div>

                {/* 🔹 Gráfico curva de capital */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">📈 Curva de Capital</h3>
                  <div className="w-full h-64">
                    <ResponsiveContainer>
                      <LineChart
                        data={getEquityCurve(botsData[botName], leverage)}
                        margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                      >
                        <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                        <XAxis dataKey="trade" />
                        <YAxis />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="capital"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Diferencia */}
                <div className="mt-6 bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
                  <p className="text-sm text-slate-700">
                    <strong>Diferencia entre métodos:</strong> {Math.abs(data.compoundReturnPct - data.linearReturn).toFixed(2)}%
                    {data.compoundReturnPct > data.linearReturn ? ' (el compuesto es mayor)' : ' (el lineal es mayor)'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 🔹 Gráfico comparativo/secuencial unificado */}
        {comparativeData.length > 0 && sequentialData.length > 0 && (
          <div className="mt-10 bg-white rounded-xl shadow-lg p-6">
            {/* Toggle entre modos */}
           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-slate-800">
               📊 {chartMode === 'comparative' ? 'Comparativa Curvas de Capital' : 'Evolución Secuencial Acumulada'} {leverage > 1 ? `(x${leverage})` : ''}
              </h3>
        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
            <button
            onClick={() => setChartMode('comparative')}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md font-medium transition-all text-sm sm:text-base ${
            chartMode === 'comparative'
            ? 'bg-white text-blue-600 shadow-md'
            : 'text-slate-600 hover:text-slate-800'
          }`}
          >
            Comparativa
        </button>
        <button
          onClick={() => setChartMode('sequential')}
          className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md font-medium transition-all text-sm sm:text-base ${
            chartMode === 'sequential'
              ? 'bg-white text-purple-600 shadow-md'
              : 'text-slate-600 hover:text-slate-800'
          }`}
          >
            Secuencial
        </button>
      </div>
  </div>

            {/* Descripción según el modo */}
            <p className="text-sm text-slate-600 mb-4">
              {chartMode === 'comparative' 
                ? 'Todos los bots en paralelo desde el mismo punto de partida.'
                : 'Cada año se conecta con el anterior. El capital final de un año es el inicial del siguiente (rendimiento compuesto total).'
              }
            </p>

            {/* Gráfico Comparativo */}
            {chartMode === 'comparative' && (
              <div className="w-full h-80">
                <ResponsiveContainer>
                  <LineChart
                    data={comparativeData}
                    margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                  >
                    <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                    <XAxis dataKey="trade" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {Object.keys(botsData).map((botName, idx) => {
                      const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
                      return (
                        <Line
                          key={botName}
                          type="monotone"
                          dataKey={botName}
                          stroke={colors[idx % colors.length]}
                          strokeWidth={2}
                          dot={false}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Gráfico Secuencial */}
            {chartMode === 'sequential' && (
              <>
                <div className="w-full h-96">
                  <ResponsiveContainer>
                    <LineChart
                      data={sequentialData}
                      margin={{ top: 5, right: 20, bottom: 13, left: 1 }}
                    >
                      <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                      <XAxis 
                        dataKey="trade" 
                        label={{ value: 'Operación Total', position: 'insideBottom', offset: -10 }}
                      />
                      <YAxis 
                        label={{ value: 'Capital (%)', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white p-3 border border-slate-300 rounded shadow-lg">
                                <p className="font-bold text-slate-800">{data.bot}</p>
                                <p className="text-sm text-slate-600">Operación #{data.trade}</p>
                                <p className="text-sm text-slate-600">Trade {data.tradeInYear} del año {data.year}</p>
                                <p className="text-lg font-bold text-blue-600">
                                  {data.capital.toFixed(2)}%
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="capital"
                        stroke="#8b5cf6"
                        strokeWidth={3}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Resumen final */}
                <div className="mt-6 bg-purple-50 border-l-4 border-purple-600 p-4 rounded">
                   <p className="text-sm text-slate-700">
                   <strong>Capital Final (5 años acumulados):</strong>{' '}
                   <span className={`text-xl font-bold ${getStatusColor(sequentialData[sequentialData.length - 1].capital - 100)}`}>
                    {sequentialData[sequentialData.length - 1].capital.toFixed(2)}
                    </span>
                    {' '}
                    <span className={`text-xl font-bold ${getStatusColor(sequentialData[sequentialData.length - 1].capital - 100)}`}>
                    ({sequentialData[sequentialData.length - 1].capital >= 100 ? '+' : ''}{(sequentialData[sequentialData.length - 1].capital - 100).toFixed(2)}%)
                    </span>
                    </p>
                    <p className="text-xs text-slate-600 mt-2">
                    Capital inicial: 100 → Capital final: {sequentialData[sequentialData.length - 1].capital.toFixed(2)} | Total de operaciones: {sequentialData.length}
                    </p>
                  </div>
              </>
            )}
          </div>
        )}
          
      </div>
       <button onClick={irAInit} className={`px-6 py-3 rounded-lg font-bold bg-purple-600 text-white shadow-lg scale-100 mt-6 transition-all duration-300 hover:scale-110 justify-center mx-auto flex items-center gap-2`}>
                Inicio
              </button>
    </div>
  );
};

export default TradingBotsAnalysis;

