"use client";
import { useState } from 'react';

export default function WelcomeScreen({ onStart, isLoading }) {
    const [fplId, setFplId] = useState('');
    const [email, setEmail] = useState('');
    const [remindersEnabled, setRemindersEnabled] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (fplId && !isLoading) {
            onStart(fplId);
        }
    };

    return (
        <div className="welcome-container animate-fade-in">
            <div className="glass-panel welcome-card">
                <h1 className="welcome-title">
                    <span className="title-gradient">FPL Assistant</span>
                </h1>
                <p className="welcome-desc">
                    AI-powered transfer suggestions to boost your gameweek rank.
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <input
                            type="number"
                            value={fplId}
                            onChange={(e) => setFplId(e.target.value)}
                            placeholder="Enter your Team ID (e.g., 123456)"
                            className="input-field"
                            required
                        />
                        <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                            Not sure? <a href="https://fpl.team/find-fpl-team-id" target="_blank" style={{ textDecoration: 'underline', color: 'inherit' }}>Find your FPL ID here</a>
                        </div>
                    </div>

                    <div className="form-group" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={remindersEnabled}
                                onChange={(e) => setRemindersEnabled(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                                Enable Email Reminders 🔔
                            </span>
                        </label>

                        {remindersEnabled && (
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                className="input-field mt-3 animate-slide-down"
                                required={remindersEnabled}
                            />
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary"
                        style={{ width: '100%' }}
                    >
                        {isLoading ? (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span className="loading-spinner"></span>
                                Analyzing...
                            </span>
                        ) : (
                            'Get My Picks 🚀'
                        )}
                    </button>
                </form>

                <div className="footer-link">
                    From the <a href="https://fantasy.premierleague.com/" target="_blank">Official FPL Site</a>
                </div>
            </div>
        </div>
    );
}
