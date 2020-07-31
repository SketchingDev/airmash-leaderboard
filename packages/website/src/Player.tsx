import React from 'react';
import './App.css';
import {Container, Header} from "semantic-ui-react";
import { useParams } from 'react-router-dom';

const Player = () => {
    let { name } = useParams();

    return (
        <div className="App">
            <Container>
                <Header as='h1'>{name}</Header>
            </Container>
        </div>
    );
}

export default Player;
