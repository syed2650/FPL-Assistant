export function generatePicks(bootstrapData, userTeam) {
    // bootstrapData contains { elements, teams, ... }
    // userTeam contains { picks: [...] }

    const players = bootstrapData.elements;
    const teams = bootstrapData.teams;

    // Extract user's current player IDs to exclude them from transfer suggestions
    const userPlayerIds = new Set(userTeam?.picks?.map(p => p.element) || []);

    // Helper to get opponent (simplification: just use 'strength' from team)
    // Real FPL logic needs fixtures endpoint. For MVP we use 'form' and 'ep_next' (Expected Points)

    // 1. Captain Pick: Highest projected points (ep_next)
    // Filter for available players (status 'a') and NOT in user's team
    const availablePlayers = players.filter(p => p.status === 'a' && !userPlayerIds.has(p.id));

    const sortedByEp = [...availablePlayers].sort((a, b) => parseFloat(b.ep_next) - parseFloat(a.ep_next));
    const captainPick = sortedByEp[0];

    // 2. Value Pick: High form/points per price, price < 6.5
    // cost is in integer units (e.g. 100 = 10.0)
    const valuePlayers = availablePlayers.filter(p => p.now_cost < 65 && parseFloat(p.form) > 3.0);
    const sortedByValue = [...valuePlayers].sort((a, b) => {
        // Value metric: form / price
        return (parseFloat(b.form) / b.now_cost) - (parseFloat(a.form) / a.now_cost);
    });
    const valuePick = sortedByValue[0] || sortedByEp.find(p => p.now_cost < 65); // Fallback

    // 3. Differential Pick: Ownership < 10% and high form
    const diffPlayers = availablePlayers.filter(p => parseFloat(p.selected_by_percent) < 10.0 && parseFloat(p.form) > 3.0);
    const sortedByDiff = [...diffPlayers].sort((a, b) => parseFloat(b.ep_next) - parseFloat(a.ep_next));
    const differentialPick = sortedByDiff[0] || sortedByEp.find(p => parseFloat(p.selected_by_percent) < 10.0); // Fallback

    // Enroll team names and image URLs
    const enhancePlayer = (p) => {
        if (!p) return null;
        const team = teams.find(t => t.id === p.team);
        return {
            ...p,
            team_name: team ? team.name : 'Unknown', // e.g. "Arsenal"
            team_short: team ? team.short_name : 'UNK',
            image_url: `https://resources.premierleague.com/premierleague/photos/players/110x140/p${p.code}.png`,
            display_price: (p.now_cost / 10).toFixed(1)
        };
    };

    return {
        captain: enhancePlayer(captainPick),
        value: enhancePlayer(valuePick),
        differential: enhancePlayer(differentialPick),
        enhancePlayer // Export helper for other functions if needed contextually, though pure functions below is better
    };
}

// Separate helper for dependency injection of teams if needed, or we just pass full bootstrap data
export function enhancePlayer(p, teams) {
    if (!p) return null;
    const team = teams.find(t => t.id === p.team);
    return {
        ...p,
        team_name: team ? team.name : 'Unknown',
        team_short: team ? team.short_name : 'UNK',
        image_url: `https://resources.premierleague.com/premierleague/photos/players/110x140/p${p.code}.png`,
        display_price: (p.now_cost / 10).toFixed(1)
    };
}

