import AttributeEditor from './components/AttributeEditor.js'
import store from './index.js';

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
        
        return  sourceNode.edgesWith(targetNode).length == 0 && sourceNode != targetNode; // e.g. disallow loops
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
    if(evtTargetData != undefined && evtTargetData.hasOwnProperty("name")){
      store.dispatch("changeNode",{id : evtTargetData.id, name : evtTargetData.name});
    }
  });

});

document.addEventListener('addDefaults', function (e) {  
  store.dispatch("addDefaults",e.detail)
}, false);


const statusInstance = new AttributeEditor();
statusInstance.render();






