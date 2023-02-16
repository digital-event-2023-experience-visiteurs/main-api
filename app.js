import express from "express"
import logger from "morgan"
import cors from "cors"
import * as dotenv from "dotenv"
import schedulesRouter from "./routes/schedules.js"
import photoboothRouter from "./routes/photobooth.js"

dotenv.config()

const app = express()
const port = process.env.API_PORT

app.use(cors())
app.use(logger("dev"))
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ extended: true }))

app.get("/v1/", (req, res) => {
	res.send({ message: "ESD Paris Expvisit API v1.0" })
})

app.use("/v1/schedules", schedulesRouter)
app.use("/v1/photos", photoboothRouter)

app.listen(port, () => console.log(`Listening on port ${port}`))
