"use client";
import { useState, useEffect } from 'react';
import { analyzeMiniLeague } from '@/utils/fplLogic';

export default function MiniLeagueView({ userTeam, bootstrapData, fplId, currentGw }) {
    const [leagueId, setLeagueId] = useState('');
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [rivals, setRivals] = useState([]);
    const [error, setError] = useState(null);
    const [userLeagues, setUserLeagues] = useState([]);
    const [fetchingLeagues, setFetchingLeagues] = useState(true);

    useEffect(() => {
        const fetchLeagues = async () => {
            try {
                const res = await fetch(`/api/fpl/user/${fplId}`);
                if (!res.ok) throw new Error('Could not fetch your leagues.');
                const data = await res.json();

                // Filter Classic leagues
                const classicLeagues = data.leagues?.classic || [];
                const processed = classicLeagues.map(l => ({
                    ...l,
                    is_public: l.league_type === 's' // 's' is site (public), 'x' is private/invite
                }));

                setUserLeagues(processed);
            } catch (err) {
                console.error(err);
            } finally {
                setFetchingLeagues(false);
            }
        };
        if (fplId) fetchLeagues();
    }, [fplId]);

    const handleCompareLeague = async (id) => {
        setLeagueId(id);
        setLoading(true);
        setAnalysis(null);
        setError(null);
        try {
            // 1. Fetch League Standings
            const leagueRes = await fetch(`/api/fpl/leagues/${id}`);
            if (!leagueRes.ok) {
                const err = await leagueRes.json().catch(() => ({}));
                throw new Error(err.error || 'Could not join league.');
            }
            const leagueData = await leagueRes.json();

            if (!leagueData.standings || !leagueData.standings.results) {
                throw new Error('Invalid league data received.');
            }

            // 2. Get Top 3 Rivals (excluding us)
            const standings = leagueData.standings.results;
            const myEntryId = parseInt(fplId);
            const topRivals = standings.filter(r => r.entry !== myEntryId).slice(0, 3);

            if (topRivals.length === 0) {
                throw new Error('No rivals found in this league to compare against.');
            }

            // 3. Fetch Rivals' Picks
            const rivalPicksPromises = topRivals.map(r =>
                fetch(`/api/fpl/picks/${r.entry}?gw=${currentGw}`).then(res => res.json())
            );
            const rivalTeamsData = await Promise.all(rivalPicksPromises);

            // 4. Analyze
            const result = analyzeMiniLeague(userTeam, rivalTeamsData, bootstrapData);
            setAnalysis(result);
            setRivals(topRivals);

        } catch (error) {
            console.error(error);
            setError(error.message || 'Failed to analyze league.');
        } finally {
            setLoading(false);
        }
    };

    const publicLeagues = userLeagues.filter(l => l.is_public);
    const privateLeagues = userLeagues.filter(l => !l.is_public);

    return (
        <div className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm border border-gray-700/50">
            <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                🏆 Mini-League Edge
            </h3>

            {fetchingLeagues ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                    <p className="text-gray-400 text-xs animate-pulse">Syncing with FPL leagues...</p>
                </div>
            ) : (
                <div className="space-y-4 mb-6">
                    {publicLeagues.length > 0 ? (
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-3">Your Public Leagues</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {publicLeagues.map(l => (
                                    <button
                                        key={l.id}
                                        onClick={() => handleCompareLeague(l.id)}
                                        disabled={loading}
                                        className={`group text-left p-3 rounded-xl border transition-all ${leagueId == l.id ? 'bg-purple-600/20 border-purple-500 shadow-[0_0_20px_rgba(139,92,246,0.1)]' : 'bg-gray-900/40 border-gray-800 hover:border-gray-600'}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <p className="text-sm font-bold text-white truncate max-w-[150px]">{l.name}</p>
                                            <span className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">Rank: {l.entry_rank}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-amber-500/5 border border-amber-500/20 p-5 rounded-2xl">
                            <div className="flex items-start gap-3">
                                <span className="text-xl">🔒</span>
                                <div>
                                    <p className="text-amber-200 text-sm font-bold mb-1">Mini-Leagues are Private</p>
                                    <p className="text-amber-200/60 text-xs leading-relaxed">
                                        FPL restrictions prevent third-party apps from accessing private league standings via public API.
                                    </p>
                                    <a href="https://fantasy.premierleague.com/leagues/create" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-4 text-[10px] bg-amber-500 hover:bg-amber-600 text-black px-4 py-2 rounded-lg font-black uppercase tracking-tighter transition-all">
                                        Join/Create Public League ➔
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}

                    {privateLeagues.length > 0 && (
                        <div className="flex items-center gap-2 px-1">
                            <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                            <p className="text-[10px] text-gray-500 italic">
                                {privateLeagues.length} private leagues hidden due to FPL API constraints
                            </p>
                        </div>
                    )}
                </div>
            )}

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-200 p-3 rounded-lg mb-4 text-sm font-medium flex items-center gap-2 animate-fade-in">
                    ⚠️ {error}
                </div>
            )}

            {analysis && (
                <div className="space-y-6 animate-fade-in border-t border-gray-700 pt-6">

                    {/* Rival Summary */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        {rivals.map(r => (
                            <div key={r.entry} className="bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                <span className="text-xs font-bold text-white">{r.player_name}</span>
                            </div>
                        ))}
                    </div>

                    {/* Captaincy Risk */}
                    {analysis.captainRisk?.isDifferent && analysis.captainRisk.topRivalCaptain && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 animate-pulse">
                            <div className="flex justify-between items-start mb-3">
                                <h4 className="text-xs font-black text-red-400 uppercase tracking-widest">⚠️ Captaincy Warning</h4>
                                <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded">High Risk</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-gray-900 overflow-hidden border border-red-500/20">
                                    <img src={analysis.captainRisk.topRivalCaptain.image_url} alt="Captain" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-300 leading-tight">
                                        <span className="text-white font-bold">{analysis.captainRisk.rivalCount} rivals</span> have captained <span className="text-red-400 font-bold">{analysis.captainRisk.topRivalCaptain.web_name}</span>.
                                    </p>
                                    <p className="text-[10px] text-gray-500 mt-1">You have a different captain. This could cause a rank swing.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Differentials */}
                    <div>
                        <h4 className="text-sm font-semibold text-green-400 uppercase tracking-wider mb-3">
                            🟢 Your Differential Edge
                        </h4>
                        {analysis.differentials.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3">
                                {analysis.differentials.slice(0, 3).map(player => (
                                    <div key={player.id} className="flex items-center gap-3 bg-gray-900/50 p-3 rounded-lg border border-gray-700/30">
                                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800">
                                            <img src={player.image_url} alt={player.web_name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-white">{player.web_name}</p>
                                            <p className="text-xs text-gray-400">You own {player.web_name} — none of your top rivals do.</p>
                                        </div>
                                        <div className="text-green-400 text-xs font-medium">
                                            UNIQUE
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 text-sm italic">No unique differentials found in your starting XI vs these rivals.</p>
                        )}
                    </div>

                    {/* Blocks */}
                    <div>
                        <h4 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-3">
                            🛡️ Block Alert
                        </h4>
                        {analysis.blocks.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3">
                                {analysis.blocks.slice(0, 2).map(player => (
                                    <div key={player.id} className="flex items-center gap-3 bg-gray-900/50 p-3 rounded-lg border border-gray-700/30">
                                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800">
                                            <img src={player.image_url} alt={player.web_name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-white">{player.web_name}</p>
                                            <p className="text-xs text-gray-400">All {rivals.length} rivals own {player.web_name}. Consider blocking with captaincy.</p>
                                        </div>
                                        <div className="text-red-400 text-xs font-medium">
                                            DANGER
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 text-sm italic">You match your rivals on key players. Good defensive setup!</p>
                        )}
                    </div>

                    <div className="text-[10px] text-gray-600 uppercase text-center tracking-widest pt-4">
                        Data from your public mini-league
                    </div>
                </div>
            )}
        </div>
    );
}
