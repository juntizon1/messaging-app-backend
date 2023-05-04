import mongoose from 'mongoose'
const messagingSchema = mongoose.Schema({
    message:String,
    name:String,
    timestamp:String,
    received:Boolean,
    reactions:[({type:String})]
})
export default mongoose.model('messages',messagingSchema)
