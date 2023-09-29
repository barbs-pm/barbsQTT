class UsersStatus {
    constructor() {
        this.usersStatus = [];
    }

    get() {
        return this.usersStatus;
    }

    set(users) {
        this.usersStatus = [...users];
    }
}

const usersStatus = new UsersStatus();
export default usersStatus;
