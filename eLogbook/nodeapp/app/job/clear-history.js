
import pkg from '@prisma/client'
import { loggerFactory } from '../../config/logger.js'

const prisma = new pkg.PrismaClient()

const logger = loggerFactory('clear-history-job')

async function clearHistory(hour){
    try{
        const expired = new Date()
        expired.setHours(expired.getHours() - hour)
        // expired.setMinutes(expired.getMinutes() - 1)
        
        const r = await prisma.beacon_history.deleteMany({
            where: {
                report_at: {
                    lt: expired.toISOString()
                }
            }
        })
        return r.count
    }
    catch(e){
        logger.error(e)
        return -1
    }
}

export { clearHistory }