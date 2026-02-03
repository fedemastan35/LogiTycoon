import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { Truck as TruckIcon, MapPin, Gauge, ShieldCheck } from 'lucide-react';
import { CITIES } from '../../data/cities';
import { getClosestCity } from '../../utils/geoUtils';

export const FleetList: React.FC<{ className?: string }> = ({ className }) => {
    const { state, dispatch } = useGame();
    const { trucks, game, hiredDrivers } = state;
    const [tab, setTab] = useState<'TRUCKS' | 'DRIVERS'>('TRUCKS');

    const buyTruck = () => {
        if (game.money >= 50000) {
            // Find HQ coordinates, default to London if not found (though HQ is mandatory now)
            const hqCity = CITIES.find(c => game.hqLocation.startsWith(c.name));
            const spawnLocation = hqCity ? hqCity.coordinates : { lat: 51.5074, lng: -0.1278 };

            dispatch({
                type: 'BUY_TRUCK',
                payload: {
                    id: `t-${Date.now()}`,
                    name: `MAN TGX #${trucks.length + 1}`,
                    speed: 80,
                    status: 'IDLE',
                    location: spawnLocation,
                    condition: 100,
                }
            });
        }
    };

    return (
        <div className={className || "glass-panel w-full lg:w-[500px] h-full p-6 pointer-events-auto animate-slide-in flex flex-col gap-6"}>
            {/* Header */}
            <div>
                <h2 className="text-3xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent uppercase tracking-tighter">
                    Fleet Management
                </h2>
                <p className="text-slate-500 text-sm">Manage your vehicles and personnel.</p>
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800">
                <button
                    onClick={() => setTab('TRUCKS')}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${tab === 'TRUCKS' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Trucks
                </button>
                <button
                    onClick={() => setTab('DRIVERS')}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${tab === 'DRIVERS' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Drivers
                </button>
            </div>

            {tab === 'TRUCKS' ? (
                <>
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest">
                            Owned Vehicles ({trucks.length})
                        </h3>
                        <button
                            onClick={buyTruck}
                            disabled={game.money < 50000}
                            className="text-[10px] font-bold text-blue-400 hover:text-blue-300 disabled:opacity-30 transition-colors uppercase tracking-widest"
                        >
                            + Buy New Vehicle
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                        {trucks.length === 0 ? (
                            <div className="h-40 flex flex-col items-center justify-center text-slate-600 border border-dashed border-slate-800 rounded-2xl">
                                <TruckIcon size={32} className="mb-2 opacity-20" />
                                <span className="text-sm italic">No vehicles in fleet</span>
                            </div>
                        ) : (
                            trucks.map(truck => (
                                <div key={truck.id} className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden flex flex-col group hover:border-slate-700 transition-all">
                                    {/* Icon Top Section */}
                                    <div className="h-24 bg-gradient-to-b from-slate-800/50 to-transparent flex items-center justify-center relative">
                                        <TruckIcon size={48} className="text-slate-700 group-hover:scale-110 group-hover:text-slate-600 transition-all" />
                                        <div className="absolute top-3 right-3">
                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-sm
                                                ${truck.status === 'MOVING' || truck.status === 'MOVING_TO_SOURCE'
                                                    ? 'bg-amber-500 text-slate-950'
                                                    : 'bg-slate-800 text-slate-400'}
                                             `}>
                                                {truck.status === 'MOVING' || truck.status === 'MOVING_TO_SOURCE' ? 'ON_JOB' : truck.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Info Section */}
                                    <div className="p-4 pt-0">
                                        <div className="mb-4">
                                            <h4 className="text-lg font-black text-white uppercase tracking-tight">{truck.name}</h4>
                                            <span className="text-[10px] font-mono text-slate-500 uppercase">{truck.id}</span>
                                        </div>

                                        <div className="space-y-4">
                                            {/* Condition Bar */}
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                                                    <span className="text-slate-500 flex items-center gap-1">
                                                        <Gauge size={10} /> Condition
                                                    </span>
                                                    <span className={`${truck.condition < 30 ? 'text-red-400' : 'text-white'}`}>{Math.round(truck.condition)}%</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all duration-500 ease-out ${truck.condition < 30 ? 'bg-red-500' : 'bg-amber-500'
                                                                }`}
                                                            style={{ width: `${truck.condition}%` }}
                                                        />
                                                    </div>
                                                    {truck.condition < 100 && (
                                                        <button
                                                            onClick={() => dispatch({ type: 'REPAIR_TRUCK', payload: truck.id })}
                                                            disabled={game.money < (100 - truck.condition) * 50 || truck.status !== 'IDLE'}
                                                            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 border border-slate-700 rounded-lg text-[10px] font-black text-blue-400 uppercase transition-all"
                                                        >
                                                            Repair (€{Math.round((100 - truck.condition) * 50).toLocaleString()})
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Location */}
                                            <div className="flex justify-between items-center border-t border-slate-800/50 pt-3">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                                                    <MapPin size={10} /> Location
                                                </span>
                                                <span className="text-xs font-bold text-slate-300">
                                                    {getClosestCity(truck.location, CITIES)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            ) : (
                <>
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest">
                            Staff Directory ({hiredDrivers.length})
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                        {hiredDrivers.map(driver => (
                            <div key={driver.id} className="glass-panel p-4 flex justify-between items-center group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700">
                                        <div className="text-xs font-bold text-slate-500">{driver.name.charAt(0)}</div>
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm text-slate-200">{driver.name}</div>
                                        <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                                            <ShieldCheck size={10} className="text-blue-500" /> Skill Level {driver.skill}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase">Salary</div>
                                    <div className="text-xs font-bold text-emerald-400">€{driver.salary}/day</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};
