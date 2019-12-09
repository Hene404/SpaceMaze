//http://localhost:8000/main.html
// py -m http.server

var total = 0;
var state = {};
var stats = new Stats();
var layout = [];
var enemies = [];
var coins = [];
var players = [];
var transparencyList = [];
var end = false;
var exit_gate = vec3.fromValues(0, 0, 0);

window.onload = () => {
    parseSceneFile("./statefiles/alienScene.json", state, main);
}

/**
 *
 * @param {object - contains vertex, normal, uv information for the mesh to be made} mesh
 * @param {object - the game object that will use the mesh information} object
 * @purpose - Helper function called as a callback function when the mesh is done loading for the object
 */
function createMesh(mesh, object) {
    if (object.type === "mesh") {
        let testModel = new Model(state.gl, object.name, mesh, object.parent, object.material.ambient, object.material.diffuse, object.material.specular, object.material.n, object.material.alpha, object.texture);
        testModel.vertShader = state.vertShaderSample;
        testModel.fragShader = state.fragShaderSample;
        testModel.setup();
        testModel.model.position = object.position;
        if (object.scale) {
            testModel.scale(object.scale);
        }
        if (object.subtype == "enemy"){
          enemies.push(object.position);
        }
        if (object.subtype == "coin"){
          coins.push(object.position);
        }
        addObjectToScene(state, testModel);
    } else {
        let testLight = new Light(state.gl, object.name, mesh, object.parent, object.material.ambient, object.material.diffuse, object.material.specular, object.material.n, object.material.alpha, object.colour, object.strength);
        testLight.vertShader = state.vertShaderSample;
        testLight.fragShader = state.fragShaderSample;
        testLight.setup();
        testLight.model.position = object.position;
        if (object.scale) {
            testLight.scale(object.scale);
        }
        addObjectToScene(state, testLight);
    }
}

/**
 *
 * @param {string - type of object to be added to the scene} type
 * @param {string - url of the model being added to the game} url
 * @purpose **WIP** Adds a new object to the scene from using the gui to add said object
 */
function addObject(type, url = null) {
    if (type === "Cube") {
        let testCube = new Cube(state.gl, "Cube", null, [0.1, 0.1, 0.1], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], 10, 1.0);
        testCube.vertShader = state.vertShaderSample;
        testCube.fragShader = state.fragShaderSample;
        testCube.setup();

        addObjectToScene(state, testCube);
    }
}

