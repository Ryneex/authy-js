import type TypeMongoose from "mongoose"
import { type Model } from "mongoose"
import { v4 } from "uuid"
import { ISession } from "@/types"

export default function getSessionModel(User: Model<any>, mongoose: typeof TypeMongoose): Model<ISession> {
    return (
        mongoose.models.Session ||
        mongoose.model(
            "Session",
            new mongoose.Schema({
                _id: {
                    type: String,
                    default: v4,
                },
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: User,
                    required: true,
                },
                expiresAt: Date,
            }),
        )
    )
}
