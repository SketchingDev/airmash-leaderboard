import {AirMashConnection} from "@sketchingdev/airmash-client";
import {GameUrl} from "./airmash/GameUrl";
import {EventBridge} from "aws-sdk";
import {ServerPackets} from "@airbattle/protocol";
import {URL} from "url";

export interface AppDependencies {
    eventBridge: EventBridge;
    airMashConnection: AirMashConnection;
    playerName: string;
}

export type SaveGame = (gameData: GameUrl[]) => Promise<void>;

export const app = (deps: AppDependencies): SaveGame => async (gameData: GameUrl[]) => {
    const logins:{url: URL, login:ServerPackets.Login}[] = [];

    for(const {url} of gameData) {
        console.log(`Trying ${url}`);
        try {
            const login = await deps.airMashConnection.partialLogin(url, deps.playerName);
            logins.push({url, login});
        } catch (error) {
            console.error("Failed to partially log into server", {url, error});
        }
    }

    const params: EventBridge.Types.PutEventsRequest = {
        Entries: logins.map(l => ({
            EventBusName: "default",
            Source: "game-bot",
            DetailType: "login",
            Detail: JSON.stringify(l),
        }))
    };

    const result = await deps.eventBridge.putEvents(params).promise()
    console.log(result);
}
