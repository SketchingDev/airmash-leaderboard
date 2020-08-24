import {GameSnapshotRepository} from "../../storage/GameSnapshotRepository";
import {LoggedInEvent, Player} from "../../events/LoggedInEvent";
import {getWeek} from "date-fns";

export interface AppDependencies {
    gameSnapshotRepository: GameSnapshotRepository;
}

export type SaveLogin = (event: LoggedInEvent) => Promise<void>;

const playerHasAccount = (player: Player) => player.accountLevel !== undefined;

export const app = (deps: AppDependencies): SaveLogin => async (event: LoggedInEvent) => {
    const loggedInPlayers = event.players.filter(playerHasAccount);

    for(const player of loggedInPlayers) {
        await deps.gameSnapshotRepository.saveSnapshot({
            airplaneType: player.airplaneType,
            level: player.accountLevel || 0,
            playerName: player.name,
            snapshotTimestamp: new Date(event.timestamp),
            week: getWeek(event.timestamp)
        });
    }

}
