import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
    const { leagueId } = params;

    if (!leagueId) {
        return NextResponse.json({ error: 'League ID is required' }, { status: 400 });
    }

    try {
        const res = await fetch(`https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36',
            },
            next: { revalidate: 300 } // Cache for 5 minutes
        });

        if (!res.ok) {
            console.error(`FPL API Error for league ${leagueId}: ${res.status} ${res.statusText}`);
            throw new Error(`Failed to fetch League data: ${res.status}`);
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('League Fetch API Route Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
