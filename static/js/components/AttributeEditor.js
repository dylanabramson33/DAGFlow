import Component from './component.js';
import store from '../index.js';
export default class AttributeEditor extends Component {
    constructor(params={}) {
        super({
            store,
            element: document.querySelector('#nodeDesc'),
        });
        
    }
    render() {
        const currentNode = store.state.currentNode;
        if(currentNode == null){
            this.element.innerHTML = ``;
            return;   
        }

        const currentNodeID = currentNode.id;
        const currentNodeType = currentNode.name;
        //Check if node data has already been initialized
        if(store.state.nodeAttrs.hasOwnProperty(currentNodeID)){
            const nodeAttrs = store.state.nodeAttrs[currentNodeID];
            this.element.innerHTML = `
            <h3>${currentNodeType}</h3>
            ${nodeAttrs.map((attr,index) => {
                switch (attr.type){
                    case 'str':
                        return `
                        <label for=${attr.arg}${currentNodeID}> ${attr.arg} </label><br></br>
                        <input id=${index} label=${attr.arg} value=${attr.val}>`;
                        break;
                    case 'DataFrame':
                        return `
                        <label for=${attr.arg}${currentNodeID}> DataFrame </label><br></br>`
                    default:
                        break;
                }
            
                    
                    
               
               
            }).join('<br></br>')}`

            this.element.querySelectorAll('input').forEach(inp => {
                inp.addEventListener('change', () => {
                    const currentData = inp.value;
                    const index =  inp.id;
                    var updateDataDic = {}
                    updateDataDic['val'] = currentData;
                    var payload = {};
                    let newAttr = Object.assign(store.state.nodeAttrs[currentNodeID][index],updateDataDic);
                    let nodeAttrCopy = [...nodeAttrs];
                    nodeAttrCopy[index] = newAttr;
                    payload[currentNodeID] = nenodeAttrCopywAttr;
                    store.dispatch("addAttrs",payload);
                });
            });
            
            return;
        } 
        else {
            var payload = {};
            // payload[currentNodeID] = store.state.defaultAttrs[currentNodeType];
            const attributes = store.state.defaultAttrs[currentNodeType];
            let attributesWithVals = [...attributes]; 
            for(let i = 0; i < attributes.length;i++){
                attributesWithVals[i]['val'] = '';
            }
            payload[currentNodeID] = attributesWithVals;
            console.log(attributesWithVals);
            store.dispatch("addAttrs",payload);
            return;
        }
    }
};