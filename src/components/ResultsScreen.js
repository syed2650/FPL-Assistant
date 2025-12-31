"use client";
import MiniLeagueView from '@/components/MiniLeagueView';
import Watchlist from '@/components/Watchlist';
import { useState } from 'react';

export default function ResultsScreen({ picks, userTeam, bootstrapData, onReset, strategyMode, onModeChange }) {
    // picks = { mode, gwInfo, captain, transfer, swingPicks }
    const fplId = userTeam?.entry?.id;
    const currentGw = userTeam?.entry_history?.event;

    const { gwInfo, captain, transfer, swingPicks, mode } = picks;

    const deadlineStr = gwInfo ? new Date(gwInfo.deadline_time).toLocaleString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }) : 'Loading...';

    const handleSaveWatchlist = (player) => {
        const saved = JSON.parse(localStorage.getItem('fpl_watchlist') || '[]');
        if (!saved.includes(player.id)) {
            saved.push(player.id);
            localStorage.setItem('fpl_watchlist', JSON.stringify(saved));
            alert(`Saved ${player.web_name} to Watchlist!`);
            window.dispatchEvent(new Event('storage'));
        } else {
            alert(`${player.web_name} is already in your watchlist.`);
        }
    };

    return (
        <div className="results-container animate-fade-in text-center pb-20">
            <header className="mb-8">
                <h2 className="section-title">Gameweek {gwInfo?.id} Strategy Plan 🎯</h2>
                <p className="subtitle">
                    Deadline (UK): {deadlineStr} • {gwInfo?.time_left} left
                </p>
            </header>

            {/* Strategy Toggle */}
            <div className="strategy-toggle">
                <button
                    className={`toggle-btn defend ${strategyMode === 'DEFEND' ? 'active' : ''}`}
                    onClick={() => onModeChange('DEFEND')}
                >
                    🛡️ DEFEND
                </button>
                <button
                    className={`toggle-btn chase ${strategyMode === 'CHASE' ? 'active' : ''}`}
                    onClick={() => onModeChange('CHASE')}
                >
                    🎯 CHASE
                </button>
            </div>
            <p className="strategy-desc">
                {strategyMode === 'DEFEND'
                    ? "Protect your rank: higher ownership, reliable starters, safer captain."
                    : "Chase green arrows: lower ownership, higher upside picks, calculated risk."}
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
                {/* 1. Captain Recommendation */}
                <div className="card glass-panel pick-card delay-100 relative group">
                    <div className="card-badge">Captain</div>
                    <div className="player-image-wrapper">
                        <img src={captain?.image_url} alt={captain?.web_name} className="player-image" />
                    </div>
                    <h3 className="player-name">{captain?.web_name}</h3>
                    <p className="player-team">{captain?.team_short} vs {captain?.opponent_short}</p>

                    <div className="player-stats">
                        <div className="stat">
                            <span className="stat-label">{strategyMode} SCORE</span>
                            <span className={`stat-value ${strategyMode === 'DEFEND' ? 'safety-score-label' : 'swing-score-label'}`}>
                                {strategyMode === 'DEFEND' ? captain?.safetyScore : captain?.swingScore}/100
                            </span>
                        </div>
                        <div className="stat">
                            <span className="stat-label">RISK</span>
                            <span className={`stat-value ${captain?.riskLabel === 'HIGH' ? 'text-red-400' : captain?.riskLabel === 'MEDIUM' ? 'text-amber-200' : 'text-green-400'}`}>
                                {captain?.riskLabel}
                            </span>
                        </div>
                    </div>

                    <div className="why-section">
                        <h4 className="why-title">WHY this captain:</h4>
                        <ul className="why-list">
                            {captain?.why?.map((bullet, i) => (
                                <li key={i} className="why-item">{bullet}</li>
                            ))}
                        </ul>
                    </div>

                    <button
                        onClick={() => handleSaveWatchlist(captain)}
                        className="absolute top-4 right-4 bg-gray-800 text-gray-400 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:text-white"
                        title="Save to Watchlist"
                    >
                        🔖
                    </button>
                </div>

                {/* 2. Best Transfer */}
                <div className="card glass-panel pick-card delay-200 relative group">
                    <div className="card-badge badge-green">Best Move</div>
                    {!transfer ? (
                        <div className="py-10 text-gray-500">No beneficial transfers found for this strategy.</div>
                    ) : (
                        <>
                            <div className="flex items-center justify-around mb-4">
                                <div className="text-center">
                                    <span className="text-[10px] uppercase text-red-400 block mb-1">SELL</span>
                                    <span className="font-bold">{transfer.sell?.web_name}</span>
                                </div>
                                <div className="text-2xl">→</div>
                                <div className="text-center">
                                    <span className="text-[10px] uppercase text-green-400 block mb-1">BUY</span>
                                    <span className="font-bold">{transfer.buy?.web_name}</span>
                                </div>
                            </div>

                            <div className="player-image-wrapper">
                                <img src={transfer.buy?.image_url} alt={transfer.buy?.web_name} className="player-image" />
                            </div>

                            <div className="flex justify-center gap-4 mb-4">
                                <span className="impact-badge">Score Impact: +{transfer.impact}</span>
                                <span className={`text-xs font-bold ${transfer.risk === 'HIGH' ? 'text-red-400' : 'text-green-400'}`}>
                                    Risk: {transfer.risk}
                                </span>
                            </div>

                            <div className="why-section">
                                <h4 className="why-title">WHY this move:</h4>
                                <ul className="why-list">
                                    {transfer.why?.map((bullet, i) => (
                                        <li key={i} className="why-item">{bullet}</li>
                                    ))}
                                </ul>
                            </div>
                        </>
                    )}
                </div>

                {/* 3. Swing Picks */}
                <div className="card glass-panel pick-card delay-300 relative group">
                    <div className="card-badge badge-purple">{strategyMode === 'DEFEND' ? 'Safe Alternatives' : 'Swing Picks'}</div>
                    <div className="mt-4 space-y-4">
                        {swingPicks.map((player, idx) => (
                            <div key={idx} className="flex flex-col border-b border-gray-800/50 pb-4 last:border-0 last:pb-0">
                                <div className="flex items-center gap-3 mb-2">
                                    <img src={player.image_url} alt={player.web_name} className="w-10 h-10 object-contain bg-gray-900/50 rounded-lg" />
                                    <div className="text-left">
                                        <div className="font-bold text-sm">{player.web_name}</div>
                                        <div className="text-[10px] text-gray-500 uppercase">{player.team_short} vs {player.opponent_short} • £{player.display_price}</div>
                                    </div>
                                    <div className="ml-auto text-right">
                                        <div className={`text-xs font-bold ${strategyMode === 'DEFEND' ? 'text-green-400' : 'text-amber-400'}`}>
                                            {strategyMode === 'DEFEND' ? player.safetyScore : player.swingScore}
                                        </div>
                                        <div className="text-[8px] text-gray-600 uppercase">SCORE</div>
                                    </div>
                                </div>
                                <div className="text-left bg-black/20 rounded p-2">
                                    <ul className="why-list">
                                        {player.why.map((b, i) => <li key={i} className="why-item !text-[11px]">{b}</li>)}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Analysis Grid (Secondary Options) */}
            <div className="flex flex-col gap-8 text-left max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr,350px] gap-8">
                    <div className="w-full">
                        <div className="mb-4 flex items-center gap-2">
                            <h3 className="text-xl font-bold">Mini-League Edge</h3>
                            <span className="bg-purple-500/20 text-purple-400 text-[10px] px-2 py-0.5 rounded uppercase font-bold">BETA</span>
                        </div>
                        <MiniLeagueView
                            userTeam={userTeam}
                            bootstrapData={bootstrapData}
                            fplId={fplId}
                            currentGw={currentGw}
                        />
                    </div>
                    <div className="w-full">
                        <h3 className="text-xl font-bold mb-4">Watchlist</h3>
                        <Watchlist bootstrapData={bootstrapData} />
                    </div>
                </div>
            </div>

            <div className="mt-16 border-t border-gray-800 pt-8 flex flex-col items-center gap-4">
                <button
                    onClick={onReset}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors py-2 px-6 rounded-full border border-gray-800 hover:bg-gray-800/50"
                >
                    <span>↺</span> Analyze another team
                </button>
                <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em]">FPL Assistant — Strategy Engine v2.0</p>
            </div>
        </div>
    );
}
