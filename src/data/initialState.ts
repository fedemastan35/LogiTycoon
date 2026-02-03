import { GameState, Truck } from '../types';
import { CITIES } from './cities';

export const INITIAL_GAME_STATE: GameState = {
    money: 50000,
    time: Date.now(), // Real time start, but we will decouple it in the loop
    paused: true,
    gameSpeed: 1,
    loans: [],
    // Company Details
    companyName: 'LogiCorp',
    hqLocation: '',
    foundedDate: '2/2/2026',
    reputation: 'Poor',
    reputationPoints: 0,
};

export const INITIAL_TRUCKS: Truck[] = [
    {
        id: 't-1',
        name: 'Volvo FH16',
        speed: 80,
        status: 'IDLE',
        location: CITIES[0].coordinates, // Start in London
        condition: 100,
    }
];