function main() {
    stats.showPanel(0);
    document.getElementById("fps").appendChild(stats.dom);
    //document.body.appendChild( stats.dom );
    const canvas = document.querySelector("#glCanvas");

    // Initialize the WebGL2 context
    var gl = canvas.getContext("webgl2");

    // Only continue if WebGL2 is available and working
    if (gl === null) {
        printError('WebGL 2 not supported by your browser',
            'Check to see you are using a <a href="https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API#WebGL_2_2" class="alert-link">modern browser</a>.');
        return;
    }

    const vertShaderSample =
        `#version 300 es
        in vec3 aPosition;
        in vec3 aNormal;
        in vec2 aUV;
        in vec3 aVertBitang;

        uniform mat4 uProjectionMatrix;
        uniform mat4 uViewMatrix;
        uniform mat4 uModelMatrix;
        uniform mat4 normalMatrix;

        out vec3 oFragPosition;
        out vec3 oNormal;
        out vec3 normalInterp;
        out vec2 oUV;
        out vec3 oVertBitang;

        void main() {
            // Postion of the fragment in world space
            //gl_Position = vec4(aPosition, 1.0);
            gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);

            oFragPosition = (uModelMatrix * vec4(aPosition, 1.0)).xyz;
            oNormal = normalize((uModelMatrix * vec4(aNormal, 1.0)).xyz);
            normalInterp = vec3(normalMatrix * vec4(aNormal, 0.0));
            oUV = aUV;
            oVertBitang = aVertBitang;
        }
        `;

    const fragShaderSample =
        `#version 300 es
        #define MAX_LIGHTS 128
        precision highp float;

        in vec3 oFragPosition;
        in vec3 oNormal;
        in vec3 normalInterp;
        in vec2 oUV;
        in vec3 oVertBitang;

        uniform vec3 uCameraPosition;
        uniform int numLights;
        uniform vec3 diffuseVal;
        uniform vec3 ambientVal;
        uniform vec3 specularVal;
        uniform float nVal;
        uniform float alphaVal;
        uniform sampler2D uTexture;
        uniform int samplerExists;
        uniform int uTextureNormExists;
        uniform sampler2D uTextureNorm;
        uniform vec3 uLightPositions[MAX_LIGHTS];
        uniform vec3 uLightColours[MAX_LIGHTS];
        uniform float uLightStrengths[MAX_LIGHTS];

        out vec4 fragColor;

        void main() {
            vec3 normal = normalize(normalInterp);
            vec3 ambient = vec3(0,0,0);
            vec3 diffuse = vec3(0,0,0);
            vec3 specular = vec3(0,0,0);
            vec3 lightDirection;
            float lightDistance;

            if (uTextureNormExists == 1) {
                normal = texture(uTextureNorm, oUV).xyz;
                normal = 2.0 * normal - 1.0;
                normal = normal * vec3(5.0, 5.0, 5.0);
                vec3 biTangent = cross(oNormal, oVertBitang);
                mat3 nMatrix = mat3(oVertBitang, biTangent, oNormal);
                normal = normalize(nMatrix * normal);
            }

            for (int i = 0; i < numLights; i++) {
                lightDirection = normalize(uLightPositions[i] - oFragPosition);
                lightDistance = distance(uLightPositions[i], oFragPosition);

                //ambient
                ambient += (ambientVal * uLightColours[i]) * uLightStrengths[i];

                //diffuse
                float NdotL = max(dot(lightDirection, normal), 0.0);
                diffuse += ((diffuseVal * uLightColours[i]) * NdotL * uLightStrengths[i]) / lightDistance;

                //specular
                vec3 nCameraPosition = normalize(uCameraPosition); // Normalize the camera position
                vec3 V = normalize(nCameraPosition - oFragPosition);
                vec3 H = normalize(V + lightDirection); // H = V + L normalized

                if (NdotL > 0.0f)
                {
                    float NDotH = max(dot(normal, H), 0.0);
                    float NHPow = pow(NDotH, nVal); // (N dot H)^n
                    specular += ((specularVal * uLightColours[i]) * NHPow) / lightDistance;
                }
            }

            vec4 textureColor = texture(uTexture, oUV);

            if (samplerExists == 1) {
                fragColor = vec4((ambient + diffuse + specular) * textureColor.rgb, alphaVal);
            } else {
                fragColor = vec4(ambient + diffuse + specular, alphaVal);
            }

        }
        `;

    state = {
        ...state,
        gl,
        vertShaderSample,
        fragShaderSample,
        canvas: canvas,
        objectCount: 0,
        objectTable: {},
        lightTable: {},
        lightIndices: [],
        keyboard: {},
        mouse: { sensitivity: 0.2 },
        gameStarted: false,
        camera: {
            name: 'camera',
            position: vec3.fromValues(-3.0, 0.0, -3.5),
            center: vec3.fromValues(-3, 0.0, 0.0),
            up: vec3.fromValues(0.0, 1.0, 0.0),
            pitch: 0,
            yaw: 0,
            roll: 0
        },
        samplerExists: 0,
        samplerNormExists: 0
    };

    state.numLights = state.lights.length;

    //iterate through the level's objects and add them
    state.level.objects.map((object) => {
        if (object.type === "mesh" || object.type === "light") {
            parseOBJFileToJSON(object.model, createMesh, object);
        } else if (object.type === "cube") {
            let tempCube = new Cube(gl, object.name, object.parent, object.material.ambient, object.material.diffuse, object.material.specular, object.material.n, object.material.alpha, object.texture, object.textureNorm);
            tempCube.vertShader = vertShaderSample;
            tempCube.fragShader = fragShaderSample;
            tempCube.setup();
            tempCube.model.position = vec3.fromValues(object.position[0], object.position[1], object.position[2]);
            if (object.scale) {
                tempCube.scale(object.scale);
            }
            layout.push(tempCube.model.position);
            addObjectToScene(state, tempCube);
            if(object.name === "goal_square"){                                    //NOTE THIS IS VERY WEIRD
                exit_gate = object.position;
                console.log(exit_gate);
            }
        } else if (object.type === "plane") {
            let tempPlane = new Plane(gl, object.name, object.parent, object.material.ambient, object.material.diffuse, object.material.specular, object.material.n, object.material.alpha, object.texture, object.textureNorm);
            tempPlane.vertShader = vertShaderSample;
            tempPlane.fragShader = fragShaderSample;
            tempPlane.setup();

            tempPlane.model.position = vec3.fromValues(object.position[0], object.position[1], object.position[2]);
            if (object.scale) {
                tempPlane.scale(object.scale);
            }
            addObjectToScene(state, tempPlane);
        }
    })

    //setup mouse click listener
    /*
    canvas.addEventListener('click', (event) => {
        getMousePick(event, state);
    }) */
    startRendering(gl, state);
}

