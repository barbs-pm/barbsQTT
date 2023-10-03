import { setClientId, connectToMQTT } from './src/mqtt.js';
import { question } from './src/readline.js';
import { sendMessage } from './src/message.js';
import { listUsers, publishOffline } from './src/user.js';
import { listGroups, joinGroup, createGroup } from './src/groups.js';

async function handleMenu(client) {
    console.clear();
    console.log('=== Bem vindo ao chat BarbsQTT ===');
    console.log('1 - Enviar mensagem');
    console.log('2 - Listar usuarios');
    console.log('3 - Listar grupos');
    console.log('4 - Entrar em um grupo');
    console.log('5 - Criar um grupo');
    console.log('6 - Sair');
    console.log('==================================');
    const option = await question('Escolha uma opção: ');
    if (option === '1') {
        await sendMessage(client);
    } else if (option === '2'){
        await listUsers();
    } else if (option === '3') {
        await listGroups();
    } else if (option === '4') {
        await joinGroup(client);
    } else if (option === '5') {
        await createGroup(client);
    } else if (option === '6') {
        publishOffline(client);
        setTimeout(() => {
            client.end();
            process.exit(0);
        }, 1000);
    } 
    handleMenu(client);
}

async function main() {
    const clientId = await question('Digite seu nome de usuário: ');
    setClientId(clientId);
    const client = await connectToMQTT();
    await handleMenu(client);
}

main();
