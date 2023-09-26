import mqtt from 'mqtt';
import readline from 'readline';
import moment from 'moment';
import _ from 'lodash';

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});
const url = 'mqtt://test.mosquitto.org';
const options = {
	clean: true,
	connectTimeout: 4000,
};
const userStatusTopic = 'USERS';
const activeSessions = [];
let usersActive = [];

async function question(theQuestion) {
	return new Promise(resolve => rl.question(theQuestion, answ => resolve(answ)))
}

function handleSession(recipientId, client) {
	if (activeSessions[recipientId] === undefined) {
		const timestamp = moment().format('YYYYMMDDHH');
		const sessionTopic = `${options.clientId}_${recipientId}_${timestamp}`;
		const recipientControlTopic = `${recipientId}_controller`;
		client.publish(recipientControlTopic, sessionTopic);
		activeSessions[recipientId] = sessionTopic;
		console.log(`Sessão iniciada com ${recipientId}. O tópico da sessão é: ${sessionTopic}`);
	}
	return activeSessions[recipientId];
}

async function sendMessage(client) {
	const recipientId = await question('Enviar mensagem para qual usuário? ');
	const topic = handleSession(recipientId, client);
	client.subscribe(topic);

	console.clear();
	console.log(`=== ${topic} ===`);
	while (true) {
		const message = await question(``);
		const messageObject = {
			from: options.clientId,
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

function receiveMessageThread(client) {
	client.on('message', (receivedTopic, message) => {
		handleControllerTopic(receivedTopic, message, client); 
		handleNewMessageReceived(message);
		handleUsersStatus(receivedTopic, message, client);
	});
}

function handleNewMessageReceived(message) {
	if (message.toString().startsWith('{')) {
		const messageParsed = JSON.parse(message.toString());
		const recipientId = messageParsed.from;
		if (recipientId !== options.clientId) {
			const messageText = messageParsed.message;
			console.log(`${recipientId}: ${messageText}`);
		}
	}
}

function handleControllerTopic(receivedTopic, message, client) {
	if (receivedTopic === `${options.clientId}_controller`) {
		const recipientId = message.toString().split('_')[0];
		console.log(`Voce recebeu uma mensagem de ${recipientId}`);
		client.subscribe(message.toString());
		activeSessions[recipientId] = message.toString();
	}
}

function handleUsersStatus(receivedTopic, payload, client) {
	if (receivedTopic !== userStatusTopic) {
		return;
	}

	const users = JSON.parse(payload.toString());
	const areEqual = _.isEqual(_.sortBy(usersActive, 'id'), _.sortBy(users, 'id'));

	if(!areEqual){
		const mergedLists = [...usersActive, ...users];
		const map = {};
		for(const user of mergedLists){
			map[user.id] = user;
		}
		const allUsers = Object.values(map);
		usersActive.length = 0;
		usersActive.push(...allUsers);
		client.publish(receivedTopic, JSON.stringify(Array.from(allUsers)));
	}
}

async function listUsers() {
	console.clear();
	console.log('=== Usuarios ===');
	usersActive.forEach(user => {
		console.log(`${user.id} - ${user.status}`);
	});
	console.log('==================');
	await question('Pressione enter para continuar');
}

function publishOffline(client) {
	usersActive.forEach(user => {
		if (user.id === options.clientId) {
			user.status = 'offline';
		}
	});
	client.publish(userStatusTopic, JSON.stringify(usersActive));
}

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
	} 
	handleMenu(client);
}

async function main() {
	options.clientId = await question('Digite seu usuário: ');
	const client = mqtt.connect(url, options);
	
	client.on('connect', async () => {
		usersActive.push({id: options.clientId, status: 'online'});	
		client.subscribe(userStatusTopic);
		client.publish(userStatusTopic, JSON.stringify([{id: options.clientId, status: 'online'}]));
		const controllerTopic = `${options.clientId}_controller`;
		client.subscribe(controllerTopic);
		receiveMessageThread(client);
		await handleMenu(client);
	});

	client.on('error', (error) => {
		console.error(error);
		process.exit(1);
	});
}

main();
