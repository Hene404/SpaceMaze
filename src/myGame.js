var moveSpeed = 2;
var playerCenter = vec3.fromValues(0,0,0);
var playerDirection = null; //0N 1E 2S 3W
var originalDirection = 0;
var currentDirection = null;

function startGame(state) {
    document.addEventListener("contextmenu", function (e) {
        e.preventDefault();
    }, false);

    document.addEventListener('mousemove', (event) => {
        //handle right click
        if (event.buttons == 2) {
            state.mouse['camMove'] = true;
            state.mouse.rateX = event.movementX;
        }
    });

    document.addEventListener('mouseup', (event) => {
        state.mouse['camMove'] = false;
        state.mouse.rateX = 0;
    })

    document.addEventListener('keypress', (event) => {
        switch (event.code) {
            case "KeyW":
                state.keyboard[event.key] = true;
                break;

            case "KeyS":
                state.keyboard[event.key] = true;
                break;

            case "KeyA":
                state.keyboard[event.key] = true;
                break;

            case "KeyD":
                state.keyboard[event.key] = true;
                break;

            case "KeyR":
                state.keyboard[event.key] = true;
                break;

            case "KeyQ":
                state.keyboard[event.key] = true;
                break;

            default:
                break;
        }
    });

    document.addEventListener('keyup', (event) => {
        switch (event.code) {
            case "KeyW":
                state.keyboard[event.key] = false;
                break;

            case "KeyS":
                state.keyboard[event.key] = false;
                break;

            case "KeyA":
                state.keyboard[event.key] = false;
                break;

            case "KeyD":
                state.keyboard[event.key] = false;
                break;

            case "KeyR":
                state.keyboard[event.key] = false;
                break;

            case "KeyQ":
                state.keyboard[event.key] = false;
                break;

            case "KeyZ":
                state.lightIndices.map((index) => {
                    let light = state.objects[index];
                    light.strength += 0.5;
                })
                break;

            case "KeyX":
                state.lightIndices.map((index) => {
                    let light = state.objects[index];
                    light.strength -= 0.5;
                })
                break;

            default:
                break;
        }
    });
}

function printForwardVector(state, important = null) {
    let vMatrix = state.viewMatrix;
    if (important) {
        console.warn(vMatrix[2], vMatrix[6], vMatrix[10])
    } else {
        console.log(vMatrix[2], vMatrix[6], vMatrix[10])
    }

}

function moveForward(state, currentView, playerModel, playerPlace, coinList) {
    if(currentView == 1){
      let fpDirection = "";
      let upDown = 0;
      let leftRight = 0;
      while(originalDirection<0){
        originalDirection+=4;
      }
      originalDirection = originalDirection%4; //becomes 0123
      switch (originalDirection){
        case 0:
          fpDirection = "up";
          upDown = 2;
          break;
        case 1:
          fpDirection = "right";
          leftRight = -2;
          break;
        case 2:
          fpDirection = "down";
          upDown = -2;
          break;
        case 3:
          fpDirection = "left";
          leftRight = 2;
          break;
        default:
          break;
      }
      let cCollide = false;
      if(playerCollisions(playerPlace, currentView, fpDirection, coinList)){
        cCollide = true;
      }
      if(checkCollision(playerPlace, currentView, fpDirection)){
        playerPostionVector = vec3.fromValues(playerPlace.model.position[0]+ leftRight, playerPlace.model.position[1], playerPlace.model.position[2] + upDown);
        playerCenter = vec3.fromValues(playerCenter[0] + leftRight, playerCenter[1], playerCenter[2] + upDown);
        playerPlace.model.position = [playerPostionVector[0], playerPostionVector[1], playerPostionVector[2]];
        state.camera.position = playerPlace.model.position;
        state.camera.center = [state.camera.center[0]+leftRight, state.camera.center[1], state.camera.center[2]+upDown];
      }
      if(cCollide == true){
        removeCoin(playerPlace.model.position, coinList);
        total += 1;
        updateTotal();
      }
    }
    if(currentView == 3){
      let cCollide = false;
      if(playerCollisions(playerModel, currentView, "up", coinList)){
        cCollide = true;
      }
      if(checkCollision(playerModel, currentView, "up")){
        playerPostionVector = vec3.fromValues(playerModel.model.position[0], playerModel.model.position[1], playerModel.model.position[2] + 2);
        playerCenter = vec3.fromValues(playerCenter[0], playerCenter[1], playerCenter[2] + 2);
        playerModel.model.position = [playerPostionVector[0], playerPostionVector[1], playerPostionVector[2]];
      }
      if(cCollide == true){
        removeCoin(playerModel.model.position, coinList);
        total += 1;
        updateTotal();
      }
      playerDirection = 0;
      //Rotate playerModel in correct direction
      rotateModel(state, playerModel);
    }
}

