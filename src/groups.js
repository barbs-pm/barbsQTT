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
    if (!groupToJoin) {
        await question('Esse grupo nao existe, aperte enter para voltar.');
        return;
    }
    groupToJoin.users.push({ id: clientId, active: false });
    activeGroupsController.setPos(groupName, groupToJoin);
    client.publish(groupsTopic, JSON.stringify([groupToJoin]));
}

export async function createGroup(client) {
    const clientId = getClientId();
    const groupName = await question('Digite o nome do novo grupo: ');
    if (groupName.toLowerCase() === 'exit') {
        console.clear();
        return;
    }
    const groupObject = { users: [{ id: clientId, active: true }], leader: clientId, name: groupName };
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
            if (user.active) {
                console.log(`  - ${user.id}`);
            }
        });
        console.log('==============');
    });
    await question('Pressione enter para continuar...');
}

export async function manageGroups(client) {
    const groups = activeGroupsController.get();
    console.clear();
    console.log('=== Grupos ===');
    groups.forEach(group => {
        console.log(`Nome: ${group.name}`);
        console.log(`Usuarios Pendentes:`);
        group.users.forEach(user => {
            if (!user.active) {
                console.log(`  - ${user.id}`);
            }
        });
        console.log('==============');
    });
    const groupAnswer = await question('Digite o nome do grupo a gerenciar, ou exit pra sair: ');
    const groupToUpdate = activeGroupsController.get().find(group => group.name === groupAnswer);
    if (groupAnswer.toLowerCase() === 'exit') {
        console.clear();
        return;
    } else if (!groups.includes(groupToUpdate)) {
        await question('O grupo nao existe. Pressione enter para continuar...');
    } else {
        const userAnswer = await question('Digite o nome do usuario a gerenciar, ou exit pra sair: ');
        const userToUpdate = groupToUpdate.users.find(user => user.id === userAnswer);
        if (!userToUpdate) {
            await question('O usuario nao existe. Pressione enter para continuar...');
            return;
        }
        userToUpdate.active = true;
        activeGroupsController.setPos(groupAnswer, groupToUpdate);
        client.publish(groupsTopic, JSON.stringify([groupToUpdate]));
    }
}
