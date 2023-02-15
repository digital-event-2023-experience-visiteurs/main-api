import fs from "fs"
import { z } from "zod"
import Airtable from "airtable"
import express from "express"
import * as dotenv from "dotenv"

dotenv.config()

const base = new Airtable({ apiKey: process.env.AIRTABLE_TOKEN }).base(process.env.AIRTABLE_BASE)
const schedulesRouter = express.Router()

const userDataValidator = z.object({
	lastname: z.string().max(50),
	name: z.string().max(50),
	email: z.string().email(),
	schedules: z.array(
		z.object({
			id: z.string(),
			datetime: z.string().refine((date) => {
				return !isNaN(new Date(date).getTime())
			}),
		})
	),
})

const schedulesIdNamesRelation = {
	drone: "Atelier drone",
	escapeGame: "Atelier Escape Game",
}

const schedulesFilePath = "./creneaux.json"

function getSchedule(schedules, datetime) {
	if (schedules == undefined) return undefined

	return schedules.find(
		(schedule) => new Date(schedule.datetime).getTime() === new Date(datetime).getTime()
	)
}

function setScheduleAvailability(schedule) {
	if (!schedule?.available) return false
	schedule.available = false
}

function parseValidatedSchedules(schedules) {
	const parsedSchedules = {}
	schedules.forEach((schedule) => {
		parsedSchedules[schedulesIdNamesRelation[schedule.id]] = new Date(schedule.datetime)
	})
	return parsedSchedules
}

async function pushNewEntryToAirtable(userData) {
	await base("Table 1")
		.create({
			Email: userData.email,
			Nom: userData.lastname,
			Prenom: userData.name,
			...parseValidatedSchedules(userData.schedules),
		})
		.catch((error) => console.error(error))
}

function reserveSchedule(scheduleData) {
	const schedules = JSON.parse(fs.readFileSync(schedulesFilePath))

	const targetSchedule = getSchedule(schedules[scheduleData.id], scheduleData.datetime)
	if (targetSchedule == undefined) {
		return {
			success: false,
			message: `Schedule "${scheduleData.datetime} ${scheduleData.id}" does not exist.`,
		}
	}

	const err = setScheduleAvailability(targetSchedule)
	if (err !== undefined) {
		return {
			success: false,
			message:
				`Schedule ${new Date(scheduleData.datetime)}` +
				`(${scheduleData.id}) is not available.`,
		}
	}

	fs.writeFileSync(schedulesFilePath, JSON.stringify(schedules, null, 4))

	return { success: true }
}

schedulesRouter.get("/", async (req, res) => {
	const schedules = JSON.parse(fs.readFileSync(schedulesFilePath))
	res.send(schedules)
})

schedulesRouter.post("/reserve", async (req, res) => {
	const user = userDataValidator.safeParse(req.body)
	if (!user.success) {
		res.status(400).json({ issues: user })
		return
	}

	const successfullyReservedSchedules = []
	let finalMessage = "Schedules successfully reserved!"

	for (const schedule of user.data.schedules) {
		const result = reserveSchedule(schedule)
		if (!result.success) {
			finalMessage = result.message
			break
		}
		successfullyReservedSchedules.push(schedule)
	}

	await pushNewEntryToAirtable({
		email: user.data.email,
		lastname: user.data.lastname,
		name: user.data.name,
		schedules: successfullyReservedSchedules,
	})

	res.send({
		message: finalMessage,
		successfullyReservedSchedules,
	})
})

export default schedulesRouter
