import React, {useEffect, useState} from 'react';
import '../App.css';
import {Container, Header, Icon, Image, Popup} from "semantic-ui-react";
import {useParams} from 'react-router-dom';
import {ApiClient, PlayerMetrics} from "../api/ApiClient";
import {formatDistanceToNow, subWeeks} from 'date-fns';
import {ResponsiveCalendar} from '@nivo/calendar'

const planes = {
    predator: '/planes/predator.png',
    goliath: '/planes/goliath.png',
    tornado: '/planes/tornado.png',
    prowler: '/planes/prowler.png',
    copter: '/planes/mohawk.png',
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
                <Container style={{height: 200}}>
                    <Image src={planes[playerMetrics.metrics.planeSeenTheMost || "prowler"]}
                           size='small'
                           circular centered={true}/>
                    <Header as='h2' icon textAlign='center'>
                        <Header.Content>{name}</Header.Content>
                    </Header>

                    <p>Level: {playerMetrics.metrics.level}</p>
                    <p>
                        <Popup trigger={<Icon name='question circle'/>}>
                            This is the when the bot last saw you. Is this is wrong then it's likely you weren't
                            in the game when the bot scanned it.
                        </Popup>
                        Last seen {formatDistanceToNow(new Date(playerMetrics.metrics.lastSeenOnline))} ago
                    </p>

                    <Header as='h3' textAlign={"left"}>Days seen</Header>
                    <ResponsiveCalendar
                        data={playerMetrics.metrics.daysSeenOnline.map(s => ({day: s.date, value: s.level}))}
                        from={subWeeks(new Date(), 2)}
                        to={new Date()}
                        emptyColor='#eeeeee'
                        colors={['#61cdbb', '#97e3d5', '#e8c1a0', '#f47560']}
                        margin={{top: 40, right: 40, bottom: 40, left: 40}}
                        minValue={0}
                        maxValue={60}
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
