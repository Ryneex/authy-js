export { MongoDBAdapter } from "./adapters/mongodb"
export { RedisAdapter } from "./adapters/redis"
import { ExpressHandler } from "./handlers/express"

export default { express: ExpressHandler }
