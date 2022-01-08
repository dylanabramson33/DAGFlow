class Node {
    constructor(){
        this.children = []
    }
    addChild(node){
        this.children.push(node);
    }
}

export default Node;