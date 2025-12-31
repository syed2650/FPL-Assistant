import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
    const { id } = await params;

    if (!id) {
        return NextResponse.json({ error: 'Missing User ID' }, { status: 400 });
    }

    try {
        const res = await fetch(`https://fantasy.premierleague.com/api/entry/${id}/`, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
            },
            next: { revalidate: 3600 }
        });

        if (!res.ok) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
