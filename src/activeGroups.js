class ActiveGroups {
    constructor() {
        this.activeGroups = [];
    }

    get() {
        return this.activeGroups;
    }

    set(groups) {
        this.activeGroups = [...groups];
    }

    setPos(index, group) {
        this.activeGroups[index] = group;
    }
}

const activeGroups = new ActiveGroups();
export default activeGroups;