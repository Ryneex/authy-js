export { MongodbAdapter } from "./adapters/mongodb"
export { RedisAdapter } from "./adapters/redis"
import { auth as ExpressAuth } from "./handlers/express"

export default { express: ExpressAuth }
