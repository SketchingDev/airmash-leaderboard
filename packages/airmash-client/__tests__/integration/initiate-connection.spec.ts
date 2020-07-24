import {AirMashConnection} from "../../src";
import {CLIENT_PACKETS, SERVER_PACKETS} from "@airbattle/protocol";
import waitForExpect from "wait-for-expect";
import {createSpySocketFactory} from "../createSpySocketFactory";
import {URL} from "url";

const tenSeconds = 10 * 1000;
jest.setTimeout(tenSeconds * 10);

describe("Initiates connection with host",() => {
    const playerName = "testing";
    const localServerUrl = new URL("ws://127.0.0.1:3501/ffa");

    let spySocketFactory: ReturnType<typeof createSpySocketFactory>;
    let airMashConnection: AirMashConnection;

    beforeEach(() => {
      spySocketFactory = createSpySocketFactory();
      airMashConnection = new AirMashConnection(spySocketFactory.factory);
    })

    afterEach(() => {
        airMashConnection.logout();
    });

    test("Login", async () => {
        await airMashConnection.login(localServerUrl, playerName);
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
            expect(backupSocket?.getMessagesFromClient()).toEqual(expect.arrayContaining([
                {
                    c: CLIENT_PACKETS.BACKUP,
                    token: expect.any(String)
                }
            ]));
            expect(backupSocket?.getMessagesFromServer()).toEqual(expect.arrayContaining([
                {
                    c: CLIENT_PACKETS.BACKUP,
                }
            ]));
        }, tenSeconds);
    });

    test("Responds to Pings with a Pong", async () => {
        await airMashConnection.login(localServerUrl, playerName);
        await waitForExpect(() => {
            const messagesFromServer = spySocketFactory.spies.primary?.getMessagesFromServer();
            expect(messagesFromServer).toEqual(expect.arrayContaining([
                {
                    c: SERVER_PACKETS.PING,
                    clock: expect.any(Number),
                    num: expect.any(Number)
                }
            ]));

            const numFromServer = messagesFromServer?.find(p => p.c ===SERVER_PACKETS.PING)?.num;
            expect(spySocketFactory.spies.primary?.getMessagesFromClient()).toEqual(expect.arrayContaining([
                {
                    c: CLIENT_PACKETS.PONG,
                    num: numFromServer
                }
            ]));
        });
    });
    //
    // test("Error connecting", async () => {
    //     const invalidUrl = new URL("ws://127.0.0.1:3501/*/!!!!");
    //     await airMashConnection.login(invalidUrl);
    //     await waitForExpect(() => {
    //         const messagesFromServer = spySocketFactory.spies.primary?.getMessagesFromServer();
    //         expect(messagesFromServer).toEqual(expect.arrayContaining([
    //             {
    //                 c: SERVER_PACKETS.PING,
    //                 clock: expect.any(Number),
    //                 num: expect.any(Number)
    //             }
    //         ]));
    //
    //         const numFromServer = messagesFromServer?.find(p => p.c ===SERVER_PACKETS.PING)?.num;
    //         expect(spySocketFactory.spies.primary?.getMessagesFromClient()).toEqual(expect.arrayContaining([
    //             {
    //                 c: CLIENT_PACKETS.PONG,
    //                 num: numFromServer
    //             }
    //         ]));
    //     });
    // });
})

