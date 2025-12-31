"use client";
import { useState, useEffect } from 'react';

export default function Watchlist({ bootstrapData }) {
    const [savedIds, setSavedIds] = useState([]);
    const [players, setPlayers] = useState([]);

    useEffect(() => {
        // Load from local storage
        const saved = JSON.parse(localStorage.getItem('fpl_watchlist') || '[]');
        setSavedIds(saved);
    }, []);

    useEffect(() => {
        if (bootstrapData && savedIds.length > 0) {
            const loaded = savedIds.map(id => {
                const p = bootstrapData.elements.find(el => el.id === id);
                if (!p) return null;
                // Enhance locally if needed, similar to logic helper but simple here
                const team = bootstrapData.teams.find(t => t.id === p.team);
                return {
                    ...p,
                    team_name: team ? team.short_name : 'UNK',
                    image_url: `https://resources.premierleague.com/premierleague/photos/players/110x140/p${p.code}.png`
                };
            }).filter(Boolean);
            setPlayers(loaded);
        } else {
            setPlayers([]);
        }
    }, [savedIds, bootstrapData]);

    const removePlayer = (id) => {
        const newIds = savedIds.filter(pid => pid !== id);
        setSavedIds(newIds);
        localStorage.setItem('fpl_watchlist', JSON.stringify(newIds));
    };

    if (savedIds.length === 0) {
        return (
            <div className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm border border-gray-700/50 min-h-[150px] flex flex-col justify-center items-center text-center">
                <h3 className="text-xl font-bold mb-2 text-white">👀 Watchlist</h3>
                <p className="text-gray-400 text-sm">Add differentals to track their performance.</p>
                <p className="text-xs text-gray-500 mt-2">(Click "Save" on player cards)</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm border border-gray-700/50">
            <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                👀 Differential Watchlist
            </h3>

            <div className="space-y-4">
                {players.map(p => (
                    <div key={p.id} className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/0 to-purple-500/0 group-hover:from-purple-500/20 group-hover:to-blue-500/20 rounded-2xl blur opacity-100 transition duration-500"></div>
                        <div className="relative flex items-center gap-4 bg-gray-900/80 backdrop-blur-md p-4 rounded-xl border border-gray-800 group-hover:border-gray-700 transition-all">
                            <div className="w-12 h-12 rounded-xl bg-gray-800 overflow-hidden border border-gray-700 shadow-lg">
                                <img src={p.image_url} alt={p.web_name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-bold text-white text-sm truncate">{p.web_name}</h4>
                                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${parseFloat(p.form) > 5 ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                                        {p.form} FORM
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{p.team_name}</p>
                                    <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
                                    <p className="text-[10px] text-purple-400 font-bold">£{(p.now_cost / 10).toFixed(1)}m</p>
                                </div>
                            </div>
                            <button
                                onClick={() => removePlayer(p.id)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-800 text-gray-500 hover:bg-red-500/20 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                                title="Remove"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
