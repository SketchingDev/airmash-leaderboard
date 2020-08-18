import {GameSnapshotRepository, PlayerSnapshot} from "../../../storage/GameSnapshotRepository";
import {format, max} from "date-fns";

export interface PlayerMetricsDependencies {
    gameSnapshotRepository: GameSnapshotRepository;
}

export interface PlayerMetricsNotFound {
    playerFound: false;
}

export interface PlayerMetricsFound {
    playerFound: true;
    metrics: {
        name: string;
        level: number;
        lastSeenOnline: Date;
        daysSeenOnline: string[];
        planeSeenTheMost: PlayerSnapshot["airplaneType"] | undefined;
    }
}

export type PlayerMetrics = PlayerMetricsFound | PlayerMetricsNotFound;


const mode = (planes: PlayerSnapshot["airplaneType"][]) =>
    planes.sort((a, b) =>
        planes.filter(v => v === a).length
        - planes.filter(v => v === b).length
    ).pop()

export type Player = (parameters: { [p: string]: string }) => Promise<PlayerMetrics>;


const daysSeenOnline = (snapshots: PlayerSnapshot[]) => {
    const dates = snapshots.map(s => format(
        new Date(s.snapshotTimestamp),
        'dd/MM/yyyy'
    ));

    return Array.from(new Set(dates))
}

const currentLevel = (snapshots: PlayerSnapshot[]) =>
     snapshots.reduce((prev, current) => (prev.level > current.level) ? prev : current).level;

const lastSeenOnline = (snapshots: PlayerSnapshot[]) => max(snapshots.map(s => new Date(s.snapshotTimestamp)));
const planeSeenTheMost = (snapshots: PlayerSnapshot[]) => mode(snapshots.map(s => s.airplaneType));


export const player = ({gameSnapshotRepository}: PlayerMetricsDependencies): Player =>
    async (parameters: { [p: string]: string }): Promise<PlayerMetrics> => {
        if (parameters.playerName === undefined) {
            throw new Error("playerName not defined");
        }

        const playerName = decodeURIComponent(parameters.playerName);
        const snapshots = await gameSnapshotRepository.findPlayerSnapshotsByName(playerName);
        if (snapshots.length === 0) {
            return {playerFound: false};
        }

        return {
            playerFound: true,
            metrics: {
                name: playerName,
                level: currentLevel(snapshots),
                lastSeenOnline: lastSeenOnline(snapshots),
                daysSeenOnline: daysSeenOnline(snapshots),
                planeSeenTheMost: planeSeenTheMost(snapshots)
            }
        }
    };
