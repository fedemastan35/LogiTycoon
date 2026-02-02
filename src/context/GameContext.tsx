import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { GameState, Truck, Contract } from '../types';
import { INITIAL_GAME_STATE, INITIAL_TRUCKS } from '../data/initialState';
import { CITIES } from '../data/cities';

interface State {
    game: GameState;
    trucks: Truck[];
    contracts: Contract[]; // Available
    activeContracts: Contract[]; // Assigned
}

type Action =
    | { type: 'TICK'; payload: { deltaTime: number } }
    | { type: 'TOGGLE_PAUSE' }
    | { type: 'SET_SPEED'; payload: number }
    | { type: 'ADD_CONTRACT'; payload: Contract }
    | { type: 'BUY_TRUCK'; payload: Truck }
    | { type: 'ASSIGN_JOB'; payload: { truckId: string; contract: Contract } }
    | { type: 'ROUTE_PLANNED'; payload: { truckId: string; routePath: import('../types').Coordinates[]; pendingRoutePath?: import('../types').Coordinates[] } }
    | { type: 'TAKE_LOAN'; payload: number }
    | { type: 'REPAY_LOAN'; payload: string };

const initialState: State = {
    game: INITIAL_GAME_STATE,
    trucks: INITIAL_TRUCKS,
    contracts: [],
    activeContracts: [],
};