//DO WE ALLOW ANY BACKWARDS MOVEMENT IN 1ST PERSON?
function moveBackward(state, currentView, playerModel, coinList) {
      if(currentView == 3){
        let cCollide = false;
        if(playerCollisions(playerModel, currentView, "down", coinList)){
          cCollide = true;
        }
        if(checkCollision(playerModel, currentView, "down")){
          playerPostionVector = vec3.fromValues(playerModel.model.position[0], playerModel.model.position[1], playerModel.model.position[2] - 2);
          playerCenter = vec3.fromValues(playerCenter[0], playerCenter[1], playerCenter[2] - 2);
          playerModel.model.position = [playerPostionVector[0], playerPostionVector[1], playerPostionVector[2]];
        }
        if(cCollide == true){
          removeCoin(playerModel.model.position, coinList);
          total += 1;
          updateTotal();
        }
        playerDirection = 2;
        //Rotate playerModel in correct direction
        rotateModel(state, playerModel);
      }
}

function moveLeft(state, currentView, playerModel, coinList) {
      if(currentView == 1){
        vec3.rotateY(state.camera.center, state.camera.center, state.camera.position, 1.5708);
        originalDirection -= 1;
        //rotate alien
        mat4.rotate(playerModel.model.rotation, playerModel.model.rotation, -1.5708, vec3.fromValues(0,playerModel.centroid[1],0));
      }
      if(currentView == 3){
        let cCollide = false;
        if(playerCollisions(playerModel, currentView, "left", coinList)){
          cCollide = true;
        }
        if(checkCollision(playerModel, currentView, "left")){
          playerPostionVector = vec3.fromValues(playerModel.model.position[0]+2, playerModel.model.position[1], playerModel.model.position[2]);
          playerCenter = vec3.fromValues(playerCenter[0]+2, playerCenter[1], playerCenter[2]);
          playerModel.model.position = [playerPostionVector[0], playerPostionVector[1], playerPostionVector[2]];
        }
        if(cCollide == true){
          removeCoin(playerModel.model.position, coinList);
          total += 1;
          updateTotal();
        }
        playerDirection = 3;
        //Rotate playerModel in correct direction
        rotateModel(state, playerModel);
      }
}

function moveRight(state, currentView, playerModel, coinList) {
      if(currentView == 1){
        vec3.rotateY(state.camera.center, state.camera.center, state.camera.position, -1.5708);
        originalDirection += 1;
        //rotate alien
        mat4.rotate(playerModel.model.rotation, playerModel.model.rotation, 1.5708, vec3.fromValues(0,playerModel.centroid[1],0));
      }
      if(currentView == 3){
        let cCollide = false;
        if(playerCollisions(playerModel, currentView, "right", coinList)){
          cCollide = true;
        }
        if(checkCollision(playerModel, currentView, "right")){
          playerPostionVector = vec3.fromValues(playerModel.model.position[0]-2, playerModel.model.position[1], playerModel.model.position[2]);
          playerCenter = vec3.fromValues(playerCenter[0]-2, playerCenter[1], playerCenter[2]);
          playerModel.model.position = [playerPostionVector[0], playerPostionVector[1], playerPostionVector[2]];
        }
        if(cCollide == true){
          removeCoin(playerModel.model.position, coinList);
          total += 1;
          updateTotal();
        }
        playerDirection = 1;
        //Rotate playerModel in correct direction
        rotateModel(state, playerModel);
      }
}

//Change the camera view from a topdown perspective to a 1st person perspective
function changeCamera1st(state, playerModel, playerPlace) {
      //move Camera to MODEL position (temporarily alien)
      //fix center and up
      //hide MODEL by moving to position outside of sight
      state.camera.position = (playerModel.model.position);
      playerPlace.model.position = playerModel.model.position;
      //state.camera.center = vec3.fromValues(0.5, 0.0, 0.0); //should be current direction?
      state.camera.center = playerCenter;
      rotateCenter(state);
      state.camera.up = vec3.fromValues(0.0, 1.0, 0.0);
      playerModel.model.position = (0,0,0);

      //return a center and contin
}

