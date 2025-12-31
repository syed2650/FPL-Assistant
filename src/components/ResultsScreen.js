"use client";
import MiniLeagueView from '@/components/MiniLeagueView';
import TransferOptimizer from '@/components/TransferOptimizer';
import Watchlist from '@/components/Watchlist';
import { useState } from 'react';
import { resolveGameweekInfo } from '@/utils/fplLogic';

export default function ResultsScreen({ picks, userTeam, bootstrapData, onReset }) {
    // picks = { captain, value, differential }
    const fplId = userTeam?.entry?.id;
    const currentGw = userTeam?.entry_history?.event; // Current GW of the picks

    const gwInfo = resolveGameweekInfo(bootstrapData);
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
            window.dispatchEvent(new Event('storage')); // Trigger update for listeners on same page
        } else {
            alert(`${player.web_name} is already in your watchlist.`);
        }
    };

    return (
        <div className="results-container animate-fade-in text-center pb-20">
            <h2 className="section-title">Gameweek {gwInfo?.id} Picks 🎯</h2>
            <p className="subtitle">
                Deadline: {deadlineStr} ({gwInfo?.hours_remaining} hours left)
            </p>

            {/* Quick Actions / Deadline */}
            {gwInfo && (
                <div className={`border rounded-lg p-3 mb-8 inline-block ${gwInfo.is_urgent ? 'bg-orange-500/20 border-orange-500/50 animate-pulse' : 'bg-green-500/10 border-green-500/30'}`}>
                    <p className={`text-sm font-bold flex items-center gap-2 ${gwInfo.is_urgent ? 'text-orange-300' : 'text-green-300'}`}>
                        {gwInfo.is_urgent ? '⚠️' : '⏰'} {gwInfo.is_urgent ? 'Urgent: Deadline Approaches!' : 'Upcoming Deadline'}
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
                {/* Captain Pick */}
                <div className="card glass-panel pick-card captain-card delay-100 relative group">
                    <div className="card-badge">Captain</div>
                    <div className="player-image-wrapper">
                        <img src={picks.captain?.image_url} alt={picks.captain?.web_name} className="player-image" />
                    </div>
                    <h3 className="player-name">{picks.captain?.web_name}</h3>
                    <p className="player-team">{picks.captain?.team_name}</p>
                    <div className="player-stats">
                        <div className="stat">
                            <span className="stat-label">EXP. PTS</span>
                            <span className="stat-value highlight">{picks.captain?.ep_next}</span>
                        </div>
                        <div className="stat">
                            <span className="stat-label">FORM</span>
                            <span className="stat-value">{picks.captain?.form}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => handleSaveWatchlist(picks.captain)}
                        className="absolute top-4 right-4 bg-gray-800 text-gray-400 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:text-white"
                        title="Save to Watchlist"
                    >
                        🔖
                    </button>
                </div>

                {/* Value Pick */}
                <div className="card glass-panel pick-card value-card delay-200 relative group">
                    <div className="card-badge badge-green">Value</div>
                    <div className="player-image-wrapper">
                        <img src={picks.value?.image_url} alt={picks.value?.web_name} className="player-image" />
                    </div>
                    <h3 className="player-name">{picks.value?.web_name}</h3>
                    <p className="player-team">{picks.value?.team_name}</p>
                    <div className="player-stats">
                        <div className="stat">
                            <span className="stat-label">PRICE</span>
                            <span className="stat-value highlight">£{picks.value?.display_price}</span>
                        </div>
                        <div className="stat">
                            <span className="stat-label">FORM</span>
                            <span className="stat-value">{picks.value?.form}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => handleSaveWatchlist(picks.value)}
                        className="absolute top-4 right-4 bg-gray-800 text-gray-400 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:text-white"
                        title="Save to Watchlist"
                    >
                        🔖
                    </button>
                </div>

                {/* Differential Pick */}
                <div className="card glass-panel pick-card diff-card delay-300 relative group">
                    <div className="card-badge badge-purple">Differential</div>
                    <div className="player-image-wrapper">
                        <img src={picks.differential?.image_url} alt={picks.differential?.web_name} className="player-image" />
                    </div>
                    <h3 className="player-name">{picks.differential?.web_name}</h3>
                    <p className="player-team">{picks.differential?.team_name}</p>
                    <div className="player-stats">
                        <div className="stat">
                            <span className="stat-label">OWNED</span>
                            <span className="stat-value highlight">{picks.differential?.selected_by_percent}%</span>
                        </div>
                        <div className="stat">
                            <span className="stat-label">FORM</span>
                            <span className="stat-value">{picks.differential?.form}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => handleSaveWatchlist(picks.differential)}
                        className="absolute top-4 right-4 bg-gray-800 text-gray-400 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:text-white"
                        title="Save to Watchlist"
                    >
                        🔖
                    </button>
                </div>
            </div>

            {/* Analysis Grid */}
            <div className="flex flex-col gap-8 text-left max-w-6xl mx-auto">
                <div className="w-full">
                    <TransferOptimizer userTeam={userTeam} bootstrapData={bootstrapData} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr,350px] gap-8">
                    <div className="w-full">
                        <MiniLeagueView
                            userTeam={userTeam}
                            bootstrapData={bootstrapData}
                            fplId={fplId}
                            currentGw={currentGw}
                        />
                    </div>
                    <div className="w-full">
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
                <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em]">FPL Picks Assistant v1.0.4</p>
            </div>
        </div>
    );
}
