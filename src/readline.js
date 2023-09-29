import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

export function question(theQuestion) {
    return new Promise(resolve => {
        rl.question(theQuestion, answer => {
            resolve(answer);
        });
    });
}
