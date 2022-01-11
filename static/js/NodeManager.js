import {Defaults,FuncToSource} from './NodeDefaults.js';
class NodeManager{
    constructor(){
        this.nodeDict = {} //map nodeID to node state
        this.nodeTypeDict = {} //map nodeID to node type
        this.currentNode = null; 
        this.currentSource = null;
    }
    addNode(node){
        Object.assign(this.nodeDict,node);
    }
    changeCurrent(nodeID,nodeType=''){
        if(nodeType.indexOf('new_node')!==-1){
            this.renderBaseNode(nodeID);
            return;
        }

        if(this.nodeDict.hasOwnProperty(nodeID)){
            this.currentNode = this.nodeDict[nodeID];
        }
        else{
            this.nodeTypeDict[nodeID] = nodeType;
            const defaultVals = JSON.parse(JSON.stringify(Defaults.defaultDict[nodeType])); 
            const newNode = {};
            newNode[nodeID] = defaultVals;
            this.addNode(newNode);
            this.currentNode = this.nodeDict[nodeID];
        }
        this.render(nodeID,nodeType);
    }
    getNodeSource(nodeType){
        if(nodeType.indexOf("new_node") !== -1){
            return '';
        }

        const source = FuncToSource.funcToSource[nodeType];
        return source;
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
    submitCode(nodeID){
        var submitButton = document.getElementById("submitButton");
        submitButton.addEventListener('click', function(){
            var editor = ace.edit("editor");
            var nodeType = nodeManager.nodeTypeDict[nodeID];
            var old_source;
            if(!FuncToSource.funcToSource.hasOwnProperty(nodeType)){
                old_source = ''
            }
            else {
                old_source = FuncToSource.funcToSource[nodeType]
            }
            var text = editor.getValue();
            fetch('http://localhost:5501/update_node_source', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    'new_source' : text,
                    'old_source' : old_source,
                }),
            }).then((res) => res.json())
            .then((data) => {
                if(data.hasOwnProperty('message')){
                    return;
                }                const newFuncToSource = {};
                newFuncToSource[Object.keys(data)[0]] = text;
                FuncToSource.addFuncToSource(newFuncToSource);
                nodeManager.nodeTypeDict[nodeID] = Object.keys(data)[0];
                delete nodeManager.nodeDict[nodeID];
                const node = cy.nodes(`[id = '${nodeID}']`)[0];
                node.data('name',  Object.keys(data)[0]); 
                Defaults.addDefaults(data);
                nodeManager.changeCurrent(nodeID,Object.keys(data)[0]);
            })
        });
    }
    renderBaseNode(nodeID){
        document.querySelector('#nodeDesc').style.display = 'block';
        document.querySelector('#nodeDesc').innerHTML = `
        <button id="submitButton" style="float:right"> submit source </button>
        <h3>Base Node</h3>`
        this.submitCode(nodeID);
    }
    render(nodeID,nodeType){ 
        //REFACTOR THIS TO NOT HAVE TWO RENDER FUNCTIONS
        document.querySelector('#nodeDesc').style.display = 'block';
        document.querySelector('#nodeDesc').innerHTML = `
  
        <button id="submitButton" style="float:right"> submit source </button>
        <h3>${nodeType}</h3>
        <p> Node Inputs </p>
        ${this.currentNode.map((parameterDict,index) => {
            switch (parameterDict.type) {
            case 'str':
                return `
                <label style="color:${parameterDict['val'] !== '' ? 'green' : 'black'};" 
                for=${index}_${nodeID}>  ${parameterDict['arg']} </label><br></br>
                <input 
                class='paramInput' id=${index}_${nodeID} 
                label=${parameterDict['arg']} 
                value=${parameterDict['val']}>`;
            case 'DataFrame':
                return `
                <label style="color:${parameterDict['val'] !== '' ? 'green' : 'black'};" 
                for=${parameterDict['arg']}${nodeID}> ${parameterDict['arg']} </label><br></br>
                <label> DataFrame </label><br></br>
                ${parameterDict['val'] !== '' ? `<label> INPUT NODE: ${parameterDict['val']} </label><br></br>` : ``}`
            default:
                break;
            }
        
        }).join('<br></br>')}
        <div id='outputs'> 
        <p> Node Output </p>
        <label> ${this.getOutputTypes(nodeID)} </label>
        </div>
        `
        this.submitCode(nodeID);
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