import { NextResponse } from 'next/server';
import { resolveGameweekInfo, generatePicks } from '@/utils/fplLogic';

// Mock database for users who enabled reminders
// In a real app, this would be a database call
const MOCK_USERS = [
    { email: 'user@example.com', fplId: '12345', enabled: true }
];

export async function GET(request) {
    // This would be triggered by a Cron job (e.g. Vercel Cron)
    // To protect this route, you'd check for an Authorization header
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 1. Fetch Bootstrap Data
        const bootstrapRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/fpl/bootstrap`);
        const bootstrapData = await bootstrapRes.json();

        // 2. Resolve GW info
        const gwInfo = resolveGameweekInfo(bootstrapData);
        if (!gwInfo) return NextResponse.json({ message: 'No GW info found' });

        console.log(`Cron Check: GW ${gwInfo.id}, Hours Remaining: ${gwInfo.hours_remaining}`);

        // 3. Check condition (hours_remaining == 3)
        if (gwInfo.hours_remaining === 3) {
            // Send emails to enabled users
            for (const user of MOCK_USERS) {
                if (user.enabled) {
                    await sendDeadlineEmail(user, gwInfo, bootstrapData);
                }
            }
            return NextResponse.json({ message: 'Reminders sent' });
        }

        return NextResponse.json({ message: 'No reminder needed at this time' });
    } catch (error) {
        console.error('Cron Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function sendDeadlineEmail(user, gwInfo, bootstrapData) {
    try {
        // Fetch user specifics for email (Captain pick etc)
        const userRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/fpl/picks/${user.fplId}?gw=${gwInfo.id}`);
        const userTeam = await userRes.json();
        const picks = generatePicks(bootstrapData, userTeam);

        console.log(`Sending Email to ${user.email}...`);
        console.log(`Subject: ⚽ Gameweek ${gwInfo.id} Deadline in 3 Hours`);
        console.log(`Body: Your picks are ready. Captain: ${picks.captain.web_name}, Differential: ${picks.differential.web_name}. Don't forget to lock in before the deadline.`);

        // Real email sending logic using Resend, SendGrid, etc.
        /*
        await resend.emails.send({
            from: 'FPL Assistant <reminders@fplassistant.com>',
            to: user.email,
            subject: `⚽ Gameweek ${gwInfo.id} Deadline in 3 Hours`,
            text: `Your picks are ready. Captain: ${picks.captain.web_name}...`
        });
        */
        return true;
    } catch (error) {
        console.error(`Failed to send email to ${user.email}:`, error);
    }
}
