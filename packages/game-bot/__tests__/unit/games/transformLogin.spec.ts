import {ServerPackets} from "@airbattle/protocol";
import {transformLogin} from "../../../src/games/transformLogin";
import {URL} from "url";

test("Login containing player is transformed", () => {
    const url = new URL("ws://test.test");
   const login: ServerPackets.Login = {
           bots: [],
           c: 0,
           clock: 0,
           id: 12,
           players: [
               {
                   flag: 97,
                   id: 222,
                   level: 0,
                   name: "player-name-here",
                   posX: 0,
                   posY: 0,
                   rot: 0,
                   status: 0,
                   team: 123,
                   type: 1,
                   upgrades: 8,
               },
           ],
           room: "ab-ffa",
           serverConfiguration: JSON.stringify({sf: 5500, botsNamePrefix: ""}),
           success: true,
           team: 123,
           token: "test-token",
           type: 1,
   };

   const loggedInEvent = transformLogin(url, login);
   expect(loggedInEvent).toStrictEqual({
       gameType: "free-for-all",
       players: [
           {
               name: "player-name-here",
               accountLevel: 0,
               airplaneType: "predator"
           }
       ],
       timestamp: expect.any(Number),
       url: "ws://test.test/"
   });
});
