import {SaveGame} from "../app";
import {GameUrl} from "../airmash/GameUrl";

export interface AdaptorDependencies {
    gameDataLoader: () => Promise<GameUrl[]>;
}

export const gameDataAdaptor = (next: SaveGame, {gameDataLoader}: AdaptorDependencies) => async () => {
    const gameData: GameUrl[] = [];

    try {
        gameData.push(...await gameDataLoader());
    } catch (error) {
        console.error("Error retrieving game data", {error});
        throw new Error("Error retrieving game data");
    }

    await next(gameData);
}
