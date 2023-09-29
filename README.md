# barbsQTT

barbsQTT is a simple example of using MQTT protocol. You can send messages to the server and receive messages from other users. It provides a simple and easy-to-use API for connecting to MQTT brokers, subscribing to topics, and publishing messages.

## Installation
Clone the repo in your local machine
`git clone git@github.com:barbs-pm/barbsQTT.git`

Install barbsQTT using npm:
`npm i`

And then start:
`npm start`

## Usage
- Structure
  - index.js
  - src/
    - mqtt.js
    - user.js
    - message.js
    - readline.js
    - userStatus.js    // class to store online and offline users
    - activeSession.js // class to store sessions of users 

`index.js` will start the program and call the function in `src/mqtt.js` to connect to the broker. Then it will call the function in `src/readline.js` to read user input and send messages to the broker. 
The function in `src/mqtt.js` will also publish to users topic to get the list of online users. It will call the function in `src/user.js` to store the list of online/offline users. Then will subscribe to the controller topic, and call the function in `src/message.js` to start to receive the messages sent to it. 
The menu will be called in a loop, and the user can choose to send a message to a user, list all users, or exit the program.
If the user chooses to send a message, the function in `src/message.js` will be called to send the message to the broker. We will validate if the topic session between the users already exists, if not, we will create a new session and store it in `src/activeSession.js`. Then we will publish the topic to the recipient controller topic.
To receive the message, we will validate what is the type of the message
- if it is a message received in the controller topic this means that it's a new topic to chat with someone, we will store the list of online users in `src/user.js`. 
- if it is a message received in the users topic, we will sync the list of online users
- if it is a json message received, we will print the message in the console
