import _ from 'lodash';
import { question } from './readline.js';
import { getClientId } from './mqtt.js';
import activeGroupsController from './activeGroups.js';

const groupsTopic = 'GROUPS';

export async function handleActiveGroups(receivedTopic, message, client) {
    if (receivedTopic !== groupsTopic) {
        return;
    }

    const activeGroups = activeGroupsController.get();
    const groups = JSON.parse(message.toString());
    const areEqual = _.isEqual(_.sortBy(activeGroups, 'name'), _.sortBy(groups, 'name'));

    if (!areEqual || groups.syncGroups) {
        const mergedLists = [...activeGroups, ...groups];
        const map = {};
        for(const group of mergedLists){
            if (group.syncGroups) {
                continue;
            }
            map[group.name] = group;
        }
        const allGroups = Object.values(map);
        activeGroupsController.set([...allGroups]);
        client.publish(receivedTopic, JSON.stringify([...allGroups]));
    }
}

export function subscribeToGroups(client) {
    client.subscribe(groupsTopic);
    client.publish(groupsTopic, '[{ "syncGroups": true }]');
}

export async function joinGroup(client) {
    const clientId = getClientId();
    const groupName = await question('Digite o nome do grupo: ');
    const groupToJoin = activeGroupsController.get().find(group => group.name === groupName);
    groupToJoin.users.push(clientId);
    activeGroupsController.setPos(groupName, groupToJoin);
    client.publish(groupsTopic, JSON.stringify([groupToJoin]));
}

export async function createGroup(client) {
    const clientId = getClientId();
    const groupName = await question('Digite o nome do novo grupo: ');
    const groupObject = { users: [clientId], leader: clientId, name: groupName };
    activeGroupsController.setPos(groupName, groupObject);
    client.publish(groupsTopic, JSON.stringify([groupObject]));
}

export async function listGroups() {
    const groups = activeGroupsController.get();
    console.clear();
    console.log('=== Grupos ===');
    groups.forEach(group => {
        console.log(`Nome: ${group.name}`);
        console.log(`Lider: ${group.leader}`);
        console.log(`Usuarios:`);
        group.users.forEach(user => {
            console.log(`  - ${user}`);
        });
        console.log('==============');
    });
    await question('Pressione enter para continuar...');
}