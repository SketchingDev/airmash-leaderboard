import {LoggedInEvent} from "./events/LoggedInEvent";
import {EventBridge} from "aws-sdk";

interface BadWordsFilter {
    isProfane(text: string): boolean;
}

export interface AppDependencies {
    badWordFilter: BadWordsFilter;
    eventBridge: EventBridge;
    logger: Pick<Console, 'info'>;
}

export type FilterPlayers = (event: LoggedInEvent) => Promise<void>;

export const app = (deps: AppDependencies): FilterPlayers => async (event: LoggedInEvent) => {
    event.players
        .filter(p => deps.badWordFilter.isProfane(p.name))
        .forEach(p => deps.logger.info(`Player filtered`, {name: p.name}));

    const sanitisedEvent = {
        ...event,
        sanitised: true,
        players: event.players.filter(p => !deps.badWordFilter.isProfane(p.name))
    }

    await deps.eventBridge.putEvents({
        Entries: [{
            EventBusName: "default",
            Source: "profanity-filter",
            DetailType: "login",
            Detail: JSON.stringify(sanitisedEvent),
        }]
    }).promise();
}
