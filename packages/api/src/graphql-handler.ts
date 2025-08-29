import {createYoga} from "graphql-yoga";
import graphqlSchema from "./graphql-schema.ts";

export default createYoga({
    schema: graphqlSchema
})
