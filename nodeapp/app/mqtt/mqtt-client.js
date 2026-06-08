import mqtt from 'mqtt';
import { c } from '../../config/constant.js'
import { loggerFactory } from '../../config/logger.js';
import { normalizeMac } from '../beacon/mac-utils.js';

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
        this.mqttClient = this._initMqtt()
    }

    _subscribeAll(client) {
        const topics = []
        for (const mac in this._mqttProcessor.getAllGateways()){
            topics.push(GET_MQTT_TOPIC(mac))
        }

        if (topics.length === 0) {
            logger.warn('No gateway topics to subscribe — check gateway table in database')
            return
        }

        client.subscribe(topics, (err) => {
            if (err) {
                logger.error('MQTT subscribe failed: %s', err.message)
            } else {
                logger.info('Subscribed to %d gateway topics', topics.length)
            }
        })
    }

    _initMqtt(){
        const that = this

        const connectOptions = {
            clientId,
            clean: true,
            connectTimeout: 4000,
            reconnectPeriod: 2000,
        }

        if (c.MQTT_USER && c.MQTT_PASSWORD) {
            connectOptions.username = c.MQTT_USER
            connectOptions.password = c.MQTT_PASSWORD
        } else {
            logger.warn('MQTT_USER/MQTT_PASSWORD not set — connecting without credentials')
        }

        const client = mqtt.connect(connectUrl, connectOptions)

        client.on('connect', () => {
            logger.info('MQTT broker connected (%s)', connectUrl)
            that._subscribeAll(client)
        })

        client.on('reconnect', () => {
            logger.info('MQTT broker reconnecting...')
        })

        client.on('offline', () => {
            logger.warn('MQTT broker offline')
        })

        client.on('error', (err) => {
            logger.error('MQTT client error: %s', err.message)
        })

        client.on('message', async (topic, payload) => {
            try {
                const j = JSON.parse(payload)
                if (j != null) {
                    await this._mqttProcessor.process(j, this._extractMacAddressFromTopic(topic))
                }
            } catch (e) {
                logger.error('Invalid MQTT payload on %s: %s', topic, e.message)
            }
        })

        return client
    }

    _extractMacAddressFromTopic(topic){
        const startPos = topic.indexOf("/") + 1
        const nextSlash = topic.indexOf("/", startPos)
        const mac = nextSlash > startPos
            ? topic.substring(startPos, nextSlash)
            : topic.substring(startPos)

        return normalizeMac(mac)
    }
}

export { MyMqttClient }
