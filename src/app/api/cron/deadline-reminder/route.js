import { NextResponse } from 'next/server';
import { resolveGameweekInfo, generateStrategyPicks } from '@/utils/fplLogic';

// Mock database for users who enabled reminders
const MOCK_USERS = [
    { email: 'user@example.com', fplId: '12345', enabled: true, strategy: 'DEFEND' }
];

export async function GET(request) {
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const bootstrapRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/fpl/bootstrap`);
        const bootstrapData = await bootstrapRes.json();

        const gwInfo = resolveGameweekInfo(bootstrapData);
        if (!gwInfo) return NextResponse.json({ message: 'No GW info found' });

        // Check if deadline is in 3 hours
        const deadline = new Date(gwInfo.deadline_time);
        const now = new Date();
        const diffHours = (deadline - now) / (1000 * 60 * 60);

        if (diffHours > 2.5 && diffHours < 3.5) {
            const fixturesRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/fpl/fixtures?gw=${gwInfo.id}`);
            const fixtures = await fixturesRes.json();

            for (const user of MOCK_USERS) {
                if (user.enabled) {
                    await sendDeadlineEmail(user, gwInfo, bootstrapData, fixtures);
                }
            }
            return NextResponse.json({ message: 'Reminders sent' });
        }

        return NextResponse.json({ message: 'No reminder needed', hours_left: diffHours });
    } catch (error) {
        console.error('Cron Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function sendDeadlineEmail(user, gwInfo, bootstrapData, fixtures) {
    try {
        const userRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/fpl/picks/${user.fplId}?gw=${gwInfo.id}`);
        const userTeam = await userRes.json();

        const strategyMode = user.strategy || 'DEFEND';
        const picksResult = generateStrategyPicks(bootstrapData, fixtures, userTeam, strategyMode);

        const subject = `⚽ GW ${gwInfo.id} deadline soon — ${strategyMode} plan ready`;
        const body = `Your ${strategyMode} picks are ready. 
Captain: ${picksResult.captain?.web_name}
Transfer: ${picksResult.transfer ? `${picksResult.transfer.sell.web_name} -> ${picksResult.transfer.buy.web_name}` : 'No transfer suggested'}
Top Swing Pick: ${picksResult.swingPicks[0]?.web_name}

Check the full plan at: ${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}`;

        console.log(`Sending Email to ${user.email}...`);
        console.log(`Subject: ${subject}`);
        console.log(`Body: ${body}`);

        return true;
    } catch (error) {
        console.error(`Failed to send email to ${user.email}:`, error);
    }
}

