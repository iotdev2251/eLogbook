import { loggerFactory } from '../../config/logger.js';
import express from 'express'
import { BeaconHistoryApi } from './history-api.js';

const logger = loggerFactory("history-router")

function addHistoryRouter(){
    const router = express.Router()
    const api = new BeaconHistoryApi()

    router.get('/:page?', async (req, res, next) => {
        const page = parseInt(req.params.page) || 0
        const allBeacons = await api.getAll(page)

        res.json(allBeacons)
    })

    router.get('/b/:mac/:page?', async (req, res, next) => {
        const mac = req.params.mac
        const page = parseInt(req.params.page) || 0
        const allBeacons = await api.get(mac, page)

        res.json(allBeacons)
    })

    return router
}
export { addHistoryRouter }