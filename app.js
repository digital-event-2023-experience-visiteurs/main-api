import express from "express"
import logger from "morgan"
import cors from "cors"
import * as dotenv from "dotenv"
import fs from "fs"
import { z } from "zod"
// import { showsRouter } from "./routes/shows.js"

dotenv.config()
const app = express()
const port = process.env.API_PORT

app.use(cors())
app.use(logger("dev"))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get("/v1/", (req, res, next) => {
	res.send({ message: "ESD Paris Expvisit API v1.0" })
})

const userDataValidator = z.object({
	lastname: z.string().max(50),
	name: z.string().max(50),
	email: z.string().email(),
	time: z.string().refine((date) => {
		return !isNaN(new Date(date).getTime())
	}),
})

const schedulesFilePath = "./creneaux.json"

// a refactor
app.post("/v1/schedules/reserve", (req, res, next) => {
	const user = userDataValidator.safeParse(req.body)
	if (!user.success) {
		res.status(400).json({ issues: user })
		return
	}

	const schedules = JSON.parse(fs.readFileSync(schedulesFilePath))
	const scheduleIndex = schedules.findIndex(
		(schedule) =>
			new Date(schedule.date).getTime() ===
			new Date(user.data.time).getTime()
	)

	if (!schedules[scheduleIndex].available) {
		res.status(400).json({ message: "Schedule not available anymore." })
		return
	}

	schedules[scheduleIndex].available = false

	fs.writeFileSync(schedulesFilePath, JSON.stringify(schedules, null, 4))

	res.send({ reservedSchedule: schedules[scheduleIndex] })
})

// app.use("/v1/shows", showsRouter)

app.listen(port, () => console.log(`Listening on port ${port}`))
