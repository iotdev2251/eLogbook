import mqtt from 'mqtt';
import { c } from '../../config/constant.js'
import { loggerFactory } from '../../config/logger.js';

const logger = loggerFactory('mqtt')

const host = c.MQTT_HOST
const port = c.MQTT_PORT
const clientId = `mqtt_nodejs_${Math.random().toString(16).slice(3)}`
const connectUrl = `mqtt://${host}:${port}`

const GET_MQTT_TOPIC = (mac) => `/${mac}/connect_packet/adv_publish`

class MyMqttClient{
    constructor(mqttProcessor){
        this._mqttProcessor = mqttProcessor
    }
    
    async init(){
        const that = this

        this.mqttClient = this._initMqtt()
    }

    _initMqtt(){
        const that = this

        const client = mqtt.connect(connectUrl, {
            clientId,
            clean: true,
            connectTimeout: 4000,
            username: 'emqx',
            password: 'public',
            reconnectPeriod: 1000,
        })

        client.on('connect', async () => {
            logger.info('MQTT Broker Connected')

            const topics = []
            for (const mac in that._mqttProcessor.getAllGateways()){
                topics.push(GET_MQTT_TOPIC(mac))
            }

            client.subscribe(topics, () => {
                logger.info(`Subscribe to ${topics.length} topics : '${topics}'`)
            })
        })

        client.on('message', async (topic, payload) => {
            const j = JSON.parse(payload)
            if (j != null) {
                this._mqttProcessor.process(j, this._extractMacAddressFromTopic(topic))
            }
        })

        return client
    }

    _extractMacAddressFromTopic(topic){
        const startPos = topic.indexOf("/") + 1
        const endPos = topic.indexOf("/", startPos) - 1

        const mac = topic.substr(startPos, endPos)

        return mac
    }
}

export { MyMqttClient }