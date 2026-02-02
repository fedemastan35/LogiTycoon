import React from 'react';
import { useGame } from '../../context/GameContext';
import { CITIES } from '../../data/cities';
import { getDistance } from '../../utils';
import { RefreshCw, Package, ArrowRight } from 'lucide-react';
import { Truck } from '../../types';

export const ContractBoard: React.FC<{ className?: string }> = ({ className }) => {
    const { state, dispatch } = useGame();
    const { contracts, trucks } = state;

    const generateContracts = () => {
        // Generate 5 random contracts
        for (let i = 0; i < 5; i++) {
            const startCity = CITIES[Math.floor(Math.random() * CITIES.length)];
            let endCity = CITIES[Math.floor(Math.random() * CITIES.length)];
            while (startCity.id === endCity.id) {
                endCity = CITIES[Math.floor(Math.random() * CITIES.length)];
            }

            const dist = getDistance(startCity.coordinates, endCity.coordinates);
            const reward = Math.floor(dist * 2.5 + 500); // 2.5 EUR per km + base

            dispatch({
                type: 'ADD_CONTRACT',
                payload: {
                    id: `c-${Date.now()}-${i}`,
                    sourceCityId: startCity.id,
                    destCityId: endCity.id,
                    cargo: 'General Choice',
                    reward: reward,
                    distance: dist,
                    expiresAt: Date.now() + 1000 * 60 * 60 * 24 // 24 hours real time (fake)
                }
            });
        }
    };

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
                <h2 className="text-xl font-bold">Contracts</h2>
                <button
                    onClick={generateContracts}
                    className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                    <RefreshCw size={16} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                {contracts.length === 0 && (
                    <div className="text-center text-slate-500 mt-10">
                        <Package size={48} className="mx-auto mb-2 opacity-50" />
                        <p>No contracts available.</p>
                        <p className="text-xs">Click refresh to find jobs.</p>
                    </div>
                )}

                {contracts.map(contract => {
                    const sourceName = CITIES.find(c => c.id === contract.sourceCityId)?.name || contract.sourceCityId;
                    const destName = CITIES.find(c => c.id === contract.destCityId)?.name || contract.destCityId;
                    const bestOption = getBestAvailableTruck(contract);
                    const bestTruck = bestOption?.truck;

                    return (
                        <div key={contract.id} className="p-3 bg-slate-800/50 rounded border border-slate-700 hover:border-blue-500/50 transition-colors group">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-slate-300">GENERAL FREIGHT</span>
                                <span className="text-sm font-bold text-green-400">€ {contract.reward.toLocaleString()}</span>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-slate-200 mb-3">
                                <span className="w-1/3 truncate">{sourceName}</span>
                                <ArrowRight size={14} className="text-slate-500" />
                                <span className="w-1/3 truncate text-right">{destName}</span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500">{Math.floor(contract.distance)} km</span>
                                <button
                                    onClick={() => bestTruck && handleAssign(contract, bestTruck.id)}
                                    disabled={!bestTruck}
                                    className={`text-xs px-3 py-1.5 rounded flex items-center gap-1 font-medium transition-colors
                                        ${bestTruck
                                            ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                            : 'bg-slate-700 text-slate-500 cursor-not-allowed'}
                                    `}
                                >
                                    {bestOption && bestTruck ? (
                                        bestOption.dist < 5 ? 'Accept' : `Dispatch (${Math.floor(bestOption.dist)}km)`
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
