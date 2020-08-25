export interface Player {
    name: string;
    accountLevel?: number;
    airplaneType: 'predator' | 'goliath' | 'copter' | 'tornado' | 'prowler';
}

export interface LoggedInEvent {
    url: string;
    timestamp: number;
    gameType: 'free-for-all' | 'capture-the-flag' | 'battle-royale' | 'development';
    players: Player[];
}
