import {Dropdown} from "semantic-ui-react";
import React from "react";
import {DropdownProps} from "semantic-ui-react/dist/commonjs/modules/Dropdown/Dropdown";

const gameOptions = [
    {key: "all", text: "Across all game servers", value: ""}
];
gameOptions.push(...[
    "wss://eu.airmash.online/ffa1",
    "wss://eu.airmash.online/ffa2",
    "wss://dev.airbattle.xyz/ctf",
    "wss://eu.airmash.online/btr1",
    "wss://game.airmash.cc/ffa",
    "wss://airmash.trackjunkies.org/ffa1",
    "wss://game.airmash.cc/ctf",
    "wss://us.airmash.online/btr1",
    "wss://game.airmash.cc/dev"
].map(s => ({key: s, text: s, value: s})));

export const GamesDropdown = ({onChange}: {onChange: (data: DropdownProps) => void}) =>
    (<Dropdown
    className='icon'
    icon='filter'
    floating
    labeled
    button
    onChange={(_, data) => onChange(data)}
    selection
    options={gameOptions}
/>)
