//Move the enemy forward 1 space
function moveEnemy(state, enemyModel){
    let pCollide = 0;
    //This checks to see if the enemy has moved into the tile where the player is
    if(!checkCollision(enemyModel, 3, enemyModel.model.movement, "player")){
        pCollide = 1;
    }
    if(checkCollision(enemyModel, 3, enemyModel.model.movement)){ //enemy will always have it's model, and never need to use camera collision
      enemyPostionVector = vec3.fromValues(enemyModel.model.position[0] - enemyModel.model.directionX,
        enemyModel.model.position[1], enemyModel.model.position[2] - enemyModel.model.directionZ);
      enemyModel.model.position = [enemyPostionVector[0], enemyPostionVector[1], enemyPostionVector[2]];
    }
    else{
      enemyModel.model.directionX = enemyModel.model.directionX * -1;
      enemyModel.model.directionZ = enemyModel.model.directionZ * -1;
      rotateEnemy(state, enemyModel);
      switch (enemyModel.model.movement){
        case "up":
            enemyModel.model.movement = "down";
            break;
        case "down":
            enemyModel.model.movement = "up";
            break;
        case "left":
            enemyModel.model.movement = "right";
            break;
        case "right":
            enemyModel.model.movement = "left";
            break;
        default:
            break;
      }
    }
    if (pCollide == 1){
      //Change this to game over state.
      //console.log("Enemy collides with player.");
      //pCollide = 0;
      if(end=== false){
        loseGame();
        console.log("failed");
      }
    }
}

//Rotate the enemy 180 degrees
//Used when contact is made with a wall
function rotateEnemy(state, enemyModel){
    mat4.rotate(enemyModel.model.rotation, enemyModel.model.rotation, (-1.5708*2), vec3.fromValues(0,enemyModel.centroid[1],0));
}
