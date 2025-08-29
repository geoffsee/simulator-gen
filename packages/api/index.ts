import createGraphQLServer from "./src/graphql-server.ts";

const serverConfig = {
    host: "127.0.0.1",
    port: 3001,
}

createGraphQLServer(serverConfig).catch(err => console.log(err));
