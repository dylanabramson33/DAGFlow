import Node from './Node.js';
import nodeManager from './NodeManager.js';
import {Defaults,FuncToSource} from './NodeDefaults.js';


class Compiler {
    constructor(){
        this.sourceCode = ''
    }
    addPipelineBoilerplate(){  
        this.sourceCode = this.sourceCode.concat(`@createflow \ndef pipeline():\n`);
    }
    compileNodeSource(nodeID){
        const nodeType = nodeManager.nodeTypeDict[nodeID];
        const nodeSource = FuncToSource.funcToSource[nodeType];
        this.sourceCode = this.sourceCode.concat(`${nodeSource}\n`);
    }
    addFunctionCall(functionName,functionParameters,nodeID){
        let joinedParameters = functionParameters.join(",");
        this.sourceCode = this.sourceCode.concat(`\t node_${nodeID} = ${functionName}(${joinedParameters})\n`);
    }
    addReturnCall(nodeID){
        this.sourceCode = this.sourceCode.concat(`\t return node_${nodeID}\n`);
    }
    addSetOutput(){
        this.sourceCode = this.sourceCode.concat(`pipeline.compile()\noutput = pipeline.run()`)
    }
  
}

/**
 * buildGraph(edges) = adjDict 
 * where adjDict is an object containing nodes mapping
 * to children
 */
function buildGraph(edges){
    let adjDict = {};
    for(let i = 0; i < edges.length; i++){
        let edge = edges[i].data();
        let source = edge.source;
        let target = edge.target; 
        if(adjDict.hasOwnProperty(source)){
            adjDict[source].addChild(target);
        }else {
            adjDict[source] = new Node();
            adjDict[source].addChild(target);
        }
        adjDict[target] = new Node();
    }
    return adjDict;
}

/**
 * getRoots(adjDict) = rs where rs is an array containing 
 * the root nodes of adjDict
 */
function getRoots(adjDict){
    let nodes = Object.keys(adjDict);
    const isChildDict = {}
    for(let i = 0; i < nodes.length; i++){
        let node = nodes[i];
        isChildDict[node] = 0;
    }
    for(let i = 0; i < nodes.length; i++){
        let node = nodes[i];
        let children = adjDict[node].children;
        for(let i = 0; i < children.length; i++ ){
            isChildDict[children[i]] = 1;
        }
    }
    const roots = nodes.filter(i => isChildDict[i] == 0)
    return roots;
}


/**
 * traverse graph while compiling nodes using DFS
 */
function compileGraphFromNode(adjDict,root,compiler){
    

    let functionName = nodeManager.nodeTypeDict[root];
    let parameterObjs = nodeManager.nodeDict[root]
    parameterObjs = parameterObjs.slice(0,parameterObjs.length-1);
    let parameters = [];
    for(let i = 0; i < parameterObjs.length; i++){
        console.log(parameterObjs)
        if(parameterObjs[i]['type']=='str'){
            parameters.push(`"${parameterObjs[i].val}"`);
        }  
        else{
            parameters.push(parameterObjs[i].val);
        }
    }
    compiler.addFunctionCall(functionName,parameters,root);
    if(adjDict[root].children.length == 0){
        compiler.addReturnCall(root);
    }
    
    for(let i = 0; i < adjDict[root].children.length;i++){
        compileGraphFromNode(adjDict,adjDict[root].children[i],compiler);
    }
}

document.querySelector('#submit').addEventListener('click', function(){
    //Build the graph 
    const compiler = new Compiler();
    let edges = window.cy.filter('edge');
    const adjDict = buildGraph(edges);
    const roots = getRoots(adjDict);
    const nodes = Object.keys(adjDict);
    nodes.map(nodeID => compiler.compileNodeSource(nodeID));
    compiler.addPipelineBoilerplate();
    compileGraphFromNode(adjDict,roots[0],compiler);
    compiler.addSetOutput();
    console.log(compiler.sourceCode);
    fetch('http://localhost:5501/send_graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            'source': compiler.sourceCode,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          const container = document.getElementById('nodeTable');
            const hot = new Handsontable(container, {
            data: data,
            rowHeaders: true,
            colHeaders: true,
            height: 'auto',
            licenseKey: 'non-commercial-and-evaluation' // for non-commercial use only
        });
        })
});