"use client";
import { useState } from 'react';
import WelcomeScreen from '@/components/WelcomeScreen';
import ResultsScreen from '@/components/ResultsScreen';

import { generatePicks } from '@/utils/fplLogic';

export default function Home() {
  const [step, setStep] = useState('input'); // input, loading, results
  const [picks, setPicks] = useState(null);
  const [userData, setUserData] = useState(null);
  const [bootstrapData, setBootstrapData] = useState(null);

  const handleStart = async (fplId) => {
    setStep('loading');
    try {
      // 1. Fetch Bootstrap Data
      const bootstrapRes = await fetch('/api/fpl/bootstrap');
      if (!bootstrapRes.ok) throw new Error('Failed to load FPL data');
      const bootstrapDataJson = await bootstrapRes.json();
      setBootstrapData(bootstrapDataJson);

      // 2. Determine Gameweek
      const currentEvent = bootstrapDataJson.events.find(e => e.is_current) || bootstrapDataJson.events.find(e => e.is_next);
      const gwId = currentEvent ? currentEvent.id : 1;

      console.log('Determined GW:', gwId);

      // 3. Fetch User Picks
      const userRes = await fetch(`/api/fpl/picks/${fplId}?gw=${gwId}`);
      if (!userRes.ok) {
        const errData = await userRes.json().catch(() => ({}));
        throw new Error(errData.error || 'Could not find team. Check ID.');
      }
      const userDataJson = await userRes.json();
      setUserData(userDataJson);

      // 4. Generate Picks
      const generatedPicks = generatePicks(bootstrapDataJson, userDataJson);

      setPicks(generatedPicks);
      setStep('results');
    } catch (error) {
      console.error(error);
      alert(error.message || "Something went wrong.");
      setStep('input');
    }
  };

  const handleReset = () => {
    setStep('input');
    setPicks(null);
    setUserData(null);
    // bootstrapData can stay in memory potentially, but resetting for cleanliness is fine
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
          />
        )}
      </main>
    </div>
  );
}
