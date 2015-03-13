function loadNextLevel() {
		for (var i = 0; i < planets.length; i++) {
			planets.splice(i, 1);
		}
		for (var i = 0; i < flags.length; i++) {
			flags.splice(i, 1);
		}
		
		canFire = false;
		flaggedCount = 0;
		
		if (levelCount === 1) {
			loadLevel2();
		
		} else if (levelCount === 2) {
			loadLevel3();
		
		} else {
			context.save();
			context.beginPath();
			context.fillStyle = "green";
			context.fillRect(canvas.width / 4, canvas.height / 4, canvas.width / 2, canvas.height / 2.5);
			context.fill();
			context.stroke();
			context.strokeStyle = "black";
			context.fillStyle = "black";
			context.font = "40px Courier";
			context.fillText("You Win!", (canvas.width / 4) + 26, (canvas.height / 4) + 40);
			context.font = "20px Courier";
			context.fillText("(click for next level)", (canvas.width / 4) + 30, (canvas.height / 4) + 170);
			/*
			context.fill();
			context.stroke();
			context.font = "20px Verdana";
			context.fillText("Enemies Killed: " + score, (canvas.width / 4) + 20, (canvas.height / 4) + 80);
			context.fillText("Accuracy: " + accuracy.toFixed(2) + "%", (canvas.width / 4) + 20, (canvas.height / 4) + 110);
			context.fillText("Enemies Spawned: " + enemiesSpawned, (canvas.width / 4) + 10, (canvas.height / 4) + 140);
			context.fill();
			context.stroke();
			*/
			window.setTimeout( function() { 			
				//canvas.addEventListener('mousedown', function () {
					context.restore();
					location.reload();
				//}, false);
			 }, 1000);
		}
	}
	
	
	function loadLevel2 () {
		for (var i = 0; i < planets.length; i++) {
			planets.splice(i, 1);
		}
		for (var i = 0; i < flags.length; i++) {
			flags.splice(i, 1);
		}
		
		ship.x = -100;
		flagCount = 3;
		flaggedCount = 0;
		claimsNeeded = 2;
		
		//Level 2
		planets[0] = new Planet (20);
		planets[0].sun = true;
		planets[0].color = "yellow";
		planets[0].radius = 30;
		planets[0].gravityRadius = 175;
		
		planets[1] = new Planet (5);
		planets[1].radius = 18;
		planets[1].x = canvas.width / 2;
		planets[1].y = canvas.height - 80;
		planets[1].targetX = planets[0].x;
		planets[1].targetY = planets[0].y;	
		planets[1].orbit = true;
		
		levelCount++;
		canFire = true;
	}
	
	function loadLevel3 () {
		for (var i = 0; i < planets.length; i++) {
			planets.splice(i, 1);
		}
		for (var i = 0; i < flags.length; i++) {
			flags.splice(i, 1);
		}
		
		canFire = true;
		
		ship.x = -100;
		flagCount = 3;
		flaggedCount = 0;
		claimsNeeded = 2;
		
		//Level 3
		planets[0] = new Planet (20);
		planets[0].sun = true;
		planets[0].color = "yellow";
		planets[0].radius = 25;
		planets[0].gravityRadius = 175;
		
		planets[1] = new Planet (5);
		planets[1].radius = 15;
		planets[1].x = canvas.width / 2;
		planets[1].y = canvas.height - 35;
		planets[1].targetX = planets[0].x;
		planets[1].targetY = planets[0].y;	
		planets[1].orbit = true;
		
		planets[2] = new Planet (5);
		planets[2].radius = 10;
		planets[2].x = canvas.width / 2;
		planets[2].y = canvas.height - 120;
		planets[2].targetX = planets[0].x;
		planets[2].targetY = planets[0].y;	
		planets[2].orbit = true;
		planets[2].orbitRadius = 175;
		planets[2].orbitSpeed = 0.01;
		
		planets[3] = new Planet (3);
		planets[3].radius = 6;
		planets[3].x = canvas.width / 2;
		planets[3].y = canvas.height - 120;
		planets[3].targetX = planets[0].x;
		planets[3].targetY = planets[0].y;	
		planets[3].orbit = true;
		planets[3].orbitRadius = 150;
		planets[3].orbitSpeed = 0.05;
		planets[3].color = "white";
		planets[3].enemy = true;
		
		
		
		levelCount++;
		//end level 3
	}
	
	//load first level on window load
	//Level 1
	planets[0] = new Planet (5);
	planets[0].sun = true;
	planets[0].color = "yellow";
	planets[0].radius = 40;
	planets[0].gravityRadius = 200;
	planets[0].targetX = planets[0].x;
	planets[0].targetY = planets[0].y;
	planets[0].orbit = false;
	
	planets[1] = new Planet (25);
	planets[1].x = canvas.width / 2;
	planets[1].y = canvas.height - 80;
	planets[1].targetX = canvas.width/2;
	planets[1].targetY = canvas.height - 80;
	//End Level 1
	
	
	/*
	//Level 2
	planets[0] = new Planet (20);
	planets[0].sun = true;
	planets[0].color = "yellow";
	planets[0].radius = 30;
	planets[0].gravityRadius = 175;
	
	planets[1] = new Planet (5);
	planets[1].radius = 18;
	planets[1].x = canvas.width / 2;
	planets[1].y = canvas.height - 80;
	planets[1].targetX = planets[0].x;
	planets[1].targetY = planets[0].y;	
	planets[1].orbit = true;
	//end Level 2
	*/
	
	/*
	//Level 3
	planets[0] = new Planet (20);
	planets[0].sun = true;
	planets[0].color = "yellow";
	planets[0].radius = 25;
	planets[0].gravityRadius = 175;
	
	planets[1] = new Planet (5);
	planets[1].radius = 15;
	planets[1].x = canvas.width / 2;
	planets[1].y = canvas.height - 35;
	planets[1].targetX = planets[0].x;
	planets[1].targetY = planets[0].y;	
	planets[1].orbit = true;
	
	planets[2] = new Planet (5);
	planets[2].radius = 10;
	planets[2].x = canvas.width / 2;
	planets[2].y = canvas.height - 120;
	planets[2].targetX = planets[0].x;
	planets[2].targetY = planets[0].y;	
	planets[2].orbit = true;
	planets[2].orbitRadius = 175;
	planets[2].orbitSpeed = 0.01;
	//end level 3
	
	*/
	//Level 4
	
	
	//End level 4
	