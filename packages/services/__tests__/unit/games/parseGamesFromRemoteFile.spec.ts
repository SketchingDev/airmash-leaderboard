import {parseGamesFromRemoteFile} from "../../../src/snapshotGames/games/parseGamesFromRemoteFile";
import {URL} from "url";

const testGameData = `
eu|1|ffa1|Free For All #1|FFA #1|eu.airmash.online|ffa1
eu|1|ffa2|Free For All #2|FFA #2|eu.airmash.online|ffa2`;

test("games parsed", async () => {
    const client = {
        get: jest.fn().mockResolvedValue({data: testGameData})
    }

    const games = await parseGamesFromRemoteFile("http://test.test", client);

    expect(client.get).toHaveBeenCalledWith("http://test.test");
    expect(games).toStrictEqual([
        {
            gameType: "1",
            name: {
                long: "Free For All #1",
                short: "FFA #1"
            },
            regionId: "eu",
            roomId: "ffa1",
            url: new URL("wss://eu.airmash.online/ffa1"),
        },
        {
            gameType: "1",
            name: {
                long: "Free For All #2",
                short: "FFA #2"
            },
            regionId: "eu",
            roomId: "ffa2",
            url: new URL("wss://eu.airmash.online/ffa2")
        }
    ]);
});
