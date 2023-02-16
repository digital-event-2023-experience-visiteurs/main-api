import express from "express"
import fs from "fs"
import { v4 as uuidv4 } from "uuid"

const photoboothRouter = express.Router()
const imageDir = "./imgs"

function getImage(name) {
	try {
		return fs.readFileSync(`./imgs/${name}.png`, { encoding: "base64" })
	} catch (error) {
		return undefined
	}
}

photoboothRouter.post("/", async (req, res, next) => {
	const imgName = uuidv4()
	const data = req.body.data

	if (!fs.existsSync(imageDir)) {
		fs.mkdirSync(imageDir)
	}

	if (data == undefined) {
		res.status(400).send({ message: "Invalid image data." })
		return
	}

	const parsedData = data.replace(/^data:image\/\w+;base64,/, "")
	const buffer = Buffer.from(parsedData, "base64")

	fs.writeFileSync(`${imageDir}/${imgName}.png`, buffer)

	res.send({ imgName })
})

photoboothRouter.get("/:name", async (req, res, next) => {
	const image = getImage(req.params.name)

	if (image == undefined) {
		res.status(400).send({ message: "Invalid image name." })
		return
	}

	res.send({ image })
})

export default photoboothRouter
