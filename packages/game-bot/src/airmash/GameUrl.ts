import {URL} from "url";

export interface GameUrl {
    regionId: string,
    gameType: string,
    roomId: string,
    name: {long: string, short: string}
    url: URL
}
