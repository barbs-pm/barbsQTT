import { setClientId, connectToMQTT } from './src/mqtt.js';
import { question } from './src/readline.js';
import { sendMessage } from './src/message.js';
import { listUsers, publishOffline } from './src/user.js';

async function handleMenu(client) {
    console.clear();
    console.log('=== Bem vindo ao chat BarbsQTT ===');
    console.log('1 - Enviar mensagem');
    console.log('2 - Listar usuarios')
    console.log('3 - Sair');
    console.log('==================================');
    const option = await question('Escolha uma opção: ');
    if (option === '1') {
        await sendMessage(client);
    } else if (option === '2'){
        await listUsers();
    } else if (option === '3') {
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
