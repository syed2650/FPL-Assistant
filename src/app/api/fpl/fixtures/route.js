import { NextResponse } from 'next/server';

export async function GET(request) {
    const searchParams = request.nextUrl.searchParams;
    const gw = searchParams.get('gw');

    if (!gw) {
        return NextResponse.json({ error: 'Missing Gameweek (gw)' }, { status: 400 });
    }

    try {
        const res = await fetch(`https://fantasy.premierleague.com/api/fixtures/?event=${gw}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
            },
            next: { revalidate: 3600 }
        });

        if (!res.ok) {
            throw new Error('Failed to fetch FPL fixtures');
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
