import { loggerFactory } from '../../config/logger.js';
import pkg from '@prisma/client'

const prisma = new pkg.PrismaClient()

const logger = loggerFactory("param")

const DEFAULT_OUT_TIME = 15
const DEFAULT_EXPIRE_HISTORY_HOUR = 10
const DEFAULT_NEW_BEACON_PREFIX = "80ECCC0,80ECCB0"


const KEY_OUT_TIME = "BEACON_OUT_TIME"
const KEY_EXPIRED_HISTORY_TIME = 'HISTORY_DELETE_EXPIRED_HOUR'
const KEY_NEW_BEACON_PREFIX = 'NEW_BEACON_PREFIX'

class ParamRepository{
    async init(){
        await this._readAll()
    }

    async _readAll(){
        try {
            const result = await prisma.param.findMany()
            this._params = result
        }
        catch (e) {
            logger.error(e)
            throw e
        }
    }

    getBeaconOutTime(){
        const arr = this._params.filter(it => it.key == KEY_OUT_TIME)

        if(arr != undefined && arr.length > 0){
            return arr[0].value
                || DEFAULT_OUT_TIME
        }
        else {
            return DEFAULT_OUT_TIME
        }
    }

    getHistoryExpiredTime() {
        const arr = this._params.filter(it => it.key == KEY_EXPIRED_HISTORY_TIME)

        if (arr != undefined && arr.length > 0) {
            return arr[0].value
                || DEFAULT_EXPIRE_HISTORY_HOUR
        }
        else {
            return DEFAULT_EXPIRE_HISTORY_HOUR
        }
    }

    getNewBeaconPrefix() {
        const arr = this._params.filter(it => it.key == KEY_NEW_BEACON_PREFIX)

        if (arr != undefined && arr.length > 0) {
            return arr[0].value
                || DEFAULT_NEW_BEACON_PREFIX
        }
        else {
            return DEFAULT_NEW_BEACON_PREFIX
        }
    }
}

export { ParamRepository }