export function analyzeMiniLeague(userTeam, rivalTeams, bootstrapData) {
    const userPlayerIds = new Set(userTeam.picks.map(p => p.element));
    const players = bootstrapData.elements;
    const teams = bootstrapData.teams;

    // 1. Identify Differentials (User owns, Rivals don't)
    // Rival picks is array of { picks: [] }
    const rivalPlayerCounts = {};
    rivalTeams.forEach(rival => {
        rival.picks.forEach(p => {
            rivalPlayerCounts[p.element] = (rivalPlayerCounts[p.element] || 0) + 1;
        });
    });

    const differentials = [];
    userTeam.picks.forEach(pick => {
        if (!rivalPlayerCounts[pick.element]) {
            const player = players.find(p => p.id === pick.element);
            if (player) differentials.push(enhancePlayer(player, teams));
        }
    });

    // 2. Block Suggestions (Players all rivals own, User doesn't)
    // "Block" strategies usually mean matching their captain or high-owned player
    const numRivals = rivalTeams.length;
    const blocks = [];

    Object.entries(rivalPlayerCounts).forEach(([playerId, count]) => {
        if (count === numRivals && !userPlayerIds.has(parseInt(playerId))) {
            const player = players.find(p => p.id === parseInt(playerId));
            if (player) blocks.push(enhancePlayer(player, teams));
        }
    });

    // 3. Captaincy Risk
    const rivalCaptains = rivalTeams.map(rival => {
        const captainPick = rival.picks.find(p => p.is_captain);
        return captainPick ? captainPick.element : null;
    }).filter(Boolean);

    const userCaptain = userTeam.picks.find(p => p.is_captain)?.element;

    const captainCounts = {};
    rivalCaptains.forEach(id => captainCounts[id] = (captainCounts[id] || 0) + 1);

    const topRivalCaptainId = Object.entries(captainCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topRivalCaptain = topRivalCaptainId ? players.find(p => p.id === parseInt(topRivalCaptainId)) : null;

    return {
        differentials,
        blocks,
        captainRisk: {
            topRivalCaptain: topRivalCaptain ? enhancePlayer(topRivalCaptain, teams) : null,
            isDifferent: topRivalCaptainId && parseInt(topRivalCaptainId) !== userCaptain,
            rivalCount: captainCounts[topRivalCaptainId] || 0
        }
    };
}

export function getTransferSuggestions(userTeam, bootstrapData) {
    const players = bootstrapData.elements;
    const teams = bootstrapData.teams;
    const userPlayerIds = new Set(userTeam.picks.map(p => p.element));

    // 1. Suggest OUT: Low form (< 3.0) and Bad Fixtures (using next_round for now, or just generic form)
    // In real app we check difficulty. Here we just check form.
    const currentSquad = userTeam.picks.map(pick => players.find(p => p.id === pick.element)).filter(Boolean);

    // Sort by lowest form
    const potentialOuts = currentSquad
        .filter(p => parseFloat(p.form) < 3.0)
        .sort((a, b) => parseFloat(a.form) - parseFloat(b.form));

    const suggestedOut = potentialOuts[0] || currentSquad[0]; // Fallback to someone

    // 2. Suggest IN: High form (> 6.0) or high EP, affordable
    // Budget logic: Assume money in bank = userTeam.transfers.bank (if available) + out_player.now_cost
    // userTeam from picks API endpoint has entry_history which might have bank, but for now let's assume strict swap or just best player

    // Filter available players not in team
    const availablePlayers = players.filter(p => !userPlayerIds.has(p.id) && p.status === 'a');

    // Simple heuristic: Best form player
    const suggestedIn = availablePlayers
        .filter(p => parseFloat(p.form) > 5.0)
        .sort((a, b) => parseFloat(b.form) - parseFloat(a.form))[0]
        || availablePlayers.sort((a, b) => parseFloat(b.ep_next) - parseFloat(a.ep_next))[0];

    return {
        out: enhancePlayer(suggestedOut, teams),
        in: enhancePlayer(suggestedIn, teams)
    };
}

export function resolveGameweekInfo(bootstrapData) {
    if (!bootstrapData || !bootstrapData.events) return null;

    const currentEvent = bootstrapData.events.find(e => e.is_current);
    if (!currentEvent) {
        // If none is current, maybe we are between GWs, find the next one
        const nextEvent = bootstrapData.events.find(e => e.is_next);
        if (!nextEvent) return null;

        const deadline = new Date(nextEvent.deadline_time);
        const now = new Date();
        const diffMs = deadline - now;
        const hoursRemaining = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));

        return {
            id: nextEvent.id,
            name: nextEvent.name,
            deadline_time: nextEvent.deadline_time,
            hours_remaining: hoursRemaining,
            is_urgent: hoursRemaining < 6
        };
    }

    // Current event is active, but we want the NEXT deadline for "Picks" if the current one has passed?
    // Actually FPL "Current" usually means the one that is currently being played correctly.
    // The "is_current" event's deadline has already passed.
    // Users are usually looking for the NEXT gameweek picks.
    const nextEvent = bootstrapData.events.find(e => e.id === currentEvent.id + 1) || currentEvent;

    const deadline = new Date(nextEvent.deadline_time);
    const now = new Date();
    const diffMs = deadline - now;
    const hoursRemaining = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));

    return {
        id: nextEvent.id,
        name: nextEvent.name,
        deadline_time: nextEvent.deadline_time,
        hours_remaining: hoursRemaining,
        is_urgent: hoursRemaining < 6
    };
}
