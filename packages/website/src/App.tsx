import React from 'react';
import './App.css';
import {BrowserRouter as Router, Route, Switch} from "react-router-dom";
import Player from "./components/Player";
import Home from "./Home";
import {ApiClient} from "./api/ApiClient";

const client = new ApiClient(process.env.REACT_APP_API_ENDPOINT!);

const App = () => (
    <Router>
        <Switch>
            <Route path="/player/:name" children={<Player client={client} />}/>
            <Route path="/">
                <Home client={client}/>
            </Route>
        </Switch>
    </Router>
);

export default App;
