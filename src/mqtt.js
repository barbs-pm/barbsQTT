import mqtt from 'mqtt';
import moment from 'moment';
import activeSessionsController from './activeSessions.js';
import { publishOnline } from './user.js';
import { receiveMessage } from './message.js';

const url = 'mqtt://test.mosquitto.org';
const activeSessions = activeSessionsController.get();
let clientId = '';

export function setClientId(newClientId) {
    clientId = newClientId;
}

export function getClientId() {
    return clientId;
}

export async function connectToMQTT() {
    const clientId = getClientId();
    const client = mqtt.connect(url, {
        clean: true,
        connectTimeout: 4000,
        clientId,
    });

    return new Promise((resolve, reject) => {
        client.on('connect', async () => {
            publishOnline(client);
            client.subscribe(`${clientId}_controller`);
            receiveMessage(client);
            resolve(client);
        });

        client.on('error', (error) => {
            console.log('Erro ao conectar no broker MQTT', error);
            reject(error);
        });
    });
}

/**
 * Handles the session before sending the message.
 * Check if we already have a topic for the recipient. If not, creates a new one.
 * Publish the topic to the recipient's controller topic and add the topic to the active sessions controller.
 * @param {string} receivedTopic - The topic on which the message was received.
 * @param {Buffer} message - The message received.
 * @param {MqttClient} client - The MQTT client instance.
 */
export function handleSession(recipientId, client) {
    const clientId = getClientId();
    let sessionTopic = activeSessions[recipientId];
    if (sessionTopic) {
        return sessionTopic;
    }

    const timestamp = moment().format('YYYYMMDDHH');
    sessionTopic = `${clientId}_${recipientId}_${timestamp}`;
    const recipientControlTopic = `${recipientId}_controller`;
    client.publish(recipientControlTopic, sessionTopic);
    activeSessionsController.setPos(recipientId, sessionTopic);

    return sessionTopic;
}
