import defaults from './NodeDefaults.js';
import nodeManager from './NodeManager.js';

function checkCanConnect(outputParamTypes,inputParamTypes){
  return inputParamTypes.includes(outputParamTypes[0]);
}

var drawModeEnabled = false;
document.addEventListener('DOMContentLoaded', function(){
    var cy = window.cy = cytoscape({
      container: document.getElementById('cy'),
      layout: {
        name: 'concentric',
        concentric: function(n){ return n.id() === 'j' ? 200 : 0; },
        levelWidth: function(nodes){ return 100; },
        minNodeSpacing: 100
      },
      style: [
        {
          selector: 'node[name]',
          style: {
            'content': 'data(name)',
          }
        },

        {
          selector: 'edge',
          style: {
            'curve-style': 'bezier',
            'target-arrow-shape': 'triangle'
          }
        },

        // some style for the extension

        {
          selector: '.eh-handle',
          style: {
            'background-color': 'red',
            'width': 12,
            'height': 12,
            'shape': 'ellipse',
            'overlay-opacity': 0,
            'border-width': 12, // makes the handle easier to hit
            'border-opacity': 0
          }
        },

        {
          selector: '.eh-hover',
          style: {
            'background-color': 'red'
          }
        },

        {
          selector: '.eh-source',
          style: {
            'border-width': 2,
            'border-color': 'red'
          }
        },

        {
          selector: '.eh-target',
          style: {
            'border-width': 2,
            'border-color': 'red'
          }
        },

        {
          selector: '.eh-preview, .eh-ghost-edge',
          style: {
            'background-color': 'red',
            'line-color': 'red',
            'target-arrow-color': 'red',
            'source-arrow-color': 'red'
          }
        },

        {
          selector: '.eh-ghost-edge.eh-preview-active',
          style: {
            'opacity': 0
          }
        }
      ],

      elements: {
        nodes: [

        ],
        edges: [
  
        ]
      }
    });
   
    

    var eh = cy.edgehandles({
      snap: false,
      noEdgeEventsInDraw: true,
      hoverDelay: 1000, // time spent hovering over a target node before it is considered selected
      snap: true, // when enabled, the edge can be drawn by just moving close to a target node (can be confusing on compound graphs)
      snapThreshold: 50, // the target node must be less than or equal to this many pixels away from the cursor/finger
      snapFrequency: 15,
      canConnect: function( sourceNode, targetNode ){
        if(targetNode.data() == undefined){
          return false;
        }
        
        const outputTypes = nodeManager.getOutputTypes(sourceNode.data().id);
        const inputTypes = nodeManager.getInputTypes(targetNode.data().id);
        let typesMatch = inputTypes.includes(outputTypes);
        return sourceNode.edgesWith(targetNode).length == 0 && 
        sourceNode != targetNode && 
        typesMatch;
      },
      
    });



  document.addEventListener("keydown", event => {
    if(event.key === 'Backspace') {
      cy.remove('node:selected');
      cy.remove('edge:selected');
    }
  }
  );

  document.addEventListener("keydown", event => {
    if(event.key == "e")
      drawModeEnabled = !drawModeEnabled;
      if(drawModeEnabled) {
        eh.enable();
        eh.enableDrawMode();
      }
      else {
        eh.disable();
        eh.disableDrawMode();
      }
    }
  );
  
  cy.on('tap', function(event) {
    var evtTargetData = event.target.data();
    if(evtTargetData.hasOwnProperty('id')){
      nodeManager.changeCurrent(evtTargetData.id,evtTargetData.name);
    }

  });

  var idGen = 0;
  function addNode(event){
    const nodeType = event.target.value;
    const nodeObj = { group: 'nodes',
      data: { id: idGen, name: nodeType},
      position: { x: 200, y: 200 },
    }
    cy.add(nodeObj);
    nodeManager.changeCurrent(idGen,nodeType);
    idGen += 1;
  }

  cy.on('add','edge',function(edge) {
    let sourceID = edge.target.data().source;
    let targetID = edge.target.data().target;
    if(isNaN(sourceID) || isNaN(targetID)){
      return;
    }
    sourceID = parseInt(sourceID);
    targetID = parseInt(targetID);

    const outputType = nodeManager.getOutputTypes(sourceID);
    nodeManager.setInputTypeToVal(targetID,outputType,sourceID);
  });
  cy.on('remove','edge',function(edge) {
    let sourceID = edge.target.data().source;
    let targetID = edge.target.data().target;

    if(isNaN(sourceID) | isNaN(targetID)){
      return;
    }
    sourceID = parseInt(sourceID);
    targetID = parseInt(targetID);
    const outputType = nodeManager.getOutputTypes(sourceID);
    nodeManager.setInputTypeToVal(targetID,outputType,'');
  });
  document.querySelectorAll('.sideButton').forEach(item => {
    item.addEventListener('click',addNode);
  });

  

});

document.addEventListener('addDefaults', function (e) {  
  defaults.addDefaults(e.detail);
}, false);








