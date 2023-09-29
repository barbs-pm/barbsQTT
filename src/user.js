import _ from 'lodash';
import { question } from './readline.js';
import { getClientId } from './mqtt.js';
import usersStatusController from './usersStatus.js';

const userStatusTopic = 'USERS';

/**
 * Handles messages received on the USERS topic.
 * If the message is a new user status, updates the users status data.
 * And publish, so everyone will have the same updated data. 
 * @param {string} receivedTopic - The topic on which the message was received.
 * @param {Buffer} message - The message received.
 * @param {MqttClient} client - The MQTT client instance.
 */
export function handleUsersStatus(receivedTopic, message, client) {
    if (receivedTopic !== userStatusTopic) {
        return;
    }

    const usersStatus = usersStatusController.get();
    const users = JSON.parse(message.toString());
    const areEqual = _.isEqual(_.sortBy(usersStatus, 'id'), _.sortBy(users, 'id'));

    if (!areEqual) {
        const mergedLists = [...usersStatus, ...users];
        const map = {};
        for(const user of mergedLists){
            map[user.id] = user;
        }
        const allUsers = Object.values(map);
        usersStatusController.set([...allUsers]);
        client.publish(receivedTopic, JSON.stringify([...allUsers]));
    }
}

export function publishOnline(client) {
    const clientId = getClientId();
    const usersStatus = usersStatusController.get();
    usersStatusController.set([...usersStatus, { id: clientId, status: 'online' }]);
    client.subscribe(userStatusTopic);
    client.publish(userStatusTopic, JSON.stringify([{ id: clientId, status: 'online' }]));
}

export function publishOffline(client) {
    const clientId = getClientId();
    const usersStatus = usersStatusController.get();
    usersStatus.forEach(user => {
        if (user.id === clientId) {
            user.status = 'offline';
        }
    });
    usersStatusController.set([...usersStatus]);
    client.publish(userStatusTopic, JSON.stringify(usersStatus));
}

export async function listUsers() {
    const usersStatus = usersStatusController.get();
    console.clear();
    console.log('=== Usuarios ===');
    console.log('Online: ');
    usersStatus.forEach(user => {
        if(user.status === 'online'){
            console.log(`  - ${user.id}`);
        }
    });
    console.log('---------------');
    console.log('Offline: ');
    usersStatus.forEach(user => {
        if(user.status === 'offline'){
            console.log(`  - ${user.id}`);
        }
    });
    console.log('==================');
    await question('Pressione enter para continuar');
}
