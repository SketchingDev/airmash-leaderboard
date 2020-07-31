import axios from "axios";
import {URL, UrlWithStringQuery} from "url";
import {GameUrl} from "../../airmash/GameUrl";

const lineDelimiter = "\n";
const valueDelimiter = "|";
const secureSocketPrefix = "wss://";

const ignoreEmpty = (value: string) => value.trim().length > 0

const mapRow = (psv: string): GameUrl => {
    const [regionId, gameType, roomId, longName, shortName, host, path] = psv.split(valueDelimiter);
    return {
        regionId,
        gameType,
        roomId,
        name: {
            long: longName,
            short: shortName
        },
        url: new URL(`${secureSocketPrefix}${host}/${path}`)
    };
}

export const parseGamesFromRemoteFile = async (url: UrlWithStringQuery, client: Pick<typeof axios, 'get'> = axios): Promise<GameUrl[]> => {
    const {data} = await client.get<string>(url.href);
    return data.split(lineDelimiter).filter(ignoreEmpty).map(mapRow);
};
