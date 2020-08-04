import {GameSnapshotRepository} from "../../storage/GameSnapshotRepository";
import {extractGameStats} from "./extractGameStats";
import {URL} from "url";
import {ServerPackets} from "@airbattle/protocol";

export interface AppDependencies {
    gameSnapshotRepository: GameSnapshotRepository;
}

export interface LoginEvent {
    url: URL;
    login:ServerPackets.Login;
}

export type SaveGame = (login: LoginEvent) => Promise<void>;

export const app = (deps: AppDependencies): SaveGame => async (login: LoginEvent) => {
    const gameStats = extractGameStats(login.url, login.login)
    await deps.gameSnapshotRepository.saveAll([gameStats]);
}
