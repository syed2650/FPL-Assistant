"use client";
import { useState, useEffect } from 'react';
import WelcomeScreen from '@/components/WelcomeScreen';
import ResultsScreen from '@/components/ResultsScreen';

import { generateStrategyPicks } from '@/utils/fplLogic';

export default function Home() {
  const [step, setStep] = useState('input'); // input, loading, results, error
  const [picks, setPicks] = useState(null);
  const [userData, setUserData] = useState(null);
  const [bootstrapData, setBootstrapData] = useState(null);
  const [fixtures, setFixtures] = useState(null);
  const [fplId, setFplId] = useState('');
  const [strategyMode, setStrategyMode] = useState('DEFEND');
  const [errorDetails, setErrorDetails] = useState(null);

  const handleStart = async (id) => {
    setFplId(id);
    setStep('loading');
    setErrorDetails(null);
    try {
      // 1. Fetch Bootstrap Data
      const bootstrapRes = await fetch('/api/fpl/bootstrap');
      if (!bootstrapRes.ok) throw new Error('Failed to load FPL data');
      const bootstrapDataJson = await bootstrapRes.json();
      setBootstrapData(bootstrapDataJson);

      // 2. Validate Team ID first
      const entryRes = await fetch(`/api/fpl/user/${id}`);
      if (!entryRes.ok) {
        if (entryRes.status === 404) throw new Error('Invalid Team ID. Please check and try again.');
        throw new Error('Failed to validate Team ID');
      }

      // 3. Determine Gameweeks
      const events = bootstrapDataJson.events;
      const nextEvent = events.find(e => e.is_next);
      const currentEvent = events.find(e => e.is_current);
      const lastFinishedEvent = [...events].reverse().find(e => e.finished);

      const gw_deadline = nextEvent ? nextEvent.id : (currentEvent ? currentEvent.id : 1);
      const gw_picks_primary = currentEvent ? currentEvent.id : lastFinishedEvent?.id;

      // 4. Fetch Fixtures for gw_deadline
      const fixturesRes = await fetch(`/api/fpl/fixtures?gw=${gw_deadline}`);
      const fixturesJson = await fixturesRes.json();
      setFixtures(fixturesJson);

      // 5. Fetch User Picks with Fallback
      let userDataJson = null;
      let finalGwPicksUsed = gw_picks_primary;

      const fetchPicks = async (gw) => {
        const res = await fetch(`/api/fpl/picks/${id}?gw=${gw}`);
        if (res.ok) return await res.json();
        return null;
      };

      userDataJson = await fetchPicks(gw_picks_primary);

      // If primary fails, try fallback (last finished)
      if (!userDataJson && lastFinishedEvent && lastFinishedEvent.id !== gw_picks_primary) {
        userDataJson = await fetchPicks(lastFinishedEvent.id);
        finalGwPicksUsed = lastFinishedEvent.id;
      }

      if (!userDataJson) {
        setStep('error');
        setErrorDetails({
          title: "We couldn't load your team picks yet",
          body: [
            "Check your Team ID is correct",
            "If you're brand new, create your squad first on FPL",
            "Try again after you've saved your team or after the next deadline"
          ]
        });
        return;
      }

      setUserData(userDataJson);

      // 6. Generate Picks
      const generated = generateStrategyPicks(bootstrapDataJson, fixturesJson, userDataJson, 'DEFEND');
      // Inject gw_deadline info specifically for the UI header
      const targetDeadlineEvent = nextEvent || currentEvent;
      generated.gwInfo = {
        id: gw_deadline,
        deadline_time: targetDeadlineEvent?.deadline_time,
        time_left: generated.gwInfo.time_left // Keep existing format from logic
      };

      setPicks(generated);
      setStep('results');
    } catch (error) {
      console.error(error);
      alert(error.message || "Something went wrong.");
      setStep('input');
    }
  };

  const updatePicks = (mode, bData = bootstrapData, fData = fixtures, uData = userData) => {
    if (!bData || !fData || !uData) return;
    const generated = generateStrategyPicks(bData, fData, uData, mode);
    setPicks(generated);
  };

  const handleModeChange = (newMode) => {
    setStrategyMode(newMode);
    updatePicks(newMode);
  };

  const handleReset = () => {
    setStep('input');
    setPicks(null);
    setUserData(null);
    setFplId('');
    setErrorDetails(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen flex flex-col items-center justify-center">
      <main className="w-full max-w-5xl">
        {step === 'input' && <WelcomeScreen onStart={handleStart} isLoading={false} />}
        {step === 'loading' && <WelcomeScreen onStart={() => { }} isLoading={true} />}

        {step === 'error' && errorDetails && (
          <div className="welcome-container animate-fade-in">
            <div className="glass-panel welcome-card text-left p-8">
              <h2 className="text-2xl font-bold text-red-400 mb-4">{errorDetails.title}</h2>
              <ul className="space-y-3 mb-8">
                {errorDetails.body.map((line, i) => (
                  <li key={i} className="text-gray-300 flex items-start gap-2">
                    <span className="text-red-400 mt-1">•</span> {line}
                  </li>
                ))}
              </ul>
              <button onClick={handleReset} className="btn-primary w-full">Try Again</button>
            </div>
          </div>
        )}

        {step === 'results' && picks && (
          <ResultsScreen
            picks={picks}
            userTeam={userData}
            bootstrapData={bootstrapData}
            onReset={handleReset}
            strategyMode={strategyMode}
            onModeChange={handleModeChange}
          />
        )}
      </main>
    </div>
  );
}


