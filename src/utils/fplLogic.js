/**
 * FPL Assistant Logic
 * Implements the "DEFEND vs CHASE" strategy scoring.
 */

export function resolveGameweekInfo(bootstrapData) {
    if (!bootstrapData || !bootstrapData.events) return null;

    // Find the upcoming gameweek
    const nextEvent = bootstrapData.events.find(e => e.is_next) || bootstrapData.events.find(e => e.is_current);
    if (!nextEvent) return null;

    const deadlineUtc = new Date(nextEvent.deadline_time);
    const now = new Date();
    const diffMs = deadlineUtc - now;

    // Formatting for display
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const timeLeft = diffMs > 0 ? `${hours}h ${mins}m` : "Expired";

    return {
        id: nextEvent.id,
        name: nextEvent.name,
        deadline_time: nextEvent.deadline_time,
        time_left: timeLeft,
        is_urgent: hours < 6 && diffMs > 0
    };
}

export function generateStrategyPicks(bootstrapData, fixtures, userTeam, mode = 'DEFEND') {
    const players = bootstrapData.elements;
    const teams = bootstrapData.teams;
    const userPicks = userTeam?.picks || [];
    const userPlayerIds = new Set(userPicks.map(p => p.element));

    // 1. Map Fixture Ease
    const fixtureMap = {};
    fixtures.forEach(f => {
        fixtureMap[f.team_h] = { opponent: f.team_a, difficulty: f.team_h_difficulty, is_home: true };
        fixtureMap[f.team_a] = { opponent: f.team_h, difficulty: f.team_a_difficulty, is_home: false };
    });

    const getFixtureEase = (teamId) => {
        const fix = fixtureMap[teamId];
        if (!fix) return 3; // Default
        // ease = 6 - difficulty (1..5 scale)
        return Math.max(1, Math.min(5, 6 - fix.difficulty));
    };

    // 2. Score All Players
    const scoredPlayers = players.map(p => {
        const ownership = parseFloat(p.selected_by_percent);
        const form = parseFloat(p.form);
        const ppg = parseFloat(p.points_per_game);
        const ease = getFixtureEase(p.team);
        const easeScaled = ease * 2; // scale to 0..10
        const chance = p.chance_of_playing_next_round === null ? (p.status === 'a' ? 100 : 50) : p.chance_of_playing_next_round;

        // Risk Labels
        let riskLabel = 'LOW';
        if (chance < 50) riskLabel = 'HIGH';
        else if (chance < 75) riskLabel = 'MEDIUM';

        // Safety Score (DEFEND)
        // safety = (ownership * 0.45) + (ppg*10 * 0.20) + (form*10 * 0.15) + (ease_scaled * 0.10) + (chance * 0.10)
        let safetyScore = (ownership * 0.45) + (ppg * 10 * 0.20) + (form * 10 * 0.15) + (easeScaled * 0.10) + (chance * 0.10);
        safetyScore = Math.min(100, Math.max(0, safetyScore));

        // Swing Score (CHASE)
        let riskPenalty = 0;
        if (riskLabel === 'MEDIUM') riskPenalty = 8;
        if (riskLabel === 'HIGH') riskPenalty = 18;

        let swingScore = ((100 - ownership) * 0.45) + (ppg * 10 * 0.20) + (form * 10 * 0.15) + (easeScaled * 0.15) - riskPenalty;
        swingScore = Math.min(100, Math.max(0, swingScore));

        const teamObj = teams.find(t => t.id === p.team);
        const oppObj = teams.find(t => t.id === (fixtureMap[p.team]?.opponent));

        return {
            ...p,
            ownership,
            form,
            ppg,
            ease,
            easeScaled,
            chance,
            riskLabel,
            safetyScore: Math.round(safetyScore),
            swingScore: Math.round(swingScore),
            team_name: teamObj?.name || 'Unknown',
            team_short: teamObj?.short_name || 'UNK',
            opponent_short: oppObj?.short_name || 'TBC',
            image_url: `https://resources.premierleague.com/premierleague/photos/players/110x140/p${p.code}.png`,
            display_price: (p.now_cost / 10).toFixed(1)
        };
    });

    // 3. Captain Recommendation
    const attackers = scoredPlayers.filter(p => (p.element_type === 3 || p.element_type === 4) && p.status !== 'i');

    let captain;
    if (mode === 'DEFEND') {
        captain = attackers
            .filter(p => p.chance >= 50)
            .sort((a, b) => b.safetyScore - a.safetyScore)[0];
    } else {
        captain = attackers
            .filter(p => p.chance >= 75 || (p.minutes > 500 && p.chance >= 50))
            .sort((a, b) => b.swingScore - a.swingScore)[0];
    }

    const getWhyCaptain = (p) => {
        if (!p) return [];
        const bullets = [];
        if (mode === 'DEFEND') {
            bullets.push(`${p.ownership}% ownership → Protects rank if he performs.`);
            bullets.push(`Excellent fixture ease (${p.ease}/5) against ${p.opponent_short}.`);
            bullets.push(`High reliability: PPG ${p.ppg} and reliable minutes.`);
        } else {
            bullets.push(`${p.ownership}% ownership → Huge rank jump if he hauls.`);
            bullets.push(`Fixture upside: Ease ${p.ease}/10 against ${p.opponent_short}.`);
            bullets.push(`High upside: Form ${p.form}, perfect for chasing arrows.`);
        }
        return bullets;
    };

    // 4. Best Transfer
    const currentSquad = userPicks.map(pick => scoredPlayers.find(p => p.id === pick.element)).filter(Boolean);
    let transfer = null;

    if (currentSquad.length > 0) {
        let sellCandidates = [];
        if (mode === 'DEFEND') {
            sellCandidates = currentSquad
                .filter(p => p.safetyScore < 40 || p.riskLabel === 'HIGH' || p.ease <= 2)
                .sort((a, b) => a.safetyScore - b.safetyScore);
        } else {
            sellCandidates = currentSquad
                .filter(p => p.swingScore < 30 || p.riskLabel === 'HIGH' || p.form < 2)
                .sort((a, b) => a.swingScore - b.swingScore);
        }

        const sell = sellCandidates[0] || currentSquad.sort((a, b) => (mode === 'DEFEND' ? a.safetyScore - b.safetyScore : a.swingScore - b.swingScore))[0];

        if (sell) {
            const buyCandidates = scoredPlayers
                .filter(p => p.element_type === sell.element_type && !userPlayerIds.has(p.id) && p.status === 'a')
                .filter(p => p.now_cost <= sell.now_cost + 10) // Assume 1.0 ITB buffer for MVP
                .sort((a, b) => (mode === 'DEFEND' ? b.safetyScore - a.safetyScore : b.swingScore - a.swingScore));

            const buy = buyCandidates[0];
            if (buy) {
                const delta = mode === 'DEFEND' ? (buy.safetyScore - sell.safetyScore) : (buy.swingScore - sell.swingScore);
                transfer = {
                    sell,
                    buy,
                    impact: delta,
                    risk: buy.riskLabel,
                    why: [
                        mode === 'DEFEND' ? `Selling ${sell.web_name} due to low safety/poor fixtures.` : `Selling ${sell.web_name} to find higher upside.`,
                        `Buying ${buy.web_name} improves ${mode} score by ${delta} points.`,
                        buy.chance < 75 ? `Warning: ${buy.web_name} has moderate rotation risk.` : `${buy.web_name} is a nailed-on starter.`
                    ]
                };
            }
        }
    }

    // 5. Swing Picks (Top 3)
    let swingPicks = [];
    if (mode === 'DEFEND') {
        swingPicks = scoredPlayers
            .filter(p => !userPlayerIds.has(p.id) && p.status === 'a')
            .sort((a, b) => b.safetyScore - a.safetyScore)
            .slice(0, 3);
    } else {
        swingPicks = scoredPlayers
            .filter(p => !userPlayerIds.has(p.id) && p.chance >= 50)
            .sort((a, b) => b.swingScore - a.swingScore)
            .slice(0, 3);
    }

    const enhancedSwingPicks = swingPicks.map(p => ({
        ...p,
        why: [
            mode === 'DEFEND' ? `${p.ownership}% choice for stability.` : `Low ${p.ownership}% ownership makes him a massive differential.`,
            `Fixture Ease ${p.ease}/5 with strong recent Form (${p.form}).`
        ]
    }));

    return {
        mode,
        gwInfo: resolveGameweekInfo(bootstrapData),
        captain: { ...captain, why: getWhyCaptain(captain) },
        transfer,
        swingPicks: enhancedSwingPicks
    };
}
