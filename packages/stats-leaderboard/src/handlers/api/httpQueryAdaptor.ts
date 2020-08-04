import {APIGatewayProxyHandler, APIGatewayProxyResult} from "aws-lambda";

export interface AdaptorDependencies {
    corsOrigin: string;
}

export type QueryHandler = (parameters: {[p: string]: string}) => Promise<any>;

export const httpQueryAdaptor = (next: QueryHandler, {corsOrigin}: AdaptorDependencies): APIGatewayProxyHandler =>
    async (event): Promise<APIGatewayProxyResult> => {
        const corsHeaders = {
            'Access-Control-Allow-Origin': corsOrigin,
            'Access-Control-Allow-Credentials': true,
        };

        let response: any;
        try {
            response = await next( event.pathParameters || {});
        } catch (error) {
            console.error("App failure", {error, event});
            return {
                statusCode: 500,
                headers: corsHeaders,
                body: JSON.stringify({hasError: true, error: "There was an error processing the request"}),
            }
        }

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({hasError: false, data: response}),
        }
    }
