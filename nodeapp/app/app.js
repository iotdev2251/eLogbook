import '../config/env.js'
import express from 'express';
import helmet from 'helmet';
import { join, dirname } from 'path';
import cookieParser from 'cookie-parser';
import { logger } from '../config/logger.js';
import expressPinoLogger from 'express-pino-logger';
import { fileURLToPath } from 'url';

import { addBeaconRouter } from './beacon/beacon-router.js'
import { addHistoryRouter } from './history/history-router.js'

import { MyMqttClient } from './mqtt/mqtt-client.js';
import { BeaconDataStore } from './beacon/beacon-datastore.js';
import { BeaconRepository } from './beacon/beacon-repository.js';
import { ParamRepository } from './param/param-repository.js';
import { MqttProcessor } from './mqtt/mqtt-processor.js';
import { ScheduleTask } from './job/schedule-task.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const expressPino = expressPinoLogger({
    logger: logger
})

function initApp() {
    const app = express();

    // app.use(expressPino);
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "https://ui-avatars.com"],
                connectSrc: ["'self'", "wss:", "ws:"],
            },
        },
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    }));
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(cookieParser());
    app.use(express.static(join(__dirname, '../public')));

    app.set('view engine', 'ejs'); 
    app.set('views', join(__dirname, 'views'))

    return app;
}


import { authRouter } from './auth/auth-router.js';
import { authMiddleware } from './auth/auth-middleware.js';
import { getJwtSecret } from '../config/jwt.js';

class MyApp {
    constructor(){
        this.app = initApp()

        this._beaconRepository = new BeaconRepository(new BeaconDataStore())
        this._mqttProcessor = new MqttProcessor(this._beaconRepository)
        this._mqttClient = new MyMqttClient(this._mqttProcessor)
    }

    getApp(){
        return this.app
    }

    async init(io) {
        getJwtSecret()

        const paramRepository = new ParamRepository()
        await paramRepository.init()

        await this._beaconRepository.init(paramRepository.getNewBeaconPrefix())
        await this._mqttProcessor.init(io, paramRepository.getBeaconOutTime())
        await this._mqttClient.init()

        this._initRouter(this.app)

        new ScheduleTask(this._mqttProcessor, 
            paramRepository.getHistoryExpiredTime()
        ).schedule()
    }

    _initRouter(app) {
        app.use('/auth', authRouter)
        app.use('/beacons', authMiddleware, addBeaconRouter(this._beaconRepository, this._mqttProcessor))
        app.use('/history', authMiddleware, addHistoryRouter())

        // Serve the dashboard for any other routes (SPA support)
        app.get('*', (req, res) => {
            res.sendFile(join(__dirname, '../public/index.html'));
        });

        return app
    }
}


const myApp = new MyApp()

export { myApp }