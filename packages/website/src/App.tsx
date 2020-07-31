import React from 'react';
import './App.css';
import {BrowserRouter as Router, Route, Switch} from "react-router-dom";
import Player from "./Player";
import Home from "./Home";

const App = () => (
    <Router>
        <Switch>
            <Route path="/player/:name" children={<Player/>}/>
            <Route path="/">
                <Home/>
            </Route>
        </Switch>
    </Router>
);

export default App;
