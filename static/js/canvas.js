function addDefaults(defaultAttrs){
  const event = new CustomEvent('addDefaults',{detail: defaultAttrs});
  document.dispatchEvent(event);
}

function addFunctionToSource(funcToSource){
  const event = new CustomEvent('addFuncToSource',{detail: funcToSource});
  document.dispatchEvent(event);
}

