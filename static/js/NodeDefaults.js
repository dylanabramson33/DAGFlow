class NodeDefaults {
    constructor(){
        this.defaultDict = {};
    }
    addDefaults(defaults){
        Object.assign(this.defaultDict,defaults);
    }
}

let defaults = new NodeDefaults()

export default defaults;