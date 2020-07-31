import {AirMashConnection} from "../src";
import {ConnectionEventTypes} from "../src";
import {SERVER_PACKETS} from "@airbattle/protocol";
import WebSocket from "ws";

const describeMessage = (serverMessage: {message: {c: number}}): string => {
    const schema = Object.entries(SERVER_PACKETS).find(([,value]) => (value === serverMessage.message.c));
    return `${schema ? schema[0] : "UNKNOWN"}: ${JSON.stringify(serverMessage.message, null, 0)}`
}

const airMashConnection = new AirMashConnection(() => new WebSocket("ws://127.0.0.1:3501/"));
airMashConnection.login("ffa", "client-example").then(() => {
    airMashConnection.readableEvents.addListener(ConnectionEventTypes.MESSAGE, (event: any) => {
        console.log(describeMessage(event));
    });
    airMashConnection.readableEvents.addListener(ConnectionEventTypes.ERROR, (event: any) => {
        console.log(describeMessage(event));
    });
});
