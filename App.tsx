
import React, { useState } from 'react';
import Wheel from './components/Wheel';
import BettingTable from './components/BettingTable';
import Home from './components/Home';
import { GameState, Bet, BetType } from './types';
import { WHEEL_SEQUENCE, getNumberColor, PAYOUTS } from './constants';
import { audioService } from './services/audioService';

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'game'>('home');
  const [state, setState] = useState<GameState>({
    balance: 1000,
    currentBets: [],
    isSpinning: false,
    lastResult: null,
    history: [],
    message: 'Welcome to Monte Carlo Royale. Place your bets!',
  });

  const [betAmount, setBetAmount] = useState<number>(10);
  const [rotation, setRotation] = useState<number>(0);

  const placeBet = (type: BetType, value: number | string) => {
    if (state.isSpinning) return;
    if (state.balance < betAmount) {
      setState(prev => ({ ...prev, message: 'Insufficient balance!' }));
      return;
    }

    audioService.playClick();
    const newBet: Bet = { type, value, amount: betAmount };
    setState(prev => ({
      ...prev,
      balance: prev.balance - betAmount,
      currentBets: [...prev.currentBets, newBet],
      message: `Placed ${betAmount} on ${value}`
    }));
  };

  const clearBets = () => {
    if (state.isSpinning) return;
    const totalReturned = state.currentBets.reduce((sum, b) => sum + b.amount, 0);
    setState(prev => ({
      ...prev,
      balance: prev.balance + totalReturned,
      currentBets: [],
      message: 'All bets cleared.'
    }));
  };

  const spin = () => {
    if (state.isSpinning || state.currentBets.length === 0) {
      if (state.currentBets.length === 0) {
        setState(prev => ({ ...prev, message: 'Please place a bet first!' }));
      }
      return;
    }

    const winningNumber = WHEEL_SEQUENCE[Math.floor(Math.random() * WHEEL_SEQUENCE.length)];
    const newRotation = rotation + (360 * 5) + Math.random() * 360; // 5 full spins + offset
    
    setRotation(newRotation);
    setState(prev => ({ ...prev, isSpinning: true, lastResult: null, message: 'The wheel is spinning...' }));
    audioService.playSpin();

    setTimeout(() => {
      handleResult(winningNumber);
    }, 6000);
  };

  const handleResult = (winningNum: number) => {
    let winnings = 0;
    const color = getNumberColor(winningNum);
    
    state.currentBets.forEach(bet => {
      let won = false;
      if (bet.type === 'STRAIGHT' && bet.value === winningNum) won = true;
      if (bet.type === 'RED' && color === 'red') won = true;
      if (bet.type === 'BLACK' && color === 'black') won = true;
      if (bet.type === 'EVEN' && winningNum !== 0 && winningNum % 2 === 0) won = true;
      if (bet.type === 'ODD' && winningNum % 2 !== 0) won = true;
      if (bet.type === 'LOW' && winningNum >= 1 && winningNum <= 18) won = true;
      if (bet.type === 'HIGH' && winningNum >= 19 && winningNum <= 36) won = true;

      if (won) {
        const payoutMultiplier = PAYOUTS[bet.type];
        winnings += bet.amount + (bet.amount * payoutMultiplier);
      }
    });

    if (winnings > 0) {
      audioService.playWin();
    } else {
      audioService.playLoss();
    }

    setState(prev => ({
      ...prev,
      balance: prev.balance + winnings,
      currentBets: [],
      isSpinning: false,
      lastResult: winningNum,
      history: [winningNum, ...prev.history].slice(0, 10),
      message: winnings > 0 ? `Winner! Number ${winningNum} (${color.toUpperCase()}). Won ${winnings} chips!` : `Better luck next time. Number was ${winningNum}.`
    }));
  };

  if (view === 'home') {
    return <Home onStart={() => setView('game')} />;
  }

  return (
    <div className="min-h-screen p-4 sm:p-8 flex flex-col items-center animate-in fade-in duration-500">
      {/* Header */}
      <header className="text-center mb-8 relative w-full flex flex-col items-center">
        <button 
          onClick={() => setView('home')}
          className="absolute left-0 top-1/2 -translate-y-1/2 text-[#d4af37] text-sm font-cinzel hover:underline hidden md:block"
        >
          &larr; BACK TO LOBBY
        </button>
        <h1 className="text-4xl sm:text-6xl font-cinzel font-bold gold-glow text-[#d4af37] tracking-widest mb-2 uppercase">
          Monte Carlo Royale
        </h1>
        <p className="text-gray-400 font-light italic">Premium European Roulette Experience</p>
      </header>

      {/* Main Game Area */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Stats & History */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-zinc-900/80 border border-[#d4af37]/30 p-6 rounded-2xl shadow-xl">
            <h2 className="text-[#d4af37] font-cinzel text-xl mb-4 border-b border-[#d4af37]/20 pb-2">Your Vault</h2>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Balance:</span>
              <span className="text-3xl font-bold text-white tracking-tighter">
                {state.balance.toLocaleString()} <span className="text-[#d4af37] text-lg font-cinzel">Chips</span>
              </span>
            </div>
          </div>

          <div className="bg-zinc-900/80 border border-[#d4af37]/30 p-6 rounded-2xl shadow-xl">
            <h2 className="text-[#d4af37] font-cinzel text-xl mb-4 border-b border-[#d4af37]/20 pb-2">Last Outcomes</h2>
            <div className="flex flex-wrap gap-2">
              {state.history.length === 0 && <span className="text-gray-500 italic">No spins yet...</span>}
              {state.history.map((num, idx) => (
                <div 
                  key={idx}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 border-white/10 shadow-lg ${
                    getNumberColor(num) === 'red' ? 'bg-red-800' : getNumberColor(num) === 'black' ? 'bg-zinc-800' : 'bg-green-700'
                  }`}
                >
                  {num}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Wheel */}
        <div className="lg:col-span-1 flex flex-col items-center justify-center">
          <Wheel isSpinning={state.isSpinning} targetNumber={state.lastResult} rotation={rotation} />
          
          <div className="mt-8 text-center space-y-4">
            <p className={`text-xl font-medium px-6 py-2 rounded-full border transition-all duration-300 min-h-[44px] flex items-center justify-center ${
              state.isSpinning ? 'border-yellow-500 text-yellow-500 animate-pulse' : 'border-[#d4af37]/30 text-gray-200'
            }`}>
              {state.message}
            </p>
            
            <div className="flex items-center justify-center gap-4">
               <button 
                onClick={spin}
                disabled={state.isSpinning}
                className={`
                  px-12 py-4 rounded-full font-cinzel text-2xl font-bold transition-all shadow-2xl transform active:scale-95
                  ${state.isSpinning ? 'bg-zinc-700 text-gray-400 cursor-not-allowed' : 'bg-[#d4af37] text-black hover:bg-[#b8962e] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)]'}
                `}
              >
                {state.isSpinning ? 'SPINNING...' : 'SPIN'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-zinc-900/80 border border-[#d4af37]/30 p-6 rounded-2xl shadow-xl">
            <h2 className="text-[#d4af37] font-cinzel text-xl mb-4 border-b border-[#d4af37]/20 pb-2">Wager Settings</h2>
            <div className="space-y-4">
              <label className="text-gray-400 text-sm block">Chip Value:</label>
              <div className="grid grid-cols-3 gap-2">
                {[5, 10, 25, 50, 100, 500].map(val => (
                  <button
                    key={val}
                    onClick={() => { audioService.playClick(); setBetAmount(val); }}
                    className={`py-2 rounded border transition-all ${betAmount === val ? 'bg-[#d4af37] text-black border-white' : 'bg-black/40 text-gray-400 border-white/10 hover:border-[#d4af37]/50'}`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <div className="pt-4 border-t border-white/5 flex gap-2">
                <button 
                  onClick={clearBets}
                  className="flex-1 py-2 rounded bg-zinc-800 text-gray-400 hover:bg-zinc-700 transition-all text-sm uppercase tracking-wider"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-zinc-900/80 border border-[#d4af37]/30 p-6 rounded-2xl shadow-xl text-center">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Total Current Bet</p>
            <p className="text-4xl font-bold text-[#d4af37]">
              {state.currentBets.reduce((sum, b) => sum + b.amount, 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Betting Table */}
      <BettingTable 
        isSpinning={state.isSpinning} 
        currentBets={state.currentBets} 
        onPlaceBet={placeBet} 
      />

      <footer className="mt-12 text-gray-600 text-xs text-center space-y-2">
        <p>&copy; 2024 Monte Carlo Royale - Virtual Gaming Environment</p>
        <p>Please play responsibly. For entertainment purposes only.</p>
      </footer>
    </div>
  );
};

export default App;
