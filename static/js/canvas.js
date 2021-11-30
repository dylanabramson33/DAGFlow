var idGen = 0;
function addNode(val){
  nodeObj = { group: 'nodes',
          data: { id: idGen, name: val },
          position: { x: 200, y: 200 },
        }
  idGen += 1;
  cy.add(nodeObj);
}

function addDefaults(defaultArr){
  const event = new CustomEvent('addDefaults',{detail: defaultArr});
  document.dispatchEvent(event);
}
