setup();

function setup() {
    // Create a HTML tag to display to the user
    var navTag = document.createElement('nav');
    navTag.classList = "navbar navbar-expand-lg navbar-dark bg-dark";
    navTag.innerHTML = `
    <div>
    <a class="navbar-brand" href="#">Space Maze</a>
    </div
    `;

    // Insert the tag into the HMTL document
    document.getElementById('myNavBar').appendChild(navTag);
}

function updateTotal(end) {
    //get objects first
    if(total <= 5){
        let sideNav = document.getElementById("select");
        sideNav.innerHTML = total.toString() + "/5";
    }
    if(total === 5){
        let completeText = document.getElementById("complete");
        completeText.innerHTML = "The goal is open!"
        exit_open();
    }
}
function loseGame(){
    end = true;
    alert("You have lost, press f5 or refresh the page to try again.");
    console.log("lost");
}
function winGame(){
    end = true;
    alert("Congratulations, you won. Press f5 or refresh the page if you'd like to try again.")
    console.log("won");
}

function createSelectionOptions(optionsArr, selectObj) {
    optionsArr.map((option) => {
        let tempSelect = document.createElement("option");
        tempSelect.innerHTML = option;
        selectObj.appendChild(tempSelect);
    })
}

function handleTypeSelectChange(event) {
    if (event.target.value === "Mesh") {
        let addNav = document.getElementById("addObjectsNav");
        let addButton = addNav.lastChild;

        let fileUpload = document.createElement("input");
        fileUpload.id = "meshUpload";
        fileUpload.type = "file";
        fileUpload.classList = "form-control-file";

        addNav.insertBefore(fileUpload, addButton);
    } else {
        let fileUpload = document.getElementById("meshUpload");
        if (fileUpload) {
            fileUpload.remove();
        }

    }
}

function displayObjectValues(object) {
    let selectedObjectDiv = document.getElementById("selectedObject");
    selectedObjectDiv.innerHTML = "";

    let positionalInputDiv = document.createElement("div");
    positionalInputDiv.classList = "input-group";

    let prependDivX = document.createElement("div");
    prependDivX.classList = "input-group-prepend";

    objectPositionX = document.createElement("input");
    objectPositionX.addEventListener('input', (event) => {
        handlePositionChange('x', event.target.value, object.model);
    })
    objectPositionX.id = object.name + "-positionX";
    objectPositionX.classList = "form-control";
    objectPositionX.value = object.model.position[0];

    objectPositionY = document.createElement("input");
    objectPositionY.addEventListener('input', (event) => {
        handlePositionChange('y', event.target.value, object.model);
    })
    objectPositionY.id = object.name + "-positionY";
    objectPositionY.classList = "form-control";
    objectPositionY.value = object.model.position[1];

    objectPositionZ = document.createElement("input");
    objectPositionZ.addEventListener('input', (event) => {
        handlePositionChange('z', event.target.value, object.model);
    })
    objectPositionZ.id = object.name + "-positionZ";
    objectPositionZ.classList = "form-control";
    objectPositionZ.value = object.model.position[2];

    prependDivX.innerHTML = `
        <span class="input-group-text">X</span>
        `;
    let prependDivY = prependDivX.cloneNode(true);
    prependDivY.innerHTML = `
        <span class="input-group-text">Y</span>
        `;

    let prependDivZ = prependDivX.cloneNode(true);
    prependDivZ.innerHTML = `
        <span class="input-group-text">Z</span>
        `;


    let diffuseColorPicker = document.createElement("input");
    diffuseColorPicker.type = "color";
    diffuseColorPicker.classList = "form-control";
    diffuseColorPicker.value = "#ffffff";
    diffuseColorPicker.addEventListener('change', (event) => {
        let newColor = hexToRGB(event.target.value);
        object.material.diffuse = newColor;
    });

    positionalInputDiv.appendChild(prependDivX);
    positionalInputDiv.appendChild(objectPositionX);
    positionalInputDiv.appendChild(prependDivY);
    positionalInputDiv.appendChild(objectPositionY);
    positionalInputDiv.appendChild(prependDivZ);
    positionalInputDiv.appendChild(objectPositionZ);

    let objectTitle = document.createElement("h3");
    objectTitle.innerHTML = `<i>${object.name}</i>`;

    let positionTitle = document.createElement("h4");
    positionTitle.innerHTML = "<u>Position</u>";

    selectedObjectDiv.appendChild(objectTitle);
    selectedObjectDiv.appendChild(positionTitle);
    selectedObjectDiv.appendChild(positionalInputDiv);

    if (object.type === "mesh" || object.type === "primitive") {
        let diffuseTitle = document.createElement("h4");
        diffuseTitle.innerHTML = "<u>Diffuse Color</u>";
        selectedObjectDiv.appendChild(diffuseTitle);
        selectedObjectDiv.appendChild(diffuseColorPicker);
    }


}

function shaderValuesErrorCheck(programInfo) {
    let missing = [];
    //do attrib check
    Object.keys(programInfo.attribLocations).map((attrib) => {
        if (programInfo.attribLocations[attrib] === -1) {
            missing.push(attrib);
        }
    });
    //do uniform check
    Object.keys(programInfo.uniformLocations).map((attrib) => {
        if (!programInfo.uniformLocations[attrib]) {
            missing.push(attrib);
        }
    });

    if (missing.length > 0) {
        printError('Shader Location Error', 'One or more of the uniform and attribute variables in the shaders could not be located or is not being used : ' + missing);
    }
}

/**
 * A custom error function. The tag with id `webglError` must be present
 * @param  {string} tag Main description
 * @param  {string} errorStr Detailed description
 */
function printError(tag, errorStr) {
    // Create a HTML tag to display to the user
    var errorTag = document.createElement('div');
    errorTag.classList = 'alert alert-danger';
    errorTag.innerHTML = '<strong>' + tag + '</strong><p>' + errorStr + '</p>';

    // Insert the tag into the HMTL document
    //document.getElementById('webglError').appendChild(errorTag);

    // Print to the console as well
    //console.error(tag + ": " + errorStr);
}

function handlePositionChange(axis, value, model) {
    let newVal = parseFloat(value);

    if (!Number.isNaN(newVal)) {
        switch (axis) {
            case 'x':
                vec3.set(model.position, newVal, model.position[1], model.position[2]);
                break;
            case 'y':
                vec3.set(model.position, model.position[0], newVal, model.position[2]);
                break;

            case 'z':
                vec3.set(model.position, model.position[0], model.position[1], newVal);
                break;
        }
    }
}
