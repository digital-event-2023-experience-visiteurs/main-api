import express from "express"
import fs from "fs"
import { v4 as uuidv4 } from "uuid"

const photoboothRouter = express.Router()

photoboothRouter.post("/", async (req, res, next) => {
	const imgName = uuidv4()

	const data = req.body.data
	const parsedData = data.replace(/^data:image\/\w+;base64,/, "")
	const buffer = Buffer.from(parsedData, "base64")

	fs.writeFileSync(`./imgs/${imgName}.png`, buffer)

	res.send({ imgName })
})

export default photoboothRouter
