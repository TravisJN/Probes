//global variables
	var canvas = document.getElementById('canvas'),
		context = canvas.getContext('2d'),
		mouse = utils.captureMouse(canvas);
		
		//objects
		function Ship (x, y) {
		this.width = 50;
		this.height = 15;
		this.wingSize = 10;
		this.turretRadius = this.width / 8;
		this.turretWidth = 4;
		this.turretHeight = 12;
		
		this.x = x;
		this.y = y;
		this.turretX = this.x + this.width / 2;
		this.turretyY = this.y + this.height;
		this.orientation = 0;
		
		this.targetX = 225;
		this.targetY = 25;
		
		this.vx = 0;
		this.vy = 0;
		
		this.steerX = 0;
		this.steerY = 0;
		
		this.maxAcceleration = 0.2;
		this.maxVelocity = .2
		
		
	}
	
	function Flag () {
		this.x = 0;
		this.y = 0;
		this.orientation = Math.PI / 2;
		
		this.vx = 0;
		this.vy = 0;
		
		this.steerX = 0;
		this.steerY = 0;
		
		this.maxAcceleration = 0.2;
		this.maxVelocity = 5;
		
		this.jumpForce = 25;
		//this.onShip = true;
		this.landed = false;
		this.onPlanet;
		
		this.headRadius = 3;
		this.height = 12;
		this.hitBox = 3;
		this.radius = 3;  //added for checkBoundary function
	}
	
	function Star (x, y) {
		this.x = x;
		this.y = y;
	}
	
	function Planet (gravity) {
		this.x = canvas.width / 2;
		this.y = canvas.height / 2;
		this.radius = 25;
		
		this.gravity = gravity;
		this.gravityRadius = 125;   //gravity force is only applied within this distance to planet
		
		this.spring = 0;
		this.friction = 0;
		
		this.targetX = this.x;
		this.targetY = this.y;
		
		this.vx = 0;
		this.vy = 0;
		this.color = "brown";
		this.orbitRadius = 100;  //how far away this planet orbits its target
		this.orbit = false;		//boolean for whether planet is orbiting or not
		this.orbitSpeed = 0.02;		//circular velocity
		this.maxVelocity = 5;
		
		this.flagged = false;    //has planet been hit by a flag
		
		this.sun = false;   
		this.enemy = false;
		this.pursuing = false;
	}
	
	function Enemy () {
		this.x = canvas.width / 2;
		this.y = canvas.height - 120;
		this.radius = 6;
		
		//this.gravity = gravity;
		this.gravityRadius = 125;   //gravity force is only applied within this distance to planet
		
		this.spring = 0;
		this.friction = 0;
		
		this.targetX = canvas.width / 2;
		this.targetY = canvas.width / 2;
		
		this.vx = 0;
		this.vy = 0;
		this.color = "white";
		this.orbitRadius = 150;  //how far away this planet orbits its target
		this.orbit = true;		//boolean for whether planet is orbiting or not
		this.orbitSpeed = 0.05;		//circular velocity
		
		this.maxVelocity = 5;		//maximum speed enemy can travel while pursuing
		
		this.pursuing = false;
		this.pursuitRadius = 75;	//how close the flag needs to be in order for enemy to start pursuing
		
		/*
		planets[3].radius = 6;
		planets[3].x = canvas.width / 2;
		planets[3].y = canvas.height - 120;
		planets[3].targetX = planets[0].x;
		planets[3].targetY = planets[0].y;	
		planets[3].orbit = true;
		planets[3].orbitRadius = 150;
		planets[3].orbitSpeed = 0.05;
		*/
	}
	
	function Bullet(x, y, targetx, targety) {
		this.x = x;
		this.y = y;
		this.damage = 1;
		this.velocity = 7;
		this.radius = 7;
		this.color = "red";
		this.targetx = targetx;
		this.targety = targety;
		this.angle = 0;
	}
	
	//prototypes
	Star.prototype.draw = function () {
		context.save();
		context.beginPath();
		context.fillStyle = "white";
		context.arc(this.x, this.y, starRadius, 0, 2*Math.PI, true);
		context.fill();
		context.restore();
	}
	
	Ship.prototype.draw = function () {
		context.save();
		context.beginPath();
		context.fillStyle = "grey";
		//draw ship body
		context.fillRect(this.x, this.y, this.width, this.height);
		//draw front of ship
		context.arc(this.x + this.width, this.y + this.height / 2, this.width / 3, 0, Math.PI * 2, true);
		//draw ship's wings
		context.moveTo(this.x, this.y);
		context.lineTo(this.x, this.y - this.wingSize);
		context.lineTo(this.x + this.wingSize, this.y);
		context.moveTo(this.x, this.y + this.height);
		context.lineTo(this.x, this.y + this.height + this.wingSize);
		context.lineTo(this.x + this.wingSize, this.y + this.height);
		context.fill();
		//draw turret
	
		context.arc(this.turretX, this.turretY, this.turretRadius, 0, 2 * Math.PI, true);
		context.translate(this.turretX, this.turretY);
		context.rotate(this.orientation);
		context.fillRect(0 - this.turretWidth / 2, 0, this.turretWidth, this.turretHeight);
		context.fill();
		
		//art
		
		
		//spaceship.onload = function () {
			//context.drawImage(spaceship, 0, 0);
		//}
		
		
		context.restore();
	}
	
	
	
	Flag.prototype.draw = function () {
		context.save();
		//rotate
		context.beginPath();
		context.translate(this.x, this.y);
		context.rotate(this.orientation);
		//draw head
		context.beginPath();
		context.strokeStyle = "green";
		context.fillStyle = "green";
		//context.arc(this.x, this.y - this.height, this.headRadius, 0, 2*Math.PI, true);
		context.arc(0, 0 - this.height, this.headRadius, 0, 2*Math.PI, true);
		context.stroke();
		context.fill();
		//draw body
		context.beginPath();
		context.moveTo(0, 0 - this.height);
		context.lineTo(0, 0);
		context.stroke();
		context.restore();
	}
	
	Planet.prototype.draw = function () {
		context.save();
		if (this.sun === true) {
			context.drawImage(sunpic, this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
		} else {
			context.drawImage(planetpic, this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
		/*
			context.beginPath();
			context.fillStyle = this.color;
			context.arc(this.x, this.y, this.radius, 0, 2*Math.PI, true);
			context.fill();
			context.stroke();
			*/
		}
		context.restore();
	}
	
	Enemy.prototype.draw = function () {
		context.save();
		context.beginPath();
		context.fillStyle = this.color;
		context.arc(this.x, this.y, this.radius, 0, 2*Math.PI, true);
		context.fill();
		context.stroke();
		context.restore();
	}
	
	
	
	Planet.prototype.update = function () {
	
		var dx = this.targetX - this.x;
		var dy = this.targetY - this.y;
		
		var angle = Math.atan2(dy, dx);
		
		if (this.orbit === true) {
			angle += this.orbitSpeed + Math.PI;
		
			this.vx = this.targetX + Math.cos(angle) * this.orbitRadius;
			this.vy = this.targetY + Math.sin(angle) * this.orbitRadius;
			
			this.x = this.vx;
			this.y = this.vy;
		}
		//this.vx += ax;
		//this.vx += this.friction;
		//this.x += this.vx;
		//this.y += this.vy;
		
		
		
	}
	
	Ship.prototype.update = function () {
		
		var dx, dy;
		var angle, speed;
		
		dx = this.targetX - this.x;
		dy = this.targetY - this.y;
		distance = Math.sqrt(dx * dx + dy * dy);
		
		//optimization: do not run calculations if ship has arrived at target
		if (distance > 2) {
			angle = Math.atan2(dy, dx);
			distance = Math.sqrt(dx * dx + dy * dy);
			
			this.vx = (Math.cos(angle) * this.maxVelocity) * distance / 6;
			this.vy = (Math.sin(angle) * this.maxVelocity) * distance / 6;
			
			this.x += this.vx;
			this.y += this.vy;
			
			this.turretX = this.x + this.width / 2;
			this.turretY = this.y + this.height;
			
		} else {
			this.vx = 0;
			this.vy = 0;
				
		}
	}
	
	Flag.prototype.update = function () {
		this.x += this.vx;
		this.y += this.vy;
	
		this.vx += this.steerX;
		this.vy += this.steerY;
		
		
		var speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
		
		//check for maximum velocity and stop accelerating when agent reaches it
		if (this.landed === false) {
			if (speed > this.maxVelocity && speed > 0) {
				this.vx = (this.vx / speed) * this.maxVelocity;
				this.vy = (this.vy / speed) * this.maxVelocity
			}
		
			this.orientation = Math.atan2(this.vy, this.vx) + (3 * Math.PI / 2);	
			
		}
		
		//reset steering forces each frame
			this.steerX = 0;
			this.steerY = 0;
	}
	
	Enemy.prototype.update = function () {
		var dx = this.targetX - this.x;
		var dy = this.targetY - this.y;
		
		var angle = Math.atan2(dy, dx);
		
		if (this.orbit === true) {
			angle += this.orbitSpeed + Math.PI;
		
			this.vx = this.targetX + Math.cos(angle) * this.orbitRadius;
			this.vy = this.targetY + Math.sin(angle) * this.orbitRadius;
			
			this.x = this.vx;
			this.y = this.vy;
		} else if (this.pursuing === true) {
			//this.vx = this.targetX + Math.cos(angle) * this.orbitRadius;
			//this.vy = this.targetY + Math.sin(angle) * this.orbitRadius;
			this.vx = this.x + Math.cos(angle) * this.maxVelocity;
			this.vy = this.y + Math.sin(angle) * this.maxVelocity;
			
			this.x = this.vx;
			this.y = this.vy;
			//console.log(this.x + " " + this.y);
		}
	}
	
	
	//methods
	function drawBackground() {
		context.save();
		var grad1 = context.createRadialGradient(50, 50, 0, 65, 65, 65);
          grad1.addColorStop(0, "white");
          grad1.addColorStop(1, "black");

          context.fillStyle = grad1;
		context.fillRect(0, 0, canvas.width, canvas.height);
		for (var i = 0; i < stars.length; i++) {
			stars[i].draw();
		}
		context.restore();
	}
	
	function spawnNewFlag () {
		var newFlag = new Flag ();
		flags.push(newFlag);
		flagCount--;
		return newFlag;
	}
	
	function setTurretAngle(ship) {
		var dx = mouse.x - ship.turretX;
		var dy = mouse.y - ship.turretY;
		var angle = Math.atan2(dy, dx) + (3 * Math.PI / 2);
		
		//limit turret angle 
		if (angle > 7.3) {
			ship.orientation = 7.3;
		} else if (angle < 5.3) {
			ship.orientation = 5.3;
		} else {
			ship.orientation = angle;
		}
		
	}
	
	function pursue (hunter, prey) {
		var targetX, targetY;
		var dx, dy;
		var speed, distanceToTarget;
		var lookAheadScale = 2;
		
		hunter.orbit = false;
		hunter.pursuing = true;
		
		dx = prey.x - hunter.x;
		dy = prey.y - hunter.y;
		
		speed = Math.sqrt(prey.vx * prey.vx + prey.vy * prey.vy);
		distanceToTarget = Math.sqrt(dx * dx + dy * dy);
		
		//hunter.targetX = prey.x + Math.cos(prey.orientation) * speed * (distanceToTarget / lookAheadScale);
		//hunter.targetY = prey.y + Math.sin(prey.orientation) * speed * (distanceToTarget / lookAheadScale);
		
		hunter.targetX = prey.x;
		hunter.targetY = prey.y;
		//draw circle for hunter's target
		context.save();
		context.beginPath();
		context.strokeStyle = "white";
		context.arc(hunter.targetX, hunter.targetY, hunter.wanderRadius, 0, 2*Math.PI, true);
		context.stroke();
		context.restore();
	}
	
	function checkPursuitRadius(flag, enemy) {
		var dx = enemy.x - flag.x;
		var dy = enemy.x - flag.y;
		
		var distance = Math.sqrt(dx * dx + dy * dy);
		
		if (distance <= enemy.pursuitRadius) {
			enemy.pursuing = true;	
		} else if (enemy.pursuing === true && distance > enemy.pursuitRadius + 15) {     //set buffer for pursuit change
			resetEnemy(enemy);			
		}
	}
	
	function shootFlag () {
		var flag = spawnNewFlag();
		canFire = false;		
		flag.landed = false;
		
		var dx, dy;
		
		dx = ship.turretX - flag.x;
		dy = ship.turretY - flag.y;
		
		var angle = Math.atan2(dy, dx) + Math.PI;
		
		flag.y = ship.turretY + (Math.sin(ship.orientation - (3 * Math.PI / 2)) * ship.turretHeight);
		flag.x = ship.turretX + (Math.cos(ship.orientation - (3 * Math.PI / 2)) * ship.turretHeight);
		
		flag.vx = Math.cos(ship.orientation - (3 * Math.PI / 2)) * flag.maxVelocity;
		flag.vy = Math.sin(ship.orientation - (3 * Math.PI / 2)) * flag.maxVelocity; 
		
		flag.orientation = ship.orientation;
		if (flagCount > 0) {
			window.setTimeout( function() { canFire = true; }, coolDownMs);
		}
	}
	
	function applyForce (flag, planet) {
		var dx, dy;
		
		dx = planet.x - flag.x;
		dy = planet.y - flag.y;
		
		var angle = Math.atan2(dy, dx);
		var distance = Math.sqrt(dx * dx + dy * dy);
		
		//only apply gravitational force if flag is within the gravity well
		if (distance <= planet.gravityRadius) {
			flag.vx += Math.cos(angle) * (planet.gravity / (distance * distanceWeight));  //force of gravity is inversely proportional to distance
			flag.vy += Math.sin(angle) * (planet.gravity / (distance * distanceWeight));	 //force of gravity is inversely proportional to distance
			
			flag.steerX += dx / distance * flag.maxAcceleration;
			flag.steerY += dy / distance * flag.maxAcceleration;
			if (planet.enemy === true) {
				planet.pursuing = true;
				pursue(planet, flag);
			}
		} else {
			planet.pursuing = false;
		}
	}
	
	//check that player has landed on a planet
	function checkLanding (flag, planet) {
		if (utils.areColliding(flag.x, flag.y, flag.hitBox, planet.x, planet.y, planet.radius)) {
			flag.vx = 0;
			flag.vy = 0;
					
			//flag.x = Math.cos(flag.orientation) * planet.radius + planet.x;
			//flag.y = Math.sin(flag.orientation) * planet.radius + planet.y;
			var dx, dy;
			var distance;
			
			dx = planet.x - flag.x;
			dy = planet.y - flag.y;
			
			distance = Math.sqrt(dx * dx + dy * dy);
			
			var currentAngle = Math.atan2(dy, dx);
			
			
			//if (distance < planet.radius) {
				var flagOrientation = currentAngle + Math.PI;  //add Math.PI otherwise agent appears inside of planet
				flag.x = (Math.cos(flagOrientation) * planet.radius + planet.x);
				flag.y = (Math.sin(flagOrientation) * planet.radius + planet.y);
			//}
			
			//canFire = true;
			//flag.orientation = flagOrientation;
			flag.landed = true;
			return true;
			
		}
		return false;
	}
	
	function checkBoundary (agent) {
		//check right boundary
		if (agent.x - agent.radius >= canvas.width) {
			agent.x = 0 - agent.radius + 2;  //set agent just off the left of the screen
		} else if (agent.x + agent.radius <= 0) {  //check left
			agent.x = canvas.width + agent.radius - 2;  //set agent to the right
		}
		if (agent.y - agent.radius >= canvas.height) {  //check bottom
			agent.y = 0 - agent.radius + 2;
		} else if (agent.y + agent.radius <= 0) {  //check top
			agent.y = canvas.height + agent.radius - 2;
		}
	}
	
	function onPlanet (flag) {
		var angle = flag.orientation - (3 * Math.PI / 2);
	
		flag.x = planets[flag.onPlanet].x - Math.cos(angle) * planets[flag.onPlanet].radius;
		flag.y = planets[flag.onPlanet].y - Math.sin(angle) * planets[flag.onPlanet].radius;
	}
	
	function resetEnemy(enemy) {
		enemy.pursuing = false;
		enemy.orbit = true;
		enemy.targetX = planets[0].x;
		enemy.targetY = planets[0].y;
	}
	
	
	
	
	function drawHUD() {
		context.save();
		context.fillStyle = "white";
		context.font = "20px Terminal";
		context.fillText("Flags: " + flagCount, 10, 20);
		context.fillText("Planets claimed: " + flaggedCount + " / " + claimsNeeded, 20, canvas.height - 20);
		context.restore();
	}
	
	function checkWin() {
		if (flaggedCount === claimsNeeded) {
			canFire = false;
			youWin();
		} 
	}
	
	function checkLose() {
		for (var i = 0; i < flags.length; i++) {
			var flag = flags[i];
			if (flag.landed === false) {
				return false;
			}
		}
		return true;
	}
	
	function youWin() {
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
		context.fillText("(next level)", (canvas.width / 4) + 30, (canvas.height / 4) + 170);
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
			
			loadLevel3();
		
		 }, 1000);
	}
	
	
	
	function youLose() {
		context.save();
		context.beginPath();
		context.fillStyle = "red";
		context.fillRect(canvas.width / 4, canvas.height / 4, canvas.width / 2, canvas.height / 2.5);
		context.fill();
		context.stroke();
		context.strokeStyle = "black";
		context.fillStyle = "black";
		context.font = "40px Courier";
		context.fillText("You Lose!", (canvas.width / 4) + 26, (canvas.height / 4) + 40);
		context.font = "20px Courier";
		context.fillText("(click to restart)", (canvas.width / 4) + 30, (canvas.height / 4) + 170);
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
		planets[0].orbit = false;
		
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
		planets[0].radius = 45;
		planets[0].gravityRadius = 175;
		planets[0].orbit = false;
		
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
		
		/*
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
		*/
		
		
		levelCount++;
		//end level 3
	}
	
	
	//---------Window Load------------
	
	canvas.addEventListener('mousedown', function () {
		if (canFire === true){
			shootFlag();   //fire new flag	
		}
	}, false);
	
	//art
	var spaceship = new Image();
	var sunpic = new Image();
	var planetpic = new Image();
	
	planetpic.src = "images/planet.jpg";
	sunpic.src = "images/sunpicture1.jpg";
	spaceship.src = "images/ship.png";
	
	//create agents
	var ship = new Ship (-100, 25);
	var flags = [];
	var enemies = [];
	var planets = [];
	
	enemies[0] = new Enemy();
	
	//load first level on window load
	//Level 1
	planets[0] = new Planet (5);
	planets[0].sun = true;
	planets[0].color = "yellow";
	planets[0].radius = 45;
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
	
	var claimsNeeded = 1;
	var levelCount = 1;
	
	var flagCount = 8;
	var distanceWeight = 10;
	var canFire = true;
	var coolDownMs = 500;  //time between firing flags
	var bulletSpawnDelayMs = 500;
	var flaggedCount = 0;
	//var enemyCanFire = true;
	
	//draw random starry background
	var stars = [];
	var starCount = 50;
	var starRadius = 1;
	
	for (var i = 0; i < starCount; i++) {
		stars[i] = new Star(utils.getRandomInt(0, canvas.width), utils.getRandomInt(0, canvas.height));
	}
	
	//game loop
	(function update() {
		window.requestAnimationFrame(update, canvas);
		drawBackground();		
				
		setTurretAngle(ship);
		ship.update();
		ship.draw();
		
		for (var i = 0; i < planets.length; i++) {
			var planet = planets[i];
			planet.update();
			planet.draw();
			if (flags.length > 0) {
				for (var c = 0; c < flags.length; c++) {
				var flag = flags[c];
				//only apply planetary forces if flag is in flight
				if (flag.landed === false) {
					applyForce(flag, planet);
										
					if (checkLanding(flag, planet)) {
						flag.onPlanet = i;    //set which planet the flag is on
						if (planet.flagged === false && planet.sun === false) {
							planet.flagged = true;
							flaggedCount++;						
						} 
					}
				}
			}
			}
		}
		
		
		for (var i = 0; i < flags.length; i++) {
			var flag = flags[i];
			if (flag.landed === true) {
			
				if (planets[flag.onPlanet].sun === true) {
					resetEnemy(enemies[0]);
					flags.splice(i, 1);
				} else {
					onPlanet(flag);	
				}
			} else {
				for (var i = 0; i < enemies.length; i++) {
					var enemy = enemies[i];
					checkPursuitRadius(flag, enemy);
				}
			}
			
		
			
			checkBoundary(flag);
			flag.update();
			flag.draw();
		
		}
		
		for (var i = 0; i < enemies.length; i++) {
			var enemy = enemies[i];
			if (enemy.pursuing === true) {
				pursue(enemy, flag);
			}
			enemy.update();
			enemy.draw();
			for (var c = 0; c < flags.length; c++) {
				var flag = flags[c];
				if (utils.areColliding(enemy.x, enemy.y, enemy.radius, flag.x, flag.y, flag.hitBox)) {
					flags.splice(c, 1);
					resetEnemy(enemy);
				}
				
			}
			
		}
		
		drawHUD();
		if (flagCount === 0) {
			if (checkLose()) {
				youLose();
			}
		}
		checkWin();
		
	}());
	