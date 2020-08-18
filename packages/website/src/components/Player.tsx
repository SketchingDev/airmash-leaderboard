import React, {useEffect, useState} from 'react';
import '../App.css';
import {Container, Header, Image} from "semantic-ui-react";
import {useParams} from 'react-router-dom';
import {ApiClient, PlayerMetrics} from "../api/ApiClient";
import {formatDistanceToNow} from 'date-fns';
import {ResponsiveCalendar} from '@nivo/calendar'

const planes = {
    predator: '/planes/raptor.png',
    goliath: '/planes/goliath.png',
    tornado: '/planes/tornado.png',
    prowler: '/planes/prowler.png',
    copter: '/planes/tornado.png',
}

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
                <Container style={{ height: 200 }}>
                    <Header as='h2' icon textAlign='center'>
                        <Image src={planes[playerMetrics.metrics.planeSeenTheMost || "prowler"]} size='medium'
                               circular/>
                        <Header.Content>{name}</Header.Content>
                    </Header>

                    <p>Level: {playerMetrics.metrics.level}</p>
                    { /* TODO Move instantiating date to client */}
                    <p>Last seen {formatDistanceToNow(new Date(playerMetrics.metrics.lastSeenOnline))} ago</p>

                    <ResponsiveCalendar
                        data={[{day: "2020-03-02", value: 123}]}
                        from="2020-03-01"
                        to="2020-07-12"
                        emptyColor="#eeeeee"
                        colors={[ '#61cdbb', '#97e3d5', '#e8c1a0', '#f47560' ]}
                        margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
                        yearSpacing={40}
                        yearLegendOffset={14}
                        monthBorderColor="#ffffff"
                        dayBorderWidth={2}
                        dayBorderColor="#ffffff"
                    />
                </Container>
            </div>
        );
    }
}

export default Player;