function getDistance(c1: { lat: number, lng: number }, c2: { lat: number, lng: number }) {
    const R = 6371;
    const dLat = (c2.lat - c1.lat) * (Math.PI / 180);
    const dLon = (c2.lng - c1.lng) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(c1.lat * (Math.PI / 180)) * Math.cos(c2.lat * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function lerp(start: number, end: number, t: number) {
    return start + (end - start) * t;
}

function gameReducer(state: State, action: Action): State {
    switch (action.type) {
        case 'TOGGLE_PAUSE':
            return { ...state, game: { ...state.game, paused: !state.game.paused } };
        case 'SET_SPEED':
            return { ...state, game: { ...state.game, gameSpeed: action.payload } };

        case 'TICK': {
            if (state.game.paused) return state;

            const timeAdvance = action.payload.deltaTime * 60 * 1000 * state.game.gameSpeed;
            const newTime = state.game.time + timeAdvance;
            let moneyEarned = 0;
            let moneySpent = 0;
            let completedContracts: string[] = [];

            // Check for daily loan payments (Every 24h = 86400000ms)
            // We need to track the last payment time.
            const lastInfluenceTime = state.game.lastInfluenceTime || state.game.time;
            let newLastInfluenceTime = lastInfluenceTime;

            if (newTime - lastInfluenceTime >= 86400000) {
                // A day passed
                newLastInfluenceTime = newTime;
                // Calculate loan interest/payments
                state.game.loans.forEach(loan => {
                    const payment = loan.dailyPayment;
                    moneySpent += payment;
                    // Check if loan is paid off?
                    // Ideally we reduce remainingAmount, but for simplicity let's just deduct interest.
                    // Or let's make it simple: Daily interest only.
                });
            }

            const newTrucks = state.trucks.map(truck => {
                if ((truck.status !== 'MOVING' && truck.status !== 'MOVING_TO_SOURCE') || !truck.routePath || truck.routePath.length === 0) return truck;

                const hoursPassed = timeAdvance / 3600000;
                let distToMove = truck.speed * hoursPassed; // Distance we can travel this tick

                let nextTruck = { ...truck };
                let currentIndex = truck.routeIndex || 0;
                let currentPos = truck.location;

                // Move along the path points
                while (distToMove > 0 && currentIndex < truck.routePath.length) {
                    const target = truck.routePath[currentIndex];
                    const distToTarget = getDistance(currentPos, target);

                    if (distToMove >= distToTarget) {
                        // Reached this point, move to next
                        distToMove -= distToTarget;
                        currentPos = target;
                        currentIndex++;
                    } else {
                        // Move partial distance towards target
                        const ratio = distToMove / distToTarget;
                        const newLat = lerp(currentPos.lat, target.lat, ratio);
                        const newLng = lerp(currentPos.lng, target.lng, ratio);
                        currentPos = { lat: newLat, lng: newLng };
                        distToMove = 0;
                    }
                }

                nextTruck.location = currentPos;
                nextTruck.routeIndex = currentIndex;

                // Check if arrived at end of path
                if (currentIndex >= truck.routePath.length) {
                    // Arrived
                    if (truck.status === 'MOVING_TO_SOURCE') {
                        // Arrived at source, now start the actual job
                        const contract = state.activeContracts.find(c => c.id === truck.currentContractId);
                        if (contract) {
                            const destCity = CITIES.find(c => c.id === contract.destCityId);
                            return {
                                ...nextTruck,
                                status: 'MOVING' as const,
                                location: truck.destination || truck.location,
                                destination: destCity?.coordinates,
                                routePath: truck.pendingRoutePath || [],
                                pendingRoutePath: undefined,
                                routeIndex: 0
                            };
                        }
                    }

                    // Arrived at destination (Job Complete)
                    if (truck.currentContractId) {
                        const contract = state.activeContracts.find(c => c.id === truck.currentContractId);
                        if (contract) {
                            moneyEarned += contract.reward;
                            completedContracts.push(contract.id);
                        }
                    }

                    return {
                        ...nextTruck,
                        status: 'IDLE' as const,
                        location: nextTruck.location,
                        destination: undefined,
                        currentContractId: undefined,
                        routePath: undefined,
                        routeIndex: 0
                    };
                }

                return nextTruck;
            });

            return {
                ...state,
                game: {
                    ...state.game,
                    time: newTime,
                    money: state.game.money + moneyEarned - moneySpent,
                    lastInfluenceTime: newLastInfluenceTime
                },
                trucks: newTrucks,
                activeContracts: state.activeContracts.filter(c => !completedContracts.includes(c.id))
            };
        }

        case 'ADD_CONTRACT':
            return { ...state, contracts: [...state.contracts, action.payload] };

        case 'BUY_TRUCK':
            return {
                ...state,
                trucks: [...state.trucks, action.payload],
                game: { ...state.game, money: state.game.money - 50000 }
            };

        case 'ASSIGN_JOB': {
            const { truckId, contract } = action.payload;
            const sourceCity = CITIES.find(c => c.id === contract.sourceCityId);
            const destCity = CITIES.find(c => c.id === contract.destCityId);

            if (!sourceCity || !destCity) return state;

            return {
                ...state,
                activeContracts: [...state.activeContracts, contract],
                contracts: state.contracts.filter(c => c.id !== contract.id),
                trucks: state.trucks.map(t => {
                    if (t.id === truckId) {
                        // Initial setup - wait for route
                        return {
                            ...t,
                            currentContractId: contract.id
                        };
                    }
                    return t;
                })
            };
        }

        case 'ROUTE_PLANNED': {
            const { truckId, routePath, pendingRoutePath } = action.payload;
            const truck = state.trucks.find(t => t.id === truckId);
            if (!truck) return state;

            const contract = state.activeContracts.find(c => c.id === truck.currentContractId);
            if (!contract) return state;

            const sourceCity = CITIES.find(c => c.id === contract.sourceCityId);
            const destCity = CITIES.find(c => c.id === contract.destCityId);
            if (!sourceCity || !destCity) return state;

            const distToSource = getDistance(truck.location, sourceCity.coordinates);
            const isAtSource = distToSource < 5;

            return {
                ...state,
                trucks: state.trucks.map(t => {
                    if (t.id === truckId) {
                        return {
                            ...t,
                            status: isAtSource ? 'MOVING' : 'MOVING_TO_SOURCE',
                            destination: isAtSource ? destCity.coordinates : sourceCity.coordinates,
                            routePath: routePath,
                            pendingRoutePath: pendingRoutePath,
                            routeIndex: 0
                        };
                    }
                    return t;
                })
            };
        }

        case 'TAKE_LOAN': {
            const amount = action.payload;
            const interestRate = 0.01; // 1% daily interest
            const dailyPayment = amount * interestRate;
            const newLoan: import('../types').Loan = {
                id: `l-${Date.now()}`,
                amount,
                interestRate,
                dailyPayment,
                remainingAmount: amount
            };

            return {
                ...state,
                game: {
                    ...state.game,
                    money: state.game.money + amount,
                    loans: [...state.game.loans, newLoan]
                }
            };
        }

        case 'REPAY_LOAN': {
            const loanId = action.payload;
            const loan = state.game.loans.find(l => l.id === loanId);
            if (!loan || state.game.money < loan.amount) return state;

            return {
                ...state,
                game: {
                    ...state.game,
                    money: state.game.money - loan.amount, // Pay full amount for now
                    loans: state.game.loans.filter(l => l.id !== loanId)
                }
            };
        }

        default:
            return state;
    }
}

const GameContext = createContext<{
    state: State;
    dispatch: React.Dispatch<Action>;
} | null>(null);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(gameReducer, initialState);

    useEffect(() => {
        let lastTime = performance.now();
        let frameId: number;

        const loop = (time: number) => {
            const dt = (time - lastTime) / 1000;
            lastTime = time;

            dispatch({ type: 'TICK', payload: { deltaTime: dt } });
            frameId = requestAnimationFrame(loop);
        };

        frameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(frameId);
    }, []);

    return (
        <GameContext.Provider value={{ state, dispatch }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) throw new Error('useGame must be used within GameProvider');
    return context;
};
