import React from 'react';
import './App.css';
import {BrowserRouter as Router, Link, Route, Switch} from "react-router-dom";
import Player from "./components/Player";
import Home from "./Home";
import {ApiClient} from "./api/ApiClient";
import {Container, Header} from "semantic-ui-react";

const client = new ApiClient(process.env.REACT_APP_API_ENDPOINT!);

const App = () => (
    <Router>
        <Container>
            <Header textAlign={"center"} as='h1'>
                <Link to="/">AIRMASH<br/>Leaderboard</Link>
            </Header>

            <Switch>
                <Route path="/player/:name" children={<Player client={client}/>}/>
                <Route path="/">
                    <Home client={client}/>
                </Route>
            </Switch>
        </Container>
    </Router>
);

export default App;
