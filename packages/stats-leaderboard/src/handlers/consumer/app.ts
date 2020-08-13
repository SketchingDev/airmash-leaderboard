import {GameSnapshotRepository} from "../../storage/GameSnapshotRepository";
import {LoggedInEvent} from "../../events/LoggedInEvent";
import {getWeek} from "date-fns";

export interface AppDependencies {
    gameSnapshotRepository: GameSnapshotRepository;
}

export type SaveLogin = (event: LoggedInEvent) => Promise<void>;

export const app = (deps: AppDependencies): SaveLogin => async (event: LoggedInEvent) => {
    for(const player of event.players) {
        await deps.gameSnapshotRepository.saveSnapshot({
            airplaneType: player.airplaneType,
            level: player.accountLevel || 0,
            playerName: player.name,
            snapshotTimestamp: new Date(event.timestamp).toISOString(),
            week: getWeek(event.timestamp)
        });
    }

}