/**
 *
 * @param {object - object containing scene values} state
 * @param {object - the object to be added to the scene} object
 * @purpose - Helper function for adding a new object to the scene and refreshing the GUI
 */
function addObjectToScene(state, object) {
    //console.log(object);
    if (object.type === "light") {
        state.lights.push(object);
        state.lightIndices.push(state.objectCount);
        state.lightTable[object.name] = state.numLights;
        state.numLights++;
    }

    object.name = object.name;
    state.objects.push(object);
    state.objectTable[object.name] = state.objectCount;
    state.objectCount++;
}

function exit_open(){
    var x;
    for(i=0; i<state.objectCount; i++){
      //  console.log(state.objects[i].name);
        if(state.objects[i].name === "goal_square"){
            x = state.objects[i].model;
            x.texture = getTextures(state.gl, "./materials/Green.jpg");
        }
        
    }
}

/**
 *
 * @param {gl context} gl
 * @param {object - object containing scene values} state
 * @purpose - Calls the drawscene per frame
 */
function startRendering(gl, state) {
    // A variable for keeping track of time between frames
    var then = 0.0;
    var canPress = true;
    var currentView = 1;
    var alienSetup = false;
    updateTotal(total);

    // This function is called when we want to render a frame to the canvas
    function render(now) {
        stats.begin();
        now *= 0.001; // convert to seconds
        const deltaTime = now - then;
        then = now;

        state.deltaTime = deltaTime;

        //wait until the scene is completely loaded to render it
        if (state.numberOfObjectsToLoad <= state.objects.length) {
            if (!state.gameStarted) {
                startGame(state);
                state.gameStarted = true;
            }

            let alien = getObject(state, "alien");
            let enemy = getObject(state, "enemy");
            let enemy2 = getObject(state, "enemy2");
            let coin1 = getObject(state, "coin1");
            let coin2 = getObject(state, "coin2");
            let coin3 = getObject(state, "coin3");
            let coin4 = getObject(state, "coin4");
            let coin5 = getObject(state, "coin5");
            let playerPlace = getObject(state, "playerPlace");

            let enemyLight1 = getLight(state, "enemyLight1");
            let enemyLight2 = getLight(state, "enemyLight2");
            let coinLight1 = getLight(state, "coinLight1");
            let coinLight2 = getLight(state, "coinLight2");
            let coinLight3 = getLight(state, "coinLight3");
            let coinLight4 = getLight(state, "coinLight4");
            let coinLight5 = getLight(state, "coinLight5");

            let enemyList = [enemy, enemy2];
            let eLightList = [enemyLight1,enemyLight2];
            let coinList = [coin1,coin2,coin3,coin4,coin5];
            let cLightList = [coinLight1,coinLight2,coinLight3,coinLight4,coinLight5];

            if (state.keyboard["w"]) {
                if(canPress==true){
                  moveForward(state, currentView, alien, playerPlace, coinList);
                  updatePlayer();
                  moveEnemies();
                  canPress = false;
                  setTimeout(function(){canPress=true},250);
                }
            }
            if (state.keyboard["s"]) {
                if(canPress==true){
                  moveBackward(state, currentView, alien, coinList);
                  updatePlayer();
                  if (currentView==3){
                    moveEnemies();
                  }
                  canPress = false;
                  setTimeout(function(){canPress=true},250);
                }
            }
            if (state.keyboard["a"]) {
                if(canPress==true){
                  moveLeft(state, currentView, alien, coinList);
                  updatePlayer();
                  if (currentView==3){
                    moveEnemies();
                  }
                  canPress = false;
                  setTimeout(function(){canPress=true},250);
                }
            }
            if (state.keyboard["d"]) {
              if(canPress==true){
                moveRight(state, currentView, alien, coinList);
                updatePlayer();
                if (currentView==3){
                  moveEnemies();
                }
                canPress = false;
                setTimeout(function(){canPress=true},250);
              }
            }

            if (state.keyboard["r"]) {
                if(canPress == true && currentView == 1){
                  changeCamera3rd(state, alien, playerPlace);
                  canPress = false;
                  setTimeout(function(){canPress=true},250);
                  currentView = 3;
                }
                else if(canPress==true && currentView == 3) {
                  changeCamera1st(state, alien, playerPlace);
                  canPress = false;
                  setTimeout(function(){canPress=true},250);
                  currentView = 1;
                }
              }

              //wait function;
              //moveEnemy() MUST BE ADDED TO ALL MOVEMENT FUNCTIONS
              //FOR SOME, ONLY IF CURRENTVIEW IS 3
            if (state.keyboard["q"]) {
              if(canPress == true){
                moveEnemies();
                canPress = false;
                setTimeout(function(){canPress=true},250);
              }
            }

            if (state.mouse['camMove']) {
                //vec3.rotateY(state.camera.center, state.camera.center, state.camera.position, (state.camera.yaw - 0.25) * deltaTime * state.mouse.sensitivity);
                vec3.rotateY(state.camera.center, state.camera.center, state.camera.position, (-state.mouse.rateX * deltaTime * state.mouse.sensitivity));
            }

            //attach each enemyLight to an enemy
            //enemyLight.model.position = enemy.model.position; //set enemyLight's alpha to 0 in json for "model light"
            for(i=0;i<eLightList.length;i++){
              eLightList[i].model.position = enemyList[i].model.position;
            }

            //rotate each coin
            coinList.forEach(coin => mat4.rotateY(coin.model.rotation, coin.model.rotation, 0.2 * deltaTime));

            //attach each coinLight to a coin
            for(i=0;i<cLightList.length;i++){
              cLightList[i].model.position = coinList[i].model.position;
            }

            //rotate each alien to face the correct direction, and set direction
            if(alienSetup==false){
              mat4.rotate(alien.model.rotation, alien.model.rotation, 1.5708, vec3.fromValues(0,alien.centroid[1],0));
              mat4.rotate(alien.model.rotation, alien.model.rotation, 1.5708, vec3.fromValues(0,alien.centroid[1],0));
              mat4.rotate(enemy2.model.rotation, enemy2.model.rotation, -1.5708, vec3.fromValues(0,enemy2.centroid[1],0));
              enemy.model.movement = "down";
              enemy.model.directionZ = 2;
              enemy2.model.movement = "right";
              enemy2.model.directionX = 2;
              alien.model.position = (0,0,0);
              alienSetup = true;
            }

            //Set players matrix correctly for collisions.
            function updatePlayer(){
              if(currentView == 1){
                players[0] = playerPlace.model.position;
              }
              if(currentView == 3){
                players[0] = alien.model.position;
              }
              for(i=0;i<coins.length;i++){
                coins[i] = coinList[i].model.position;
              }
            }

            function moveEnemies(){
              enemyList.forEach(enemy => moveEnemy(state, enemy));
              for(i=0;i<enemies.length;i++){
                enemies[i] = enemyList[i].model.position;
              }
            }

            // Draw our scene
            drawScene(gl, deltaTime, state);
        }
        stats.end();
        // Request another frame when this one is done
        requestAnimationFrame(render);
    }

    // Draw the scene
    requestAnimationFrame(render);
}

