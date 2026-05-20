import { loggerFactory } from '../../config/logger.js';
import express from 'express'
import { BeaconApi } from './beacon-api.js';

const logger = loggerFactory("beacon-router")

function addBeaconRouter(beaconRepository){
    const beaconApi = new BeaconApi(beaconRepository)
    const router = express.Router()

    router.get('/:page?', async (req, res, next) => {
        const page = parseInt(req.params.page) || 0
        const result = beaconApi.getAll(page)
        res.json(result)
    })

    router.get('/b/:mac', async (req, res, next) => {
        const mac = req.params.mac
        const result = beaconApi.get(mac)
        if(result == null){
            res.status(404).json({})
        }
        else{
            res.json(result)
        }
    })

    return router
}
export { addBeaconRouter }