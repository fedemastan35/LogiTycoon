import React from 'react';
import { useGame } from '../../context/GameContext';
import { Wallet, Activity, Truck, TrendingUp, MapPin, Calendar, Star } from 'lucide-react';
import { CITIES } from '../../data/cities';

export const Dashboard: React.FC<{ className?: string }> = ({ className }) => {
    const { state, dispatch } = useGame();
    const { game, trucks, activeContracts } = state;

    // Derived Stats
    const totalCash = game.money;
    const activeJobsCount = activeContracts.length;
    const fleetSize = trucks.length;
    const movingTrucks = trucks.filter(t => t.status === 'MOVING' || t.status === 'MOVING_TO_SOURCE').length;
    const utilization = fleetSize > 0 ? Math.round((movingTrucks / fleetSize) * 100) : 0;

    const StatCard = ({ icon: Icon, label, value, subtext, trend, trendColor }: any) => (
        <div className="glass-panel p-4 flex flex-col justify-between relative overflow-hidden group">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
                    <div className="text-2xl font-bold mt-1 text-white">
                        {label === 'Total Cash' ? `€ ${value.toLocaleString()}` : value}
                    </div>
                </div>
                <div className="p-2 bg-slate-800/50 rounded-lg text-blue-400 group-hover:scale-110 transition-transform">
                    <Icon size={18} />
                </div>
            </div>
            {subtext && (
                <div className="mt-2 flex items-center gap-1">
                    {trend && <span className={`text-[10px] font-bold ${trendColor}`}>{trend}</span>}
                    <span className="text-[10px] text-slate-500">{subtext}</span>
                </div>
            )}
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 blur-[40px] rounded-full"></div>
        </div>
    );

    return (
        <div className={className || "w-full h-full flex flex-col gap-6 animate-slide-in pointer-events-auto overflow-y-auto custom-scrollbar pr-2"}>
            {/* Header */}
            <div>
                <h2 className="text-3xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent uppercase tracking-tighter">
                    Dashboard
                </h2>
                <p className="text-slate-500 text-sm">Overview of your logistics operations.</p>
            </div>

            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={Wallet}
                    label="Total Cash"
                    value={totalCash}
                    trend="+12%"
                    trendColor="text-emerald-400"
                    subtext="from last month"
                />
                <StatCard
                    icon={Activity}
                    label="Active Jobs"
                    value={activeJobsCount}
                    subtext={`${movingTrucks} Trucks currently on road`}
                />
                <StatCard
                    icon={Truck}
                    label="Fleet Size"
                    value={fleetSize}
                />
                <StatCard
                    icon={TrendingUp}
                    label="Fleet Utilization"
                    value={`${utilization}%`}
                    subtext={`${fleetSize - movingTrucks} trucks idle`}
                />
            </div>

            {/* Main Content Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">

                {/* Live Operations */}
                <div className="lg:col-span-2 glass-panel p-6 flex flex-col">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        Live Operations
                    </h3>

                    <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar max-h-[300px]">
                        {activeContracts.length === 0 ? (
                            <div className="h-32 flex flex-col items-center justify-center text-slate-600 border border-dashed border-slate-800 rounded-xl">
                                <Activity size={32} className="mb-2 opacity-20" />
                                <span className="text-sm">No live operations found</span>
                            </div>
                        ) : (
                            activeContracts.map(contract => {
                                const source = CITIES.find(c => c.id === contract.sourceCityId)?.name;
                                const dest = CITIES.find(c => c.id === contract.destCityId)?.name;
                                const truck = trucks.find(t => t.currentContractId === contract.id);

                                return (
                                    <div key={contract.id} className="p-4 bg-slate-900/40 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors flex justify-between items-center group">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-200">{source} → {dest}</span>
                                                {truck && (
                                                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
                                                        {truck.name}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs text-slate-500 mt-1">{contract.cargo}</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-amber-500">€{contract.reward.toLocaleString()}</div>
                                            <div className="text-[10px] text-slate-600 uppercase font-bold">{contract.distance} km</div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Company Status */}
                <div className="glass-panel p-6 flex flex-col justify-between">
                    <h3 className="text-xl font-bold mb-6">Company Status</h3>

                    <div className="space-y-6">
                        <div className="flex justify-between items-center group cursor-default">
                            <div className="flex items-center gap-3 text-slate-400 text-sm">
                                <Star size={18} />
                                <span>Reputation</span>
                            </div>
                            <span className="font-bold text-amber-400">{game.reputation}</span>
                        </div>

                        <div className="flex justify-between items-center group cursor-default">
                            <div className="flex items-center gap-3 text-slate-400 text-sm">
                                <MapPin size={18} />
                                <span>HQ Location</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-200">{game.hqLocation}</span>
                                <button
                                    onClick={() => dispatch({ type: 'SET_HQ_MODE' as any })} // We'll add this to open a list
                                    className="p-1 hover:bg-slate-800 rounded text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Relocate HQ (€10,000)"
                                >
                                    <TrendingUp size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Inline Selector for HQ (Simple version for now) */}
                        <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar p-2 bg-slate-900/50 rounded-lg border border-slate-800">
                            <div className="text-[10px] font-bold text-slate-500 uppercase flex justify-between">
                                <span>Relocate HQ</span>
                                <span>Cost: €10,000</span>
                            </div>
                            {CITIES.filter(c => `${c.name}, ${c.id.split('-')[0].toUpperCase()}` !== game.hqLocation).map(city => {
                                const cityLabel = `${city.name}, ${city.id.split('-')[0].toUpperCase()}`;
                                return (
                                    <button
                                        key={city.id}
                                        onClick={() => dispatch({ type: 'SET_HQ', payload: cityLabel })}
                                        disabled={game.money < 10000}
                                        className="w-full text-left p-2 rounded hover:bg-slate-800 text-xs text-slate-300 flex justify-between items-center transition-colors disabled:opacity-30"
                                    >
                                        <span>{city.name}</span>
                                        <TrendingUp size={12} className="text-blue-500" />
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex justify-between items-center group cursor-default">
                            <div className="flex items-center gap-3 text-slate-400 text-sm">
                                <Calendar size={18} />
                                <span>Founded</span>
                            </div>
                            <span className="font-bold text-slate-200">{game.foundedDate}</span>
                        </div>
                    </div>

                    <div className="mt-12 p-4 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/20 rounded-xl">
                        <div className="text-xs font-bold text-blue-400 uppercase mb-1">Company Goal</div>
                        <div className="text-sm text-slate-300">Expand your feet to 5 trucks and reach 'Elite' status.</div>
                    </div>
                </div>

            </div>
        </div>
    );
};
