import Node from './Node.js';
import nodeManager from './NodeManager.js';

class Compiler {
    constructor(){
        this.sourceCode = ''
    }
    addImports(){
        this.sourceCode = this.sourceCode.concat('from ChemData import * \n \n');
    }
    addPipelineBoilerplate(){  
        this.sourceCode = this.sourceCode.concat(`@createpipeline \ndef pipeline():\n`);

    }
    addFunctionCall(functionName,functionParameters,nodeID){
        let joinedParameters = functionParameters.join(",");
        this.sourceCode = this.sourceCode.concat(`\t node_${nodeID} = ${functionName}(${joinedParameters})\n`);
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
    compiler.addImports();
    compiler.addPipelineBoilerplate();
    compileGraphFromNode(adjDict,roots[0],compiler);
    compiler.addSetOutput();


});