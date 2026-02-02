import React from 'react';
import { useGame } from '../../context/GameContext';
import { Truck as TruckIcon, MapPin, Navigation } from 'lucide-react';

export const FleetList: React.FC<{ className?: string }> = ({ className }) => {
    const { state, dispatch } = useGame();
    const { trucks, game } = state;

    const buyTruck = () => {
        if (game.money >= 50000) {
            dispatch({
                type: 'BUY_TRUCK',
                payload: {
                    id: `t-${Date.now()}`,
                    name: `Volvo FH16 #${trucks.length + 1}`,
                    speed: 80,
                    status: 'IDLE',
                    location: { lat: 51.5074, lng: -0.1278 } // New trucks in London for now
                }
            });
        }
    };

    return (
        <div className={className || "glass-panel w-96 h-full p-4 pointer-events-auto animate-slide-in flex flex-col"}>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Fleet Management</h2>
                <div className="text-xs text-slate-400">{trucks.length} Trucks</div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {trucks.map(truck => (
                    <div key={truck.id} className="p-3 bg-slate-800/50 rounded border border-slate-700 hover:border-slate-500 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <TruckIcon size={16} className="text-blue-400" />
                                <span className="font-bold text-sm">{truck.name}</span>
                            </div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${truck.status === 'MOVING' ? 'border-green-500/30 text-green-400 bg-green-500/10' :
                                truck.status === 'MOVING_TO_SOURCE' ? 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10' :
                                    'border-slate-500/30 text-slate-400 bg-slate-500/10'
                                }`}>
                                {truck.status === 'MOVING_TO_SOURCE' ? 'DISPATCHING' : truck.status}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <MapPin size={12} />
                            <span>{truck.location.lat.toFixed(2)}, {truck.location.lng.toFixed(2)}</span>
                        </div>

                        {truck.status === 'MOVING' && truck.destination && (
                            <div className="flex items-center gap-2 text-xs text-blue-300 mt-1">
                                <Navigation size={12} />
                                <span>Driving to destination...</span>
                            </div>
                        )}

                        {truck.status === 'MOVING_TO_SOURCE' && truck.destination && (
                            <div className="flex items-center gap-2 text-xs text-yellow-300 mt-1">
                                <Navigation size={12} />
                                <span>Deadheading to pickup...</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-700">
                <button
                    onClick={buyTruck}
                    disabled={game.money < 50000}
                    className={`w-full py-2 rounded font-bold text-sm transition-all flex justify-between px-4
                        ${game.money >= 50000
                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
                    `}
                >
                    <span>Buy New Truck</span>
                    <span>€ 50,000</span>
                </button>
            </div>
        </div>
    );
};
