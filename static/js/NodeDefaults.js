class NodeDefaults {
    constructor(){
        this.defaultDict = {};
    }
    addDefaults(defaults){
        Object.assign(this.defaultDict,defaults);
    }
}

class NodeFuncToSource {
    constructor(){
        this.funcToSource = {};
    }
    addFuncToSource(funcToSource){
        Object.assign(this.funcToSource,funcToSource);
    }
}

let defaults = new NodeDefaults();
let funcToSource = new NodeFuncToSource();

export const Defaults = defaults;
export const FuncToSource = funcToSource;