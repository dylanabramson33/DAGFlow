function addDefaults(defaultAttrs){
  const event = new CustomEvent('addDefaults',{detail: defaultAttrs});
  document.dispatchEvent(event);
}

