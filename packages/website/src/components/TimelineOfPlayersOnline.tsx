import React, {useEffect, useState} from "react";
import {Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import {LeaderboardApiClient} from "../api/LeaderboardApiClient";
import {GamePlayerCount} from "../api/GamePlayerCount";

interface TimelineOfPlayersOnlineProps {
    gameUrl: string | null;
    client: LeaderboardApiClient
}

export const TimelineOfPlayersOnline = ({gameUrl, client}: TimelineOfPlayersOnlineProps) => {
    const [error, setError] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [gamePlayerCount, setGamePlayerCount] = useState<GamePlayerCount | null>(null);

    useEffect(() => {
        if (!gameUrl) {
            return;
        }
        client.playerCountTimeline(gameUrl)
            .then(
                (result) => {
                    setIsLoaded(true);
                    if (result.hasError) {
                        setError(result.error);
                    } else {
                        setGamePlayerCount(result.data);
                        setError(null);
                    }
                },
                // Note: it's important to handle errors here
                // instead of a catch() block so that we don't swallow
                // exceptions from actual bugs in components.
                (error) => {
                    setIsLoaded(true);
                    setError(error.message);
                }
            )
    }, [client, gameUrl]);

    if (!gameUrl) {
        return <div>Game URL not provided</div>;
    } else if (error) {
        return <div>Error: {error}</div>;
    } else if (!isLoaded) {
        return <div>Loading...</div>;
    } else {

        const data = gamePlayerCount?.playersTimeline.map(snapshot => {
            return {
                date: snapshot.timestamp,
                totalPlayers: snapshot.totalRealPlayers
            }
        });

        return (
            <ResponsiveContainer height={250}>
                <BarChart data={data} margin={{top: 5, right: 30, left: 20, bottom: 5}}>
                    <CartesianGrid strokeDasharray="3 3"/>
                    <XAxis name="Date" dataKey="date"/>
                    <YAxis/>
                    <Tooltip/>
                    <Bar name="Players Online" dataKey="totalPlayers" fill="#8884d8" />
                </BarChart>
            </ResponsiveContainer>
        );
    }
}
