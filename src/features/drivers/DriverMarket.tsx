import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { User, Briefcase, TrendingUp, DollarSign, Truck as TruckIcon } from 'lucide-react';

export const DriverMarket: React.FC<{ className?: string }> = ({ className }) => {
    const { state, dispatch } = useGame();
    const { availableDrivers, hiredDrivers, trucks, game } = state;
    const [tab, setTab] = useState<'HIRE' | 'MANAGE'>('HIRE');

    const hireDriver = (id: string) => {
        dispatch({ type: 'HIRE_DRIVER', payload: id });
    };

    const assignDriver = (driverId: string, truckId: string) => {
        dispatch({ type: 'ASSIGN_DRIVER', payload: { driverId, truckId } });
    };

    const getSkillColor = (level: number) => {
        if (level >= 5) return 'text-purple-400';
        if (level >= 3) return 'text-blue-400';
        return 'text-slate-400';
    };

    return (
        <div className={className || "glass-panel w-96 h-full p-4 pointer-events-auto animate-slide-in flex flex-col"}>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Briefcase className="text-blue-400" size={24} />
                    Drivers
                </h2>
                <div className="flex gap-2 bg-slate-800 rounded p-1">
                    <button
                        onClick={() => setTab('HIRE')}
                        className={`text-xs px-3 py-1 rounded transition-colors ${tab === 'HIRE' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        Market
                    </button>
                    <button
                        onClick={() => setTab('MANAGE')}
                        className={`text-xs px-3 py-1 rounded transition-colors ${tab === 'MANAGE' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        Staff ({hiredDrivers.length})
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                {tab === 'HIRE' && (
                    <>
                        {availableDrivers.length === 0 && (
                            <div className="text-center text-slate-500 mt-10">
                                <User size={48} className="mx-auto mb-2 opacity-30" />
                                <p>No drivers looking for work.</p>
                            </div>
                        )}
                        {availableDrivers.map(driver => (
                            <div key={driver.id} className="p-3 bg-slate-800/50 rounded border border-slate-700 flex justify-between items-center group hover:border-blue-500/50 transition-colors">
                                <div>
                                    <h3 className="font-bold text-slate-200">{driver.name}</h3>
                                    <div className="flex items-center gap-3 text-xs mt-1">
                                        <div className="flex items-center gap-1" title="Skill Level">
                                            <TrendingUp size={12} className={getSkillColor(driver.skill)} />
                                            <span className={getSkillColor(driver.skill)}>Level {driver.skill}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-green-400" title="Daily Salary">
                                            <DollarSign size={12} />
                                            <span>€{driver.salary}/day</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => hireDriver(driver.id)}
                                    disabled={game.money < 500}
                                    className={`text-xs px-3 py-1.5 rounded font-bold transition-all
                                        ${game.money >= 500 ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}
                                    `}
                                >
                                    Hire (€500)
                                </button>
                            </div>
                        ))}
                    </>
                )}

                {tab === 'MANAGE' && (
                    <>
                        {hiredDrivers.map(driver => {
                            const assignedTruck = trucks.find(t => t.id === driver.assignedTruckId);
                            return (
                                <div key={driver.id} className="p-3 bg-slate-800/30 rounded border border-slate-700 flex flex-col gap-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-slate-200 flex items-center gap-2">
                                                {driver.name}
                                                <span className={`text-[10px] px-1 py-0.5 rounded border ${driver.skill >= 4 ? 'border-purple-500/30 bg-purple-500/10 text-purple-400' : 'border-slate-500/30 bg-slate-500/10 text-slate-400'}`}>
                                                    Lvl {driver.skill}
                                                </span>
                                            </h3>
                                            <div className="text-xs text-slate-500 mt-1">Salary: €{driver.salary}/day</div>
                                        </div>
                                        <div className="text-right">
                                            {assignedTruck ? (
                                                <div className="text-xs text-blue-400 flex items-center justify-end gap-1">
                                                    <TruckIcon size={12} />
                                                    {assignedTruck.name}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-yellow-500">Unassigned</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2 mt-2 pt-2 border-t border-slate-700/50">
                                        <span className="text-[10px] text-slate-500 uppercase font-bold">Assign to Truck</span>
                                        <div className="flex gap-2flex-wrap gap-1">
                                            {trucks.map(t => (
                                                <button
                                                    key={t.id}
                                                    onClick={() => assignDriver(driver.id, t.id)}
                                                    disabled={t.driverId === driver.id}
                                                    className={`text-[10px] px-2 py-1 rounded border transition-colors mb-1 mr-1
                                                        ${t.driverId === driver.id
                                                            ? 'bg-blue-900/30 border-blue-500 text-blue-300'
                                                            : t.driverId
                                                                ? 'bg-slate-800 border-slate-700 text-slate-500' // Occupied
                                                                : 'bg-slate-800 border-slate-600 hover:border-slate-400 text-slate-300' // Free
                                                        }
                                                    `}
                                                    title={t.driverId ? `Occupied by another driver` : 'Assign'}
                                                >
                                                    {t.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </>
                )}
            </div>
        </div>
    );
};
