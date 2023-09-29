class ActiveSessions {
    constructor() {
        this.activeSessions = [];
    }

    get() {
        return this.activeSessions;
    }

    set(session) {
        this.activeSessions.push(session);    
    }

    setPos(index, session) {
        this.activeSessions[index] = session;
    }
}

const activeSessions = new ActiveSessions();
export default activeSessions;