/**
 *
 * @param {gl context} gl
 * @param {float - time from now-last} deltaTime
 * @param {object - contains the state for the scene} state
 * @purpose Iterate through game objects and render the objects aswell as update uniforms
 */
function drawScene(gl, deltaTime, state) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    gl.depthMask(false);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE_MINUS_CONSTANT_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things
    gl.clearDepth(1.0); // Clear everything
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let lightPositionArray = [], lightColourArray = [], lightStrengthArray = [];

    for (let i = 0; i < state.lightIndices.length; i++) {
        let light = state.objects[state.lightIndices[i]];
        //console.warn(light)
        for (let j = 0; j < 3; j++) {
            lightPositionArray.push(light.model.position[j]);
            lightColourArray.push(light.colour[j]);
        }
        lightStrengthArray.push(light.strength);
    }



    //Sort objects for transparency                                             //CANNOT SORT state.objects
    var sortedObjects = transparencyList.sort((a, b) => {
        return vec3.distance(b.model.position, state.camera.position) - vec3.distance(a.model.position, state.camera.position);
    });

    state.objects.map((object) => {
/*    for (i=0;i<sortedObjects.length;i++){
        let object = sortedObjects[i];*/
        if (object.loaded) {

            gl.useProgram(object.programInfo.program);
            {

                //Setup DepthMasking for all objects
                if (object.material.alpha < 1.0) {
                    gl.depthMask(false);
                    gl.enable(gl.BLEND);
                    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
                }
                else {
                    gl.disable(gl.BLEND);
                    gl.depthMask(true);
                    gl.enable(gl.DEPTH_TEST);
                    gl.depthFunc(gl.LEQUAL);
                }

                var projectionMatrix = mat4.create();
                var fovy = 60.0 * Math.PI / 180.0; // Vertical field of view in radians
                var aspect = state.canvas.clientWidth / state.canvas.clientHeight; // Aspect ratio of the canvas
                var near = 0.1; // Near clipping plane
                var far = 100.0; // Far clipping plane

                mat4.perspective(projectionMatrix, fovy, aspect, near, far);

                gl.uniformMatrix4fv(object.programInfo.uniformLocations.projection, false, projectionMatrix);

                state.projectionMatrix = projectionMatrix;

                var viewMatrix = mat4.create();
                mat4.lookAt(
                    viewMatrix,
                    state.camera.position,
                    state.camera.center,
                    state.camera.up,
                );
                gl.uniformMatrix4fv(object.programInfo.uniformLocations.view, false, viewMatrix);

               gl.uniform3fv(object.programInfo.uniformLocations.cameraPosition, state.camera.position);

                state.viewMatrix = viewMatrix;

                var modelMatrix = mat4.create();
                var negCentroid = vec3.fromValues(0.0, 0.0, 0.0);
                vec3.negate(negCentroid, object.centroid);

                mat4.translate(modelMatrix, modelMatrix, object.model.position);
                mat4.translate(modelMatrix, modelMatrix, object.centroid);
                mat4.mul(modelMatrix, modelMatrix, object.model.rotation);
                mat4.translate(modelMatrix, modelMatrix, negCentroid);
                mat4.scale(modelMatrix, modelMatrix, object.model.scale);

                object.modelMatrix = modelMatrix;

                var normalMatrix = mat4.create();
                mat4.invert(normalMatrix, modelMatrix);
                mat4.transpose(normalMatrix, normalMatrix);

                gl.uniformMatrix4fv(object.programInfo.uniformLocations.model, false, modelMatrix);
                gl.uniformMatrix4fv(object.programInfo.uniformLocations.normalMatrix, false, normalMatrix);

                gl.uniform3fv(object.programInfo.uniformLocations.diffuseVal, object.material.diffuse);
                gl.uniform3fv(object.programInfo.uniformLocations.ambientVal, object.material.ambient);
                gl.uniform3fv(object.programInfo.uniformLocations.specularVal, object.material.specular);
                gl.uniform1f(object.programInfo.uniformLocations.nVal, object.material.n);
                gl.uniform1f(object.programInfo.uniformLocations.alphaVal, object.material.alpha);

                gl.uniform1i(object.programInfo.uniformLocations.numLights, state.numLights);



                //use this check to wait until the light meshes are loaded properly
                if (lightColourArray.length > 0 && lightPositionArray.length > 0 && lightStrengthArray.length > 0) {
                    gl.uniform3fv(object.programInfo.uniformLocations.lightPositions, lightPositionArray);
                    gl.uniform3fv(object.programInfo.uniformLocations.lightColours, lightColourArray);
                    gl.uniform1fv(object.programInfo.uniformLocations.lightStrengths, lightStrengthArray);
                }

                {
                    // Bind the buffer we want to draw
                    gl.bindVertexArray(object.buffers.vao);

                    //check for diffuse texture and apply it
                    if (object.model.texture != null) {
                        state.samplerExists = 1;
                        gl.activeTexture(gl.TEXTURE0);
                        gl.uniform1i(object.programInfo.uniformLocations.samplerExists, state.samplerExists);
                        gl.uniform1i(object.programInfo.uniformLocations.sampler, 0);
                        gl.bindTexture(gl.TEXTURE_2D, object.model.texture);

                    } else {
                        gl.activeTexture(gl.TEXTURE0);
                        state.samplerExists = 0;
                        gl.uniform1i(object.programInfo.uniformLocations.samplerExists, state.samplerExists);
                        gl.bindTexture(gl.TEXTURE_2D, null);
                    }

                    //check for normal texture and apply it
                    if (object.model.textureNorm != null) {
                        state.samplerNormExists = 1;
                        gl.activeTexture(gl.TEXTURE1);
                        gl.uniform1i(object.programInfo.uniformLocations.normalSamplerExists, state.samplerNormExists);
                        gl.uniform1i(object.programInfo.uniformLocations.normalSampler, 1);
                        gl.bindTexture(gl.TEXTURE_2D, object.model.textureNorm);
                        //console.log("here")
                    } else {
                        gl.activeTexture(gl.TEXTURE1);
                        state.samplerNormExists = 0;
                        gl.uniform1i(object.programInfo.uniformLocations.normalSamplerExists, state.samplerNormExists);
                        gl.bindTexture(gl.TEXTURE_2D, null);
                    }

                    // Draw the object
                    const offset = 0; // Number of elements to skip before starting

                    //if its a mesh then we don't use an index buffer and use drawArrays instead of drawElements
                    if (object.type === "mesh" || object.type === "light") {
                        gl.drawArrays(gl.TRIANGLES, offset, object.buffers.numVertices / 3);
                    } else {
                        gl.drawElements(gl.TRIANGLES, object.buffers.numVertices, gl.UNSIGNED_SHORT, offset);
                    }
                }
            }
        }
    });
}
