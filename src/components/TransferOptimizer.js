"use client";
import { useMemo } from 'react';
import { getTransferSuggestions } from '@/utils/fplLogic';

export default function TransferOptimizer({ userTeam, bootstrapData }) {

    const suggestions = useMemo(() => {
        if (!userTeam || !bootstrapData) return null;
        return getTransferSuggestions(userTeam, bootstrapData);
    }, [userTeam, bootstrapData]);

    if (!suggestions) return null;
    const { out: playerOut, in: playerIn } = suggestions;

    if (!playerOut || !playerIn) {
        return (
            <div className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm border border-gray-700/50">
                <h3 className="text-xl font-bold mb-4 text-white">🔄 Transfer Optimizer</h3>
                <p className="text-gray-400">Your team looks solid! No urgent transfers detected based on form.</p>
            </div>
        );
    }

    const projectedGain = (parseFloat(playerIn.form) - parseFloat(playerOut.form)).toFixed(1);

    return (
        <div className="bg-gray-800/50 rounded-2xl p-6 backdrop-blur-md border border-gray-700/40 shadow-xl overflow-hidden relative">
            {/* Background Accent */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-600/10 blur-3xl rounded-full"></div>

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="p-2 bg-purple-500/20 rounded-lg text-purple-400">🔄</span>
                        Smart Swap Suggestion
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">AI-optimized based on current form and impact</p>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-purple-400 tracking-tighter uppercase mb-1">Impact</span>
                    <span className={`text-xl font-black ${projectedGain > 0 ? 'text-green-400' : 'text-gray-400'}`}>
                        {projectedGain > 0 ? `+${projectedGain}` : projectedGain}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] items-center gap-6">
                {/* Out Card */}
                <div className="group relative">
                    <div className="absolute inset-0 bg-red-500/5 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative bg-gray-900/60 border border-red-500/20 rounded-xl p-4 transition-all hover:border-red-500/40">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="w-14 h-14 rounded-xl bg-gray-800 overflow-hidden border border-gray-700">
                                    <img src={playerOut.image_url} alt={playerOut.web_name} className="w-full h-full object-cover scale-110" />
                                </div>
                                <span className="absolute -top-2 -left-2 bg-red-500 text-[10px] font-black px-1.5 py-0.5 rounded shadow-lg uppercase">Sell</span>
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-bold text-white truncate">{playerOut.web_name}</h4>
                                <p className="text-xs text-gray-500">{playerOut.team_name}</p>
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="text-[10px] text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded">Form: {playerOut.form}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Arrow */}
                <div className="flex md:flex-col items-center justify-center gap-2">
                    <div className="h-px md:w-px md:h-8 bg-gradient-to-r md:bg-gradient-to-b from-transparent via-gray-600 to-transparent flex-1 w-8"></div>
                    <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 text-sm shadow-inner">
                        ➔
                    </div>
                    <div className="h-px md:w-px md:h-8 bg-gradient-to-r md:bg-gradient-to-b from-transparent via-gray-600 to-transparent flex-1 w-8"></div>
                </div>

                {/* In Card */}
                <div className="group relative">
                    <div className="absolute inset-0 bg-green-500/5 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative bg-gray-900/60 border border-green-500/20 rounded-xl p-4 transition-all hover:border-green-500/40">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="w-14 h-14 rounded-xl bg-gray-700 overflow-hidden border border-gray-700">
                                    <img src={playerIn.image_url} alt={playerIn.web_name} className="w-full h-full object-cover scale-110" />
                                </div>
                                <span className="absolute -top-2 -left-2 bg-green-500 text-[10px] font-black px-1.5 py-0.5 rounded shadow-lg uppercase">Buy</span>
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-bold text-white truncate">{playerIn.web_name}</h4>
                                <p className="text-xs text-gray-500">{playerIn.team_name}</p>
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="text-[10px] text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20">Form: {playerIn.form}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6 flex justify-between items-center text-[10px] text-gray-500 uppercase tracking-widest border-t border-gray-700/30 pt-4">
                <span>Optimized Path</span>
                <span className="text-gray-600">Swap Rank: #1</span>
            </div>
        </div>
    );
}
