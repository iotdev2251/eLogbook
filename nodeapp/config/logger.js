import pkgFileStreamRotator from 'file-stream-rotator'
import pinoms from 'pino-multi-stream'
import * as pkgPinoPretty from 'pino-pretty'

const logDirectory = 'logs'
const prettyStream = pinoms.prettyStream(
    {
        prettyPrint:
        {
            colorize: true,
            translateTime: 'yyyy-dd-mm, HH:MM:ss',
            ignore: "hostname,pid" // add 'time' to remove timestamp
        },
        prettifier: pkgPinoPretty // not required, just an example of setting prettifier
        // as well it is possible to set destination option
    }
);

const streams = [
    { 
        level: 'info', 
        stream: pkgFileStreamRotator.getStream({ 
            filename: `${logDirectory}/info.log`, 
            frequency: "daily", 
            max_logs: 10 
        }) 
    },
    { 
        stream: prettyStream, 
        level: 'debug' 
    }
]
const logger = pinoms({ streams: streams })

const loggerFactory = function (loggerName) {
    return pinoms({
        name: loggerName,
        level: 'debug',
        streams: streams
    })
}
// const logger = pino(transport)

export { logger, loggerFactory }
export default logger