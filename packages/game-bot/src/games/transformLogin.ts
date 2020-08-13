import {ServerPackets} from "@airbattle/protocol";
import {URL} from "url";
import {ServerGameType} from "@sketchingdev/airmash-client";
import {GameType} from "../airmash/GameType";
import {AirplaneType} from "../airmash/AirplaneType";


const convertGameType = ({type}: ServerPackets.Login): GameType => {
    switch (type) {
        case ServerGameType.FreeForAll:
            return GameType.FreeForAll;
        case ServerGameType.CaptureTheFlag:
            return GameType.CaptureTheFlag;
        case ServerGameType.BattleRoyale:
            return GameType.BattleRoyale;
        case ServerGameType.Development:
            return GameType.Development;
        default:
            throw new Error(`Game type not recognised: type=${type}`);
    }
}

const convertAirplaneType = (type: number): AirplaneType => {
    switch (type) {
        case ServerGameType.Predator:
            return AirplaneType.Predator;
        case ServerGameType.Goliath:
            return AirplaneType.Goliath;
        case ServerGameType.Copter:
            return AirplaneType.Copter;
        case ServerGameType.Tornado:
            return AirplaneType.Tornado;
        case ServerGameType.Prowler:
            return AirplaneType.Prowler;
        default:
            throw new Error(`Airplane type not recognised: type=${type}`);
    }
}

const removeThisBot = (selfId: number | undefined) => (loginPlayer: ServerPackets.LoginPlayer): boolean => typeof selfId !== 'number' || loginPlayer.id !== selfId;
const removePlayersWithoutName = (loginPlayer: ServerPackets.LoginPlayer): boolean => typeof loginPlayer.name === 'string';
const removePlayersWithoutAirplaneType = (loginPlayer: ServerPackets.LoginPlayer): boolean => typeof loginPlayer.type === 'number';
const removeBots = (bots: ServerPackets.LoginBot[]) => (p: ServerPackets.LoginPlayer) => !bots.some(({id}) => id === p.id);

export const convertPlayers = (login: ServerPackets.Login): Player[] => {
    const players: ServerPackets.LoginPlayer[] = login.players || [];
    const bots: ServerPackets.LoginBot[] = login.bots || [];

    return players
        .filter(removeThisBot(login.id))
        .filter(removePlayersWithoutName)
        .filter(removePlayersWithoutAirplaneType)
        .filter(removeBots(bots))
        .map(player => ({
                name: player.name!,
                accountLevel: player.level,
                airplaneType: convertAirplaneType(player.type!)
            })
        );
}

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

export const transformLogin = (url: URL, login: ServerPackets.Login): LoggedInEvent => {
    return {
        url: url.toString(),
        gameType: convertGameType(login),
        timestamp: Date.now(),
        players: convertPlayers(login)
    };
};


