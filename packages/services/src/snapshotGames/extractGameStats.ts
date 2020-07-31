import {ServerPackets} from "@airbattle/protocol";
import {GameType} from "../airmash/GameType";
import {URL} from "url";
import {GameSnapshot, Player} from "../storage/GameSnapshotRepository";
import {AirplaneType} from "../airmash/AirplaneType";
import {ServerGameType} from "@sketchingdev/airmash-client";

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

const convertAirplaneType = ({type}: ServerPackets.LoginPlayer): AirplaneType | undefined => {
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
            return undefined;
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
                airplaneType: convertAirplaneType(player)
            })
        );
}

export const extractGameStats = (url: URL, login: ServerPackets.Login): GameSnapshot => {
    return {
        url,
        timestamp: new Date(),
        players: convertPlayers(login),
        gameType: convertGameType(login)
    };
};


