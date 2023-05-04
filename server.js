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
// add reaction to message
app.post('/messages/:id/reactions', async (req, res) => {
    const messageId = req.params.id;
    const reaction = req.body.reaction;

    try {
        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).send('Message not found');
        }

        // Add reaction to message
        message.reactions.push(reaction);
        await message.save();

        res.status(200).send('Reaction added to message');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error adding reaction to message');
    }
});

// remove reaction from message
app.delete('/messages/:id/reactions/:reaction', async (req, res) => {
    const messageId = req.params.id;
    const reaction = req.params.reaction;

    try {
        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).send('Message not found');
        }

        // Remove reaction from message
        const index = message.reactions.indexOf(reaction);
        if (index !== -1) {
            message.reactions.splice(index, 1);
            await message.save();
        }

        res.status(200).send('Reaction removed from message');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error removing reaction from message');
    }
});

//Listener
app.listen(port,() => console.log(`Listening on localhost:${port}`))
