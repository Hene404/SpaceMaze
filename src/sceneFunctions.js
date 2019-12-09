function getObject(state, name) {
    return state.objects[state.objectTable[name]];
}

function getLight(state, name) {
    return state.lights[state.lightTable[name]];
}
