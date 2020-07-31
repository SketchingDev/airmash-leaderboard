import {AirMashConnection} from "../../src";
import {CLIENT_PACKETS} from "@airbattle/protocol";
import waitForExpect from "wait-for-expect";
import {createSpySocketFactory} from "../createSpySocketFactory";
import {URL} from "url";

const tenSeconds = 10 * 1000;
jest.setTimeout(tenSeconds * 10);

const playerName = "testing";
const localServerUrl = new URL("ws://127.0.0.1:3501/ffa");

test("Partial Login", async () => {
    const spySocketFactory = createSpySocketFactory();

    const login = await new AirMashConnection(spySocketFactory.factory).partialLogin(localServerUrl, playerName);
    expect(login).toMatchObject({
        room: "ab-ffa",
        success: true,
    });
    await waitForExpect(() => {
        const primarySocket = spySocketFactory.spies.primary;
        const backupSocket = spySocketFactory.spies.backup;
        expect(primarySocket?.getMessagesFromClient()).toEqual(expect.arrayContaining(
            [{
                c: CLIENT_PACKETS.LOGIN,
                flag: "GB",
                horizonX: 987,
                horizonY: 264,
                name: "testing",
                protocol: 5,
                session: "none",
            }]
        ));
        expect(backupSocket?.getMessagesFromClient()).toEqual(undefined);
    }, tenSeconds);
});

