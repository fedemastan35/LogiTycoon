export interface Coordinates {
    lat: number;
    lng: number;
}

export interface City {
    id: string;
    name: string;
    coordinates: Coordinates;
}

export type TruckStatus = 'IDLE' | 'MOVING' | 'MOVING_TO_SOURCE' | 'MAINTENANCE';

export interface Truck {
    id: string;
    name: string;
    speed: number; // km/h
    status: TruckStatus;
    location: Coordinates; // Current location (interpolated)
    destination?: Coordinates; // Final destination
    currentContractId?: string;

    // Routing
    routePath?: Coordinates[]; // Series of points to follow
    routeIndex?: number; // Current target index in path
    pendingRoutePath?: Coordinates[]; // For the next leg (e.g. Cargo run after deadhead)
    driverId?: string;
    condition: number; // 0-100
}

export interface Driver {
    id: string;
    name: string;
    salary: number; // Daily salary
    skill: number; // 1-5, affects fuel efficiency and speed?
    status: 'IDLE' | 'ASSIGNED';
    assignedTruckId?: string;
}

export interface Contract {
    id: string;
    sourceCityId: string;
    destCityId: string;
    cargo: string;
    reward: number;
    distance: number; // km
    expiresAt: number; // Game timestamp
}

export interface Loan {
    id: string;
    amount: number;
    interestRate: number; // e.g. 0.05 for 5%
    dailyPayment: number;
    remainingAmount: number;
}

export interface GameState {
    money: number;
    time: number; // Unix timestamp or game ticks
    paused: boolean;
    gameSpeed: number; // 1x, 10x, etc.
    loans: Loan[];
    lastInfluenceTime?: number; // Track daily updates
    // Company Details
    companyName: string;
    hqLocation: string;
    foundedDate: string;
    reputation: 'Poor' | 'Small' | 'Good' | 'Excellent' | 'Elite';
    reputationPoints: number;
}
