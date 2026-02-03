import React from 'react';
import { useGame } from '../../context/GameContext';
import { CITIES } from '../../data/cities';
import { getDistance } from '../../utils';
import { Package, ArrowRight } from 'lucide-react';
import { Truck } from '../../types';

export const ContractBoard: React.FC<{ className?: string }> = ({ className }) => {
    const { state, dispatch } = useGame();
    const { contracts, trucks } = state;

    // Removed manual refresh button as per user request

    const handleAssign = async (contract: any, truckId: string) => {
        const truck = trucks.find(t => t.id === truckId);
        if (!truck) return;

        // 1. Assign Job immediately
        dispatch({
            type: 'ASSIGN_JOB',
            payload: { truckId, contract }
        });

        // 2. Calculate Routes
        const sourceCity = CITIES.find(c => c.id === contract.sourceCityId);
        const destCity = CITIES.find(c => c.id === contract.destCityId);

        if (!sourceCity || !destCity) return;

        // Check if deadhead needed
        const distToSource = getDistance(truck.location, sourceCity.coordinates);
        const isAtSource = distToSource < 5;

        // Import dynamically to avoid circular dependencies if any, or just import at top. 
        // We will assume import is at top.
        const { getRoute } = await import('../../services/routing');

        let routePath: import('../../types').Coordinates[] = [];
        let pendingRoutePath: import('../../types').Coordinates[] | undefined = undefined;

        try {
            if (isAtSource) {
                // Already there, just need route to destination
                routePath = await getRoute(truck.location, destCity.coordinates);
            } else {
                // Deadhead first
                routePath = await getRoute(truck.location, sourceCity.coordinates);
                // Then cargo route
                pendingRoutePath = await getRoute(sourceCity.coordinates, destCity.coordinates);
            }

            // 3. Dispatch Route
            dispatch({
                type: 'ROUTE_PLANNED',
                payload: {
                    truckId,
                    routePath,
                    pendingRoutePath
                }
            });
        } catch (error) {
            console.error("Failed to calculate route", error);
        }
    };

    const getBestAvailableTruck = (contract: any): { truck: Truck | null, dist: number } | null => {
        // Find closest idle truck
        const sourceCity = CITIES.find(c => c.id === contract.sourceCityId);
        if (!sourceCity) return null;

        let closestTruck: Truck | null = null;
        let minDist = Infinity;

        trucks.forEach(t => {
            if (t.status !== 'IDLE') return;
            const dist = getDistance(t.location, sourceCity.coordinates);
            if (dist < minDist) {
                minDist = dist;
                closestTruck = t;
            }
        });

        return { truck: closestTruck, dist: minDist };
    };

    return (
        <div className={className || "glass-panel w-96 h-full p-4 pointer-events-auto animate-slide-in flex flex-col"}>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold uppercase tracking-tight text-white">Daily Board</h2>
                <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <Package size={12} className="text-blue-400" />
                    Marketplace
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                {contracts.length === 0 && (
                    <div className="text-center text-slate-500 mt-10">
                        <Package size={48} className="mx-auto mb-2 opacity-50" />
                        <p>Market is closed.</p>
                        <p className="text-xs italic text-slate-600">Checking for new jobs...</p>
                    </div>
                )}

                {contracts
                    .map(c => {
                        const hqCity = CITIES.find(city => state.game.hqLocation.startsWith(city.name));
                        const sourceCity = CITIES.find(city => city.id === c.sourceCityId);
                        const hqDist = (hqCity && sourceCity) ? getDistance(hqCity.coordinates, sourceCity.coordinates) : Infinity;
                        return { ...c, hqDist };
                    })
                    .sort((a, b) => a.hqDist - b.hqDist)
                    .map(contract => {
                        const sourceName = CITIES.find(c => c.id === contract.sourceCityId)?.name || contract.sourceCityId;
                        const destName = CITIES.find(c => c.id === contract.destCityId)?.name || contract.destCityId;
                        const bestOption = getBestAvailableTruck(contract);
                        const bestTruck = bestOption?.truck;

                        // Remaining time in hours
                        const remainingMs = contract.expiresAt - state.game.time;
                        const remainingHours = Math.max(0, Math.floor(remainingMs / 3600000));
                        const remainingMins = Math.max(0, Math.floor((remainingMs % 3600000) / 60000));

                        return (
                            <div key={contract.id} className="p-3 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-blue-500/50 transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 px-2 py-0.5 bg-slate-700/50 rounded-bl-lg text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                                    Expires in {remainingHours}h {remainingMins}m
                                </div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">General Freight</span>
                                    <span className="text-sm font-bold text-green-400">€{contract.reward.toLocaleString()}</span>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-slate-200 mb-3">
                                    <span className="flex-1 font-bold">{sourceName}</span>
                                    <ArrowRight size={14} className="text-slate-600" />
                                    <span className="flex-1 text-right font-bold">{destName}</span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-500 font-bold uppercase">{Math.floor(contract.distance)} km</span>
                                        {contract.hqDist !== Infinity && (
                                            <span className="text-[9px] text-blue-400/60 font-medium">Near HQ ({Math.floor(contract.hqDist)}km)</span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => bestTruck && handleAssign(contract, bestTruck.id)}
                                        disabled={!bestTruck}
                                        className={`text-[10px] px-4 py-2 rounded-lg flex items-center gap-2 font-black uppercase tracking-wide transition-all
                                            ${bestTruck
                                                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 active:scale-95'
                                                : 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'}
                                        `}
                                    >
                                        {bestOption && bestTruck ? (
                                            bestOption.dist < 5 ? 'Select Job' : `Dispatch (${Math.floor(bestOption.dist)}km)`
                                        ) : (
                                            'No Truck'
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
            </div>
        </div>
    );
};
