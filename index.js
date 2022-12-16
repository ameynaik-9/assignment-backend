const connectToMongo = require('./db');
const express = require('express')
var cors = require('cors')


connectToMongo();

const app = express()
const port = 5000

// middleware
app.use(cors())
app.use(express.json())
// app.get('/', (req, res) => {
//   res.send('Hello Amey!')
// })
app.get('/',(req,res)=>{
  res.send("Hiii")
})

// Available routes
app.use('/api/auth',require('./routes/auth'))
app.use('/api/notes',require('./routes/notes'))

app.listen(port, () => {
  console.log(`iNotebook listening at http://localhost:${port}`)
})