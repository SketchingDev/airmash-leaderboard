import React, {useEffect, useState} from "react";
import {Table} from "semantic-ui-react";
import {Link} from "react-router-dom";
import {ApiClient, PlayerLeaderboard} from "../api/ApiClient";

interface LeaderboardProps {
    client: ApiClient;
}

export const Leaderboard = ({client}: LeaderboardProps) => {
    const [error, setError] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [leaderboard, setLeaderboard] = useState<PlayerLeaderboard | null>(null);

    useEffect(() => {
        client.leaderboard()
            .then(
                (result) => {
                    setIsLoaded(true);
                    if (result.hasError) {
                        setError(result.error);
                    } else {
                        setLeaderboard(result.data);
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
    }, [client]);

    if (error) {
        return <div>Error: {error}</div>;
    } else if (!isLoaded) {
        return <div>Loading...</div>;
    } else {
        return (
            <Table celled inverted>
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell>Name</Table.HeaderCell>
                        <Table.HeaderCell>Level</Table.HeaderCell>
                    </Table.Row>
                </Table.Header>

                <Table.Body>
                    {leaderboard?.players.map(player => (
                        <Table.Row key={player.name}>
                            <Table.Cell><Link to={`player/${player.name}`}>{player.name}</Link></Table.Cell>
                            <Table.Cell>{player.level}</Table.Cell>
                        </Table.Row>)
                    )}
                </Table.Body>
            </Table>);
    }
}
