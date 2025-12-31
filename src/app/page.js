"use client";
import { useState, useEffect } from 'react';
import WelcomeScreen from '@/components/WelcomeScreen';
import ResultsScreen from '@/components/ResultsScreen';

import { generateStrategyPicks } from '@/utils/fplLogic';

export default function Home() {
  const [step, setStep] = useState('input'); // input, loading, results
  const [picks, setPicks] = useState(null);
  const [userData, setUserData] = useState(null);
  const [bootstrapData, setBootstrapData] = useState(null);
  const [fixtures, setFixtures] = useState(null);
  const [fplId, setFplId] = useState('');
  const [strategyMode, setStrategyMode] = useState('DEFEND');

  const handleStart = async (id) => {
    setFplId(id);
    setStep('loading');
    try {
      // 1. Fetch Bootstrap Data
      const bootstrapRes = await fetch('/api/fpl/bootstrap');
      if (!bootstrapRes.ok) throw new Error('Failed to load FPL data');
      const bootstrapDataJson = await bootstrapRes.json();
      setBootstrapData(bootstrapDataJson);

      // 2. Determine Gameweek
      const event = bootstrapDataJson.events.find(e => e.is_next) || bootstrapDataJson.events.find(e => e.is_current);
      const gwId = event ? event.id : 1;

      // 3. Fetch Fixtures
      const fixturesRes = await fetch(`/api/fpl/fixtures?gw=${gwId}`);
      const fixturesJson = await fixturesRes.json();
      setFixtures(fixturesJson);

      // 4. Fetch User Picks
      const userRes = await fetch(`/api/fpl/picks/${id}?gw=${gwId}`);
      if (!userRes.ok) {
        const errData = await userRes.json().catch(() => ({}));
        throw new Error(errData.error || 'Could not find team. Check ID.');
      }
      const userDataJson = await userRes.json();
      setUserData(userDataJson);

      // 5. Generate Picks
      updatePicks('DEFEND', bootstrapDataJson, fixturesJson, userDataJson);
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
  };

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen flex flex-col items-center justify-center">
      <main className="w-full max-w-5xl">
        {step === 'input' && <WelcomeScreen onStart={handleStart} isLoading={false} />}
        {step === 'loading' && <WelcomeScreen onStart={() => { }} isLoading={true} />}
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

