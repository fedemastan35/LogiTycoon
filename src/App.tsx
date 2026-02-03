import { useState } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { MapView } from './features/map/MapView';
import { FleetList } from './features/fleet/FleetList';
import { ContractBoard } from './features/contracts/ContractBoard';
import { BankPanel } from './features/bank/BankPanel';
import { Dashboard } from './features/dashboard/Dashboard';
import { DriverMarket } from './features/drivers/DriverMarket';
import { Truck, Package, LayoutDashboard, Pause, Play, Landmark, Eye, EyeOff, Users } from 'lucide-react';
import './styles/global.css';

// Components
const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <div
    onClick={onClick}
    className={`p-3 rounded-xl cursor-pointer transition-all flex flex-col items-center gap-1
        ${active ? 'bg-blue-600 shadow-lg shadow-blue-500/30 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
    `}
  >
    <Icon size={24} />
    <span className="text-[10px] lg:text-xs font-medium">{label}</span>
  </div>
);

const GameControls = ({ showUI, setShowUI }: { showUI: boolean, setShowUI: (v: boolean) => void }) => {
  const { state, dispatch } = useGame();
  const { game } = state;

  // Format Game Time
  const date = new Date(game.time);
  const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dayString = date.toLocaleDateString([], { weekday: 'short', day: 'numeric' });

  return (
    <div className="glass-panel p-2 flex items-center gap-2 lg:gap-4 px-3 lg:px-4 scale-90 origin-right lg:scale-100 transition-opacity duration-300">
      <div className="flex flex-col">
        <span className="text-sm font-bold text-white">{timeString}</span>
        <span className="text-xs text-slate-400">{dayString}</span>
      </div>

      <div className="h-8 w-[1px] bg-slate-700 mx-1 lg:mx-2"></div>

      <button className="text-slate-200 hover:text-white" onClick={() => dispatch({ type: 'TOGGLE_PAUSE' })}>
        {game.paused ? <Play size={20} fill="currentColor" /> : <Pause size={20} fill="currentColor" />}
      </button>

      {/* Speed Controls: Only 1x and 3x */}
      <div className="flex bg-slate-800 rounded p-1 gap-1 hidden sm:flex">
        {[1, 3, 10].map(speed => (
          <button
            key={speed}
            onClick={() => dispatch({ type: 'SET_SPEED', payload: speed })}
            className={`text-xs px-2 py-1 rounded transition-colors ${game.gameSpeed === speed ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
          >
            {speed}x
          </button>
        ))}
      </div>

      <div className="h-8 w-[1px] bg-slate-700 mx-1 lg:mx-2 hidden sm:block"></div>

      <div className="flex flex-col text-right mr-2">
        <span className="text-xs text-slate-400 hidden sm:inline">Balance</span>
        <span className="text-sm font-bold text-green-400">€ {state.game.money.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
      </div>

      <button
        onClick={() => setShowUI(!showUI)}
        className={`p-2 rounded-full transition-colors ${!showUI ? 'bg-slate-700 text-slate-300' : 'text-slate-500 hover:text-white'}`}
        title="Toggle UI"
      >
        {showUI ? <Eye size={18} /> : <EyeOff size={18} />}
      </button>
    </div>
  );
};

const UIOverlay = () => {
  const [view, setView] = useState<'DASHBOARD' | 'FLEET' | 'CONTRACTS' | 'BANK' | 'DRIVERS'>('DASHBOARD');
  const [showUI, setShowUI] = useState(true);

  const navItems = [
    { id: 'DASHBOARD', icon: LayoutDashboard, label: 'Home' },
    { id: 'FLEET', icon: Truck, label: 'Fleet' },
    { id: 'DRIVERS', icon: Users, label: 'Staff' },
    { id: 'CONTRACTS', icon: Package, label: 'Jobs' },
    { id: 'BANK', icon: Landmark, label: 'Bank' },
  ];

  // Wide class for dashboard, normal for side panels
  const isDashboard = view === 'DASHBOARD';
  const commonPanelClass = isDashboard
    ? "w-full max-w-6xl mx-auto h-[70vh] lg:h-[80vh] p-4 pointer-events-auto flex flex-col absolute bottom-0 lg:relative lg:bottom-auto z-20"
    : "glass-panel w-full lg:w-96 h-[50vh] lg:h-full p-4 pointer-events-auto animate-slide-in flex flex-col absolute bottom-0 lg:static z-20";

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col">
      {/* Top Bar - Always Visible (contains toggle) */}
      <div className="w-full p-2 lg:p-4 flex justify-between items-start pointer-events-auto z-30 relative">
        <div className={`glass-panel px-3 py-2 lg:px-4 transition-opacity duration-300 absolute left-1/2 -translate-x-1/2 ${showUI ? 'opacity-100' : 'opacity-0'}`}>
          <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            LOGI<span className="text-white">TYCOON</span>
          </h1>
        </div>
        <div className="ml-auto">
          <GameControls showUI={showUI} setShowUI={setShowUI} />
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 flex overflow-hidden relative z-10 transition-opacity duration-300 ${showUI ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>

        {/* Desktop Sidebar (Changed from md to lg for better tablet separation) */}
        <div className="hidden lg:flex w-20 m-4 mt-0 glass-panel flex-col items-center py-4 gap-4 pointer-events-auto h-fit">
          {navItems.map(item => (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={view === item.id}
              onClick={() => setView(item.id as any)}
            />
          ))}
        </div>

        {/* Content Container */}
        <div className={`flex-1 p-2 lg:p-4 mt-0 h-full relative pointer-events-none flex flex-col-reverse lg:block ${isDashboard ? 'flex items-center justify-center' : ''}`}>
          {view === 'FLEET' && <FleetList className={commonPanelClass} />}
          {view === 'CONTRACTS' && <ContractBoard className={commonPanelClass} />}
          {view === 'BANK' && <BankPanel className={commonPanelClass} />}
          {view === 'DRIVERS' && <DriverMarket className={commonPanelClass} />}
          {view === 'DASHBOARD' && <Dashboard className={commonPanelClass} />}
        </div>
      </div>

      {/* Mobile Bottom Navigation (Visible on lg and below) */}
      <div className={`lg:hidden fixed bottom-0 left-0 w-full glass-panel rounded-none border-x-0 border-b-0 flex justify-around p-2 pointer-events-auto z-30 bg-slate-900/90 backdrop-blur-md transition-transform duration-300 ${showUI ? 'translate-y-0' : 'translate-y-full'}`}>
        {navItems.map(item => (
          <SidebarItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={view === item.id}
            onClick={() => setView(item.id as any)}
          />
        ))}
      </div>
    </div>
  );
}

function App() {
  return (
    <GameProvider>
      <div className="relative w-full h-full bg-slate-900 overflow-hidden text-slate-100">
        <MapView />
        <UIOverlay />
      </div>
    </GameProvider>
  )
}

export default App
