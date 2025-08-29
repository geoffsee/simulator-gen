import graphqlHandler from "./graphql-handler.ts";

export default async function createGraphQLServer(serverConfig: { host: string; port: number; }) {
    console.log(`server listening on port: ${process.env.PORT || 3001}`)
    return Bun.serve({
        fetch: graphqlHandler.fetch,
        port: serverConfig.port,
        hostname: serverConfig.host
    })
}