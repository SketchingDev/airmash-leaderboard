import {LoggedInEvent} from "./events/LoggedInEvent";
import {EventBridge} from "aws-sdk";

interface BadWordsFilter {
    isProfane(text: string): boolean;
    clean(text: string): string;
}

export interface AppDependencies {
    badWordFilter: BadWordsFilter;
    eventBridge: EventBridge;
    eventBusName: string;
    sourceName: string;
    logger: Pick<Console, 'info'>;
}

export type FilterPlayers = (event: LoggedInEvent) => Promise<void>;

export const app = (deps: AppDependencies): FilterPlayers => async (event: LoggedInEvent) => {
    event.players
        .filter(p => deps.badWordFilter.isProfane(p.name))
        .forEach(p => deps.logger.info('Player filtered', {
            name: p.name,
            cleaned: deps.badWordFilter.clean(p.name)
        }));

    const sanitisedEvent = {
        ...event,
        players: event.players.filter(p => !deps.badWordFilter.isProfane(p.name))
    }

    await deps.eventBridge.putEvents({
        Entries: [{
            EventBusName: deps.eventBusName,
            Source: deps.sourceName,
            DetailType: "login",
            Detail: JSON.stringify(sanitisedEvent),
        }]
    }).promise();
}
