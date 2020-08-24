import React from 'react';
import './App.css';
import {Leaderboard} from "./components/Leaderboard";
import {ApiClient} from "./api/ApiClient";

export interface HomeProps {
    client: ApiClient;
}

const Home = ({client}: HomeProps) => {
    return (
        <div>
            <Leaderboard client={client}/>
        </div>
    );
}

export default Home;
