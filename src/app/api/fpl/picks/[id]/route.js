import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
    const { id } = await params; // Await params in newer Next.js versions
    const searchParams = request.nextUrl.searchParams;
    const gw = searchParams.get('gw');

    if (!id || !gw) {
        return NextResponse.json({ error: `Missing ID (${id}) or GW (${gw})` }, { status: 400 });
    }

    try {
        const res = await fetch(`https://fantasy.premierleague.com/api/entry/${id}/event/${gw}/picks/`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36',
            },
            next: { revalidate: 0 } // No cache for user specific data
        });

        if (!res.ok) {
            // If 404, might mean invalid ID or no picks for that GW
            if (res.status === 404) {
                return NextResponse.json({ error: 'Team not found or no picks for this Gameweek' }, { status: 404 });
            }
            throw new Error('Failed to fetch FPL picks');
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
