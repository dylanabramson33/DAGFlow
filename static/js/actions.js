export default {
    addAttrs(context, payload) {
        context.commit('addAttrs', payload);
    },
    addDefaults(context, payload) {
        context.commit('addDefaults', payload);
    },
    changeNode(context, payload) {
        context.commit('changeNode', payload);
    },
};