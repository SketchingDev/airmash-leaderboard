import {AirMashConnection} from "@sketchingdev/airmash-client";
import {GameUrl} from "./airmash/GameUrl";
import {EventBridge} from "aws-sdk";
import {LoggedInEvent, transformLogin} from "./games/transformLogin";

export interface AppDependencies {
    eventBridge: EventBridge;
    airMashConnection: AirMashConnection;
    playerName: string;
    eventBusName: string;
    sourceName: string;
}

export type SaveGame = (gameData: GameUrl[]) => Promise<void>;

export const app = (deps: AppDependencies): SaveGame => async (gameData: GameUrl[]) => {
    const logins:LoggedInEvent[] = [];

    for(const {url} of gameData) {
        try {
            const login = await deps.airMashConnection.partialLogin(url, deps.playerName);
            logins.push(transformLogin(url, login));
            console.info("Login succeeded", {url: `${url}`, players: login.players?.map(p => p.name)});
        } catch (error) {
            console.warn("Login failed", {url: `${url}`, error: error.message});
        }
    }

    const params: EventBridge.Types.PutEventsRequest = {
        Entries: logins.map(l => ({
            EventBusName: deps.eventBusName,
            Source: deps.sourceName,
            DetailType: "login",
            Detail: JSON.stringify(l),
        }))
    };

    const result = await deps.eventBridge.putEvents(params).promise()
    console.log(result);
}
