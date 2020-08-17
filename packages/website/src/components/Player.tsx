import React, {useEffect, useState} from 'react';
import '../App.css';
import {Container, Header, List} from "semantic-ui-react";
import {useParams} from 'react-router-dom';
import {ApiClient, PlayerMetrics} from "../api/ApiClient";
import {formatDistanceToNow} from 'date-fns'

export interface PlayerProps {
    client: ApiClient;
}

const Player = ({client}: PlayerProps) => {
    const {name} = useParams();
    const [error, setError] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [playerMetrics, setplayerMetrics] = useState<PlayerMetrics | null>(null);

    useEffect(() => {
        client.playerMetrics(name)
            .then(
                (result) => {
                    setIsLoaded(true);
                    if (result.hasError) {
                        setError(result.error);
                    } else {
                        setplayerMetrics(result.data);
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
    }, [client, name]);

    if (error) {
        return <div>Error: {error}</div>;
    } else if (!isLoaded) {
        return <div>Loading...</div>;
    } else if (!playerMetrics?.playerFound) {
        return <div>Player Not Found</div>;
    } else {
        return (
            <div className="App">
                <Container>
                    <Header as='h1'>{name}</Header>
                    <p>Level: {playerMetrics.metrics.level}</p>
                    { /* TODO Move instantiating date to client */}
                    <p>Last seen {formatDistanceToNow(new Date(playerMetrics.metrics.lastSeenOnline))} ago</p>
                    <p>{playerMetrics.metrics.planeSeenTheMost}</p>

                    <List ordered>
                        {playerMetrics.metrics.daysSeenOnline.map(d =>
                            <List.Item key={d}>{d}</List.Item>
                        )}
                    </List>
                </Container>
            </div>
        );
    }
}

export default Player;