//Change the camera view from 1st person to 3rd person top down
function changeCamera3rd(state, playerModel, playerPlace){
      //move MODEL(temporarily Alien) to Current camera center
      //move Camera to some fixed point above map
      //fix center and up
      playerModel.model.position = state.camera.position;
      playerCenter = state.camera.center;
      state.camera.position = [6.5,30.0,8.5]; //should be center of board, with Y coordinate high enough to see full board
      state.camera.center = vec3.fromValues(6.5,0.0,8.5); //should be center of board
      state.camera.up = vec3.fromValues(0.0,0.0,1.0);
      playerPlace.model.position = (0,0,0);
      while(originalDirection<0){
        originalDirection+=4;
      }
      originalDirection = originalDirection%4; //becomes 0123
      playerDirection = originalDirection;
      currentDirection = originalDirection;
}

function rotateCenter(state){
      let directionDifference = playerDirection - originalDirection;
      while(directionDifference<0){
        directionDifference+=4;
      }
      for(i=0;i<directionDifference;i++){
        vec3.rotateY(state.camera.center, state.camera.center, state.camera.position, -1.5708);
      }
      originalDirection = playerDirection;
      playerDirection = null;
}

function rotateModel(state,playerModel){
//original direction minus playerdirection, rotate that many times
    let directionDifference = currentDirection - playerDirection;
    while(directionDifference<0){
      directionDifference+=4;
    }
    for(i=0;i<directionDifference;i++){
      mat4.rotate(playerModel.model.rotation, playerModel.model.rotation, -1.5708, vec3.fromValues(0,playerModel.centroid[1],0));
    }
    currentDirection = playerDirection;
}
//This is called before moving the player, to check whether the player has hit
//an NPC or Object
function playerCollisions(playerModel, currentView, movementDirection, coinList){
	if(!checkCollision(playerModel, 3, movementDirection, "coin")){
        console.log("Player collides with Coin");
        return 1;
        //remove coin
        /*removeCoin(playerModel.model.position, coinList);
        total += 1;
        updateTotal();*/
	}
  return 0;
/*	if(!checkCollision(playerModel, 3, movementDirection, "enemy")){
	    //console.log("Player collides with Enemy");
      if(end=== false){
        loseGame();
        console.log("failed");
      }
	}*/
}

//remove a found coin from the scene.
function removeCoin(found, coinList){
  for(i=0;i<coinList.length;i++){
    console.log(coinList[i].model.position);
    if(coinList[i].model.position[0] == found[0]&&coinList[i].model.position[1] == found[1]&&coinList[i].model.position[2] == found[2]){
      console.log("ONE OF EM EQUALS")
      coinList[i].model.position = [0,0,0];
    }
  }
}

function checkCollision(playerModel, currentView, movementDirection, collisionType = "layout"){ //0 is collision, 1 is no collision
    let collide = "";
    switch (collisionType){
      case "layout":
        collide = layout;
        break;
      case "enemy":
        collide = enemies;
        break;
      case "coin":
        collide = coins;
        break;
      case "player":
	    collide = players;
      default:
        break;
    }
    var upDown = 0;
    var leftRight = 0;
    switch (movementDirection){
      case "up":
          if (collide == layout){
            if(playerModel.model.position[2] >= 16.5){
              return 0;
            }
          }
          upDown = 2;
          break;
      case "down":
          if (collide == layout){
            if(playerModel.model.position[2] <= -3.5){
              return 0;
            }
          }
          upDown = -2;
          break;
      case "left":
          if (collide == layout){
            if(playerModel.model.position[0] >= 19){
              return 0;
            }
          }
          leftRight = 2;
          break;
      case "right":
          if (collide == layout){
            if(playerModel.model.position[0] <= -3){
              return 0;
            }
          }
          leftRight = -2;
          break;
      default:
          break;
    }

    var next_posx = playerModel.model.position[0] + leftRight;
    var next_posy = playerModel.model.position[2] + upDown;

    var exit_posy_min = exit_gate[2] - 1;
    var exit_posy_max = exit_gate[2] + 1;

    for(i=0; i<collide.length; i++){
        var posx_min = collide[i][0] - 1;
        var posx_max = collide[i][0] + 1;
        var posy_min = collide[i][2] - 1;
        var posy_max = collide[i][2] + 1;
        if((next_posx > posx_min && next_posx <= posx_max) && (next_posy > posy_min && next_posy <= posy_max)){
            if(next_posx > exit_gate[0] && (next_posy > exit_posy_min && next_posy <= exit_posy_max)){
                if(end === false && total >= 5){
                    winGame();
                }
            }
            return 0;
        }
    }
  return 1; //No collisions
}
