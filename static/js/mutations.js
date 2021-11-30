export default {
    addAttrs(state, payload) {
        Object.assign(state.nodeAttrs, payload);
        return state;
    },
    addDefaults(state, payload) {
        Object.assign(state.defaultAttrs, payload);
        return state;
    },
    addDefaultInputs(state, payload) {
        Object.assign(state.defaultAttrs, payload);
        console.log(state)
        return state;
    },
    changeNode(state, payload) {
        state.currentNode = payload
        return state;
    },

};