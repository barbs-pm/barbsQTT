import { question } from './readline.js';
import { getClientId, handleSession } from './mqtt.js';
import { handleUsersStatus } from './user.js';
import activeSessionsController from './activeSessions.js';
import { handleActiveGroups } from './groups.js';

export async function sendMessage(client) {
    const clientId = getClientId();
    const recipientId = await question('Enviar mensagem para qual usuário? ');
    const topic = handleSession(recipientId, client);
    client.subscribe(topic);

    console.clear();
    console.log(`=== ${topic} ===`);

    while (true) {
        const message = await question(``);
        const messageObject = {
            from: clientId,
            message,
        }
        if (message.toLowerCase() === 'exit') {
            console.clear();
            break;
        } else {
            client.publish(topic, JSON.stringify(messageObject), { qos: 1 });
        }
    }
}

export function receiveMessage(client) {
    client.on('message', (receivedTopic, message) => {
        handleControllerTopic(receivedTopic, message, client); 
        handleNewMessageReceived(message);
        handleUsersStatus(receivedTopic, message, client);
        handleActiveGroups(receivedTopic, message, client);
    });
}

/**
 * Handles a new message received from the server.
 * If it's an actual chat message, it means that the message
 * is a JSON object, so we parse it and show the message.
 * @param {object} message - The message object received from the server.
 * @param {string} message.from - The sender of the message.
 * @param {string} message.message - The content of the message.
 */
function handleNewMessageReceived(message) {
    if (message.toString().startsWith('{')) {
        const clientId = getClientId();
        const messageParsed = JSON.parse(message.toString());
        const recipientId = messageParsed.from;
        if (recipientId !== clientId) { // don't show the message if it's from the current user
            const messageText = messageParsed.message;
            console.log(`${recipientId}: ${messageText}`);
        }
    }
}

/**
 * Handles messages received on the client's controller topic.
 * If the topic is the controller, this means that is someone 
 * trying to send a new topic to chat, and then adds the session 
 * topic to the active sessions controller.
 * @param {string} receivedTopic - The topic on which the message was received.
 * @param {Buffer} message - The message received.
 * @param {MqttClient} client - The MQTT client instance.
 */
function handleControllerTopic(receivedTopic, message, client) {
    const clientId = getClientId();
    if (receivedTopic === `${clientId}_controller`) {
        const recipientId = message.toString().split('_')[0];
        const topic = message.toString();
        //console.log(`Voce recebeu uma mensagem de ${recipientId}`);
        client.subscribe(topic);
        activeSessionsController.setPos(recipientId, topic);
    }
}
