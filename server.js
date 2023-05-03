import express from 'express'
import mongoose from 'mongoose'
import Messages from './dbMessages.js'
import Cors from 'cors'
import Pusher from 'pusher'

//app config

const app = express()
const port = process.env.PORT || 9000
const connection_url = 'mongodb+srv://admin:node@cluster.pthlgcw.mongodb.net/messaging_app?retryWrites=true&w=majority'
const pusher = new Pusher({
    appId: "1592687",
    key: "c9900507ed500401628a",
    secret: "5fa037822a5a73775ba9",
    cluster: "us3",
    useTLS: true
});


//Middleware
app.use(express.json())
app.use(Cors())
//DB Config
mongoose.connect(connection_url,{
    useNewUrlParser:true,
    useUnifiedTopology:true
})
//API Endpoints
const db = mongoose.connection
db.once("open", () =>{
    console.log("DB Connected")
    const msgCollection = db.collection("messages")
    const changeStream = msgCollection.watch()
    changeStream.on('change',change =>{
        console.log(change)
        if(change.operationType=="insert"){
            const messageDetails = change.fullDocument
            pusher.trigger("messages", "inserted",{
                name:messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received:messageDetails.received
            })

        }else{
            console.log('Error Triggering Pusher')
        }
    })
})
app.get("/", (req,res) => res.status(200).send("helloTheWebDev"))
app.post('/messages/new', async (req,res) => {
    const dbMessage = req.body;
    try {
        const createdMessage = await Messages.create(dbMessage);
        res.status(201).send(createdMessage);
    } catch (err) {
        res.status(500).send(err);
    }
});
app.get('/messages/sync', async (req,res) => {
    try {
        const messages = await Messages.find();
        res.status(200).send(messages);
    } catch (err) {
        res.status(500).send(err);
    }
});

//Listener
app.listen(port,() => console.log(`Listening on localhost:${port}`))
