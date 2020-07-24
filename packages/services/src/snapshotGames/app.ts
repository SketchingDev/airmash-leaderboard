import {extractGameStats} from "./extractGameStats";
import {AirMashConnection} from "@sketchingdev/airmash-client";
import {GameSnapshot, GameSnapshotRepository} from "../storage/GameSnapshotRepository";
import {GameUrl} from "../airmash/GameUrl";

export interface AppDependencies {
    airMashConnection: AirMashConnection;
    gameSnapshotRepository: GameSnapshotRepository;
    playerName: string;
}

export type SaveGame = (gameData: GameUrl[]) => Promise<void>;

export const app = (deps: AppDependencies): SaveGame => async (gameData: GameUrl[]) => {
    const games: GameSnapshot[] = [];

    for(const {url} of gameData) {
        console.log(`Trying ${url}`);
        try {
            const login = await deps.airMashConnection.partialLogin(url, deps.playerName);
            games.push(extractGameStats(url, login));
        } catch (error) {
            console.error("Failed to partially log into server", {url, error});
        }
    }

    await deps.gameSnapshotRepository.saveAll(games);
}
