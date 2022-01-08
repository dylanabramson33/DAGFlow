import defaults from './NodeDefaults.js';
class NodeManager{
    constructor(){
        this.nodeDict = {} //map nodeID to node state
        this.nodeTypeDict = {} //map nodeID to node type
        this.currentNode = null; 
    }
    addNode(node){
        Object.assign(this.nodeDict,node);
    }
    changeCurrent(nodeID,nodeType=''){
        if(this.nodeDict.hasOwnProperty(nodeID)){
            this.currentNode = this.nodeDict[nodeID];
        }
        else{
            this.nodeTypeDict[nodeID] = nodeType;

            const defaultVals = JSON.parse(JSON.stringify(defaults.defaultDict[nodeType])); 
            const newNode = {};
            newNode[nodeID] = defaultVals;
            this.addNode(newNode);
            this.currentNode = this.nodeDict[nodeID];
        }
        this.render(nodeID,nodeType);
    }
    updateNode(id,paramInd,value){
        this.nodeDict[id][paramInd]['val'] = value;
    }
    getInputTypes(nodeID){
        const node = this.nodeDict[nodeID];
        let params = Object.values(node);
        params = params.filter((param) => param.hasOwnProperty('type'));
        const typeList = [];
        for (let i = 0; i < params.length; i++){
            if(params[i]['val']===''){
                typeList.push(params[i]['type']);
            } 
        }
        return typeList;
    }
    getOutputTypes(nodeID){
        const node = this.nodeDict[nodeID];
        return node[node.length - 1].output_type;
    }
    setInputTypeToVal(nodeID,param,val){
        const node = this.nodeDict[nodeID];
        let params = Object.values(node);
        const index = params.indexOf('output');
        params = params.filter((param) => param.hasOwnProperty('type'));
        for (let i = 0; i < params.length; i++){
            if(params[i]['type'] == param && params[i]['val'] === ''){
                params[i]['val'] = "node_".concat(val);
                break;
            } 
        }
    }
    render(nodeID,nodeType){
        document.querySelector('#nodeDesc').innerHTML = `
        <h3>${nodeType}</h3>
        <p> Node Inputs </p>
        ${this.currentNode.map((parameterDict,index) => {
            switch (parameterDict.type) {
            case 'str':
                return `
                <label style="color:${parameterDict['val'] !== '' ? 'green' : 'black'};" 
                for=${index}_${nodeID}> ${parameterDict['arg']} </label><br></br>
                <input 
                class='paramInput' id=${index}_${nodeID} 
                label=${parameterDict['arg']} 
                value=${parameterDict['val']}>`;
            case 'DataFrame':
                return `
                <label style="color:${parameterDict['val'] !== '' ? 'green' : 'black'};" 
                for=${parameterDict['arg']}${nodeID}> ${parameterDict['arg']} </label><br></br>
                <label> DataFrame </label><br></br>`
            default:
                break;
            }
        
        }).join('<br></br>')}
        <div id='outputs'> 
        <p> Node Output </p>
        <label> ${this.currentNode['output']} </label>
        </div>
        `
        document.querySelectorAll('.paramInput').forEach(inp => {
            inp.addEventListener('change', () => {
                const currentData = inp.value;
                const paramAndID = inp.id;
                const splitParamAndID = paramAndID.split("_");
                const param = splitParamAndID[0];
                const id = splitParamAndID[1];
                nodeManager.updateNode(id,param,currentData);
            });
        });

    }

}

const nodeManager = new NodeManager();
export default nodeManager;