//global variables
	var canvas = document.getElementById('canvas'),
		context = canvas.getContext('2d'),
		mouse = utils.captureMouse(canvas);

	//dev/debug (off by default; enable with ?dev=1)
	var DEV_MODE = (function () {
		try {
			return (new URLSearchParams(window.location.search)).has('dev');
		} catch (e) {
			return (/(^|[?&])dev(=1|=true|&|$)/).test(window.location.search);
		}
	}());
	var DEBUG_OVERLAY = false;
	var __debug = { lastFpsT: 0, frames: 0, fps: 0 };

	if (DEV_MODE) {
		DEBUG_OVERLAY = true;
		__debug.lastFpsT = (Date.now ? Date.now() : +new Date());
		window.addEventListener('keydown', function (e) {
			var code = e && (e.keyCode || e.which);
			var key = e && e.key;
			if (key === '`' || key === '~' || code === 192) {
				DEBUG_OVERLAY = !DEBUG_OVERLAY;
			}
		}, false);
	}

	//---------------- Game state machine ----------------
	var GAME_STATE = {
		TITLE: 'title',
		LEVEL_SELECT: 'level_select',
		PLAYING: 'playing',
		PAUSED: 'paused',
		WIN: 'win',
		LOSE: 'lose'
	};

	var gameState = GAME_STATE.TITLE;
	var selectedLevelIndex = 0;
	var currentLevelIndex = 0;
	var LEVEL_LOADERS = []; // filled after loadLevel* declarations
	var LEVEL_NAMES = [];

	var unlockedLevelCount = (function () {
		try {
			var raw = localStorage.getItem('probes_unlocked_levels');
			var n = raw != null ? parseInt(raw, 10) : 1;
			return (isFinite(n) && n > 0) ? n : 1;
		} catch (e) {
			return 1;
		}
	}());

	function saveUnlockedLevelCount() {
		try { localStorage.setItem('probes_unlocked_levels', String(unlockedLevelCount)); } catch (e) {}
	}

	function getLevelSelectCount() {
		// In dev mode, allow selecting any level from the menu.
		// Keep `unlockedLevelCount` for normal play / persistence.
		if (DEV_MODE) return Math.max(1, (LEVEL_LOADERS.length || 1));
		return Math.max(1, unlockedLevelCount);
	}

	function clampInt(n, min, max) {
		n = (n | 0);
		if (n < min) return min;
		if (n > max) return max;
		return n;
	}

	function setGameState(next) {
		gameState = next;
	}

	function goToTitle() {
		setGameState(GAME_STATE.TITLE);
	}

	function goToLevelSelect() {
		var levelSelectCount = getLevelSelectCount();
		selectedLevelIndex = clampInt(selectedLevelIndex, 0, Math.max(0, levelSelectCount - 1));
		setGameState(GAME_STATE.LEVEL_SELECT);
	}

	function startLevel(levelIndex) {
		var maxIdx = Math.max(0, (LEVEL_LOADERS.length || 1) - 1);
		currentLevelIndex = clampInt(levelIndex, 0, maxIdx);
		selectedLevelIndex = currentLevelIndex;

		if (LEVEL_LOADERS[currentLevelIndex]) {
			LEVEL_LOADERS[currentLevelIndex]();
		}

		// after the level is loaded, enemies can safely reference planets[0]
		if (enemies && enemies.length) {
			for (var i = 0; i < enemies.length; i++) {
				resetEnemy(enemies[i]);
			}
		}

		setGameState(GAME_STATE.PLAYING);
		// let the level loader decide if firing is allowed (most set canFire=true)
	}

	function restartLevel() {
		resetLevel();
	}

	function startSelectedLevel() {
		startLevel(selectedLevelIndex);
	}

	function goToNextLevel() {
		var nextIdx = currentLevelIndex + 1;
		if (nextIdx >= LEVEL_LOADERS.length) {
			// end of campaign for now
			goToLevelSelect();
			return;
		}
		startLevel(nextIdx);
	}

	function triggerWin() {
		canFire = false;
		// unlock next level (if any)
		unlockedLevelCount = Math.max(unlockedLevelCount, currentLevelIndex + 2);
		saveUnlockedLevelCount();
		setGameState(GAME_STATE.WIN);
	}

	function triggerLose() {
		canFire = false;
		setGameState(GAME_STATE.LOSE);
	}
		
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
			this.vx = this.x + Math.cos(angle) * this.maxVelocity;
			this.vy = this.y + Math.sin(angle) * this.maxVelocity;
			
			this.x = this.vx;
			this.y = this.vy;
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
		
		hunter.targetX = prey.x;
		hunter.targetY = prey.y;
		//draw circle for hunter's target
		context.save();
		context.beginPath();
		context.strokeStyle = "white";
		//wanderRadius is not defined on our hunter types; use a safe, always-defined marker size
		context.arc(hunter.targetX, hunter.targetY, (hunter && hunter.radius) ? hunter.radius : 6, 0, 2*Math.PI, true);
		context.stroke();
		context.restore();
	}
	
	function checkPursuitRadius(flag, enemy) {
		var dx = enemy.x - flag.x;
		var dy = enemy.y - flag.y;
		
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
			
			var dx = planet.x - flag.x;
			var dy = planet.y - flag.y;
			var currentAngle = Math.atan2(dy, dx);
			var flagOrientation = currentAngle + Math.PI;  //add Math.PI otherwise agent appears inside of planet
			flag.x = (Math.cos(flagOrientation) * planet.radius + planet.x);
			flag.y = (Math.sin(flagOrientation) * planet.radius + planet.y);
			
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

	function updateDebugFps() {
		var now = (Date.now ? Date.now() : +new Date());
		__debug.frames++;
		if (now - __debug.lastFpsT >= 500) {
			__debug.fps = (__debug.frames * 1000) / (now - __debug.lastFpsT);
			__debug.frames = 0;
			__debug.lastFpsT = now;
		}
	}

	function drawDebugOverlay() {
		//only call when DEV_MODE && DEBUG_OVERLAY
		context.save();

		context.globalAlpha = 0.85;
		context.fillStyle = "rgba(0, 0, 0, 0.6)";
		context.fillRect(8, 30, 260, 125);

		context.globalAlpha = 1;
		context.fillStyle = "white";
		context.font = "12px monospace";

		var x = 14;
		var y = 48;
		var lh = 14;

		context.fillText("DEV overlay (` to toggle)", x, y); y += lh;
		context.fillText("FPS: " + (__debug.fps ? __debug.fps.toFixed(1) : "..."), x, y); y += lh;
		context.fillText("Mouse: " + Math.round(mouse.x) + ", " + Math.round(mouse.y), x, y); y += lh;

		if (ship && ship.x != null && ship.y != null) {
			context.fillText("Ship: " + ship.x.toFixed(1) + ", " + ship.y.toFixed(1), x, y); y += lh;
			context.fillText("Ship v: " + ship.vx.toFixed(2) + ", " + ship.vy.toFixed(2), x, y); y += lh;
		}

		context.fillText("Flags: " + (flags ? flags.length : 0) + " (left " + flagCount + ")", x, y); y += lh;
		context.fillText("Planets: " + (planets ? planets.length : 0) + " | Enemies: " + (enemies ? enemies.length : 0), x, y);

		context.restore();
	}
	
	function isWinCondition() {
		return flaggedCount === claimsNeeded;
	}
	
	function isLoseCondition() {
		for (var i = 0; i < flags.length; i++) {
			var flag = flags[i];
			if (flag.landed === false) {
				return false;
			}
		}
		return true;
	}

	function drawOverlayBox(title, lines, footer, fillStyle) {
		var boxW = Math.floor(canvas.width * 0.70);
		var boxH = Math.floor(canvas.height * 0.46);
		var boxX = Math.floor((canvas.width - boxW) / 2);
		var boxY = Math.floor((canvas.height - boxH) / 2);

		context.save();
		context.beginPath();
		context.fillStyle = fillStyle || "rgba(0, 0, 0, 0.75)";
		context.strokeStyle = "black";
		context.lineWidth = 3;
		context.fillRect(boxX, boxY, boxW, boxH);
		context.strokeRect(boxX, boxY, boxW, boxH);

		context.fillStyle = "white";
		context.textAlign = "center";
		context.textBaseline = "top";

		context.font = "36px Courier";
		context.fillText(title, boxX + boxW / 2, boxY + 18);

		context.font = "18px Courier";
		var y = boxY + 72;
		if (lines && lines.length) {
			for (var i = 0; i < lines.length; i++) {
				context.fillText(lines[i], boxX + boxW / 2, y);
				y += 24;
			}
		}

		if (footer) {
			context.font = "16px Courier";
			context.fillText(footer, boxX + boxW / 2, boxY + boxH - 34);
		}

		context.restore();
	}

	function drawTitleScreen() {
		drawOverlayBox(
			"PROBES!",
			[
				"Use gravity to land flags on planets.",
				"Claim " + (claimsNeeded || 0) + " planet(s) to win a level.",
				"",
				"Mouse: aim. Click: fire (in-game).",
				"Enter/Click: continue"
			],
			"Press Enter or click to continue",
			"rgba(20, 20, 20, 0.85)"
		);
	}

	function drawLevelSelectScreen() {
		var lines = [];
		var maxIdx = Math.max(0, getLevelSelectCount() - 1);
		var maxNameIdx = Math.max(0, (LEVEL_NAMES.length || 1) - 1);
		var end = Math.min(maxIdx, maxNameIdx);

		lines.push("Select a level:");
		lines.push("");

		for (var i = 0; i <= end; i++) {
			var isSel = (i === selectedLevelIndex);
			var name = LEVEL_NAMES[i] || ("Level " + (i + 1));
			lines.push((isSel ? "> " : "  ") + name);
		}

		lines.push("");
		lines.push("Up/Down: choose   Enter/Click: start");
		lines.push("Esc: back to title");

		drawOverlayBox("LEVEL SELECT", lines, null, "rgba(20, 20, 20, 0.85)");
	}

	function drawPauseOverlay() {
		drawOverlayBox(
			"PAUSED",
			[
				"Esc: resume",
				"R: restart level",
				"L: level select"
			],
			"Click or press Esc to resume",
			"rgba(20, 20, 20, 0.80)"
		);
	}

	function drawWinOverlay() {
		var hasNext = (currentLevelIndex + 1) < (LEVEL_LOADERS.length || 0);
		drawOverlayBox(
			"YOU WIN!",
			[
				"Planets claimed: " + flaggedCount + " / " + claimsNeeded,
				"",
				(hasNext ? "Enter/Click: next level" : "Enter/Click: level select"),
				"R: restart level   L: level select"
			],
			null,
			"rgba(20, 120, 40, 0.85)"
		);
	}

	function drawLoseOverlay() {
		drawOverlayBox(
			"YOU LOSE!",
			[
				"Out of flags.",
				"Planets claimed: " + flaggedCount + " / " + claimsNeeded,
				"",
				"Enter/Click: restart level",
				"R: restart level   L: level select"
			],
			null,
			"rgba(150, 20, 20, 0.85)"
		);
	}

	// ---------------- Levels (data-driven) ----------------

	function getLevelListFromWindow() {
		// levels.js defines `window.PROBES_LEVELS`
		var list = (window && window.PROBES_LEVELS) ? window.PROBES_LEVELS : null;
		return (list && list.length) ? list : null;
	}

	function resolveLevelCoord(val, axis) {
		// axis: 'x'|'y'
		var size = (axis === 'x') ? canvas.width : canvas.height;
		if (typeof val === 'number') {
			// 0..1 => fraction of canvas, otherwise pixels
			if (val >= 0 && val <= 1) return val * size;
			return val;
		}

		if (val && typeof val === 'object') {
			var from = val.from;
			var offset = (val.offset != null) ? val.offset : 0;
			if (axis === 'x') {
				if (from === 'left') return 0 + offset;
				if (from === 'right') return canvas.width + offset;
				if (from === 'center') return (canvas.width / 2) + offset;
			} else {
				if (from === 'top') return 0 + offset;
				if (from === 'bottom') return canvas.height + offset;
				if (from === 'center') return (canvas.height / 2) + offset;
			}
		}

		// fallback to center
		return (axis === 'x') ? (canvas.width / 2) : (canvas.height / 2);
	}

	function applyPlanetTarget(planet, targetSpec) {
		if (targetSpec && targetSpec.self) {
			planet.targetX = planet.x;
			planet.targetY = planet.y;
			return;
		}

		var idx = targetSpec ? targetSpec.planetIndex : null;
		if (idx != null && planets[idx]) {
			planet.targetX = planets[idx].x;
			planet.targetY = planets[idx].y;
			return;
		}

		// default: self (stationary)
		planet.targetX = planet.x;
		planet.targetY = planet.y;
	}

	function loadLevelFromData(level) {
		// clear in-place (safe; doesn't skip elements)
		planets.length = 0;
		flags.length = 0;

		// ship
		var shipDef = level && level.ship ? level.ship : null;
		if (shipDef) {
			ship.x = resolveLevelCoord(shipDef.x, 'x');
			ship.y = resolveLevelCoord(shipDef.y, 'y');
		} else {
			ship.x = -100;
			ship.y = 25;
		}
		ship.vx = 0;
		ship.vy = 0;
		ship.steerX = 0;
		ship.steerY = 0;

		// objectives / state
		flagCount = (level && level.flagCount != null) ? level.flagCount : 0;
		flaggedCount = 0;
		claimsNeeded = (level && level.claimsNeeded != null) ? level.claimsNeeded : 1;
		levelCount = (level && level.id != null) ? level.id : (currentLevelIndex + 1);
		canFire = (level && level.canFire != null) ? !!level.canFire : true;

		// planets
		var planetDefs = (level && level.planets && level.planets.length) ? level.planets : [];
		var pendingTargets = [];

		for (var i = 0; i < planetDefs.length; i++) {
			var def = planetDefs[i] || {};
			var p = new Planet((def.gravity != null) ? def.gravity : 0);

			// position first (so targetX/targetY can default to self)
			if (def.x != null) p.x = resolveLevelCoord(def.x, 'x');
			if (def.y != null) p.y = resolveLevelCoord(def.y, 'y');

			// config
			if (def.radius != null) p.radius = def.radius;
			if (def.gravityRadius != null) p.gravityRadius = def.gravityRadius;
			if (def.color != null) p.color = def.color;
			if (def.sun != null) p.sun = !!def.sun;
			if (def.orbit != null) p.orbit = !!def.orbit;
			if (def.orbitRadius != null) p.orbitRadius = def.orbitRadius;
			if (def.orbitSpeed != null) p.orbitSpeed = def.orbitSpeed;
			if (def.enemy != null) p.enemy = !!def.enemy;
			if (def.pursuing != null) p.pursuing = !!def.pursuing;

			// defaults
			p.targetX = p.x;
			p.targetY = p.y;

			planets.push(p);
			pendingTargets.push(def.target || null);
		}

		// apply targets after all planets exist
		for (var j = 0; j < planets.length; j++) {
			var t = pendingTargets[j];

			// implicit default for orbiting planets: orbit planet[0] when possible
			if (!t && planets[j].orbit && planets[0] && j !== 0) {
				t = { planetIndex: 0 };
			}

			applyPlanetTarget(planets[j], t);
		}
	}

	function findLevelById(levelId) {
		// Find a level data object by its ID
		var dataLevels = getLevelListFromWindow();
		if (!dataLevels || !dataLevels.length) {
			return null;
		}

		for (var i = 0; i < dataLevels.length; i++) {
			if (dataLevels[i] && dataLevels[i].id === levelId) {
				return { level: dataLevels[i], index: i };
			}
		}

		return null;
	}

	function findLevelByIndex(levelIndex) {
		// Find a level data object by its array index
		var dataLevels = getLevelListFromWindow();
		if (!dataLevels || levelIndex < 0 || levelIndex >= dataLevels.length) {
			return null;
		}

		return dataLevels[levelIndex];
	}

	function loadLevel(levelId) {
		// Load a level by its ID (from level data objects)
		var result = findLevelById(levelId);
		if (!result) {
			// Fallback: if level not found by ID, try using levelId as index
			var fallbackLevel = findLevelByIndex(levelId);
			if (fallbackLevel) {
				currentLevelIndex = levelId;
				selectedLevelIndex = currentLevelIndex;
				loadLevelFromData(fallbackLevel);
			} else {
				// If still not found, use the existing loader system as fallback
				if (LEVEL_LOADERS && LEVEL_LOADERS[levelId - 1]) {
					currentLevelIndex = levelId - 1;
					selectedLevelIndex = currentLevelIndex;
					LEVEL_LOADERS[currentLevelIndex]();
				}
				return;
			}
		} else {
			currentLevelIndex = result.index;
			selectedLevelIndex = currentLevelIndex;
			loadLevelFromData(result.level);
		}

		// after the level is loaded, enemies can safely reference planets[0]
		if (enemies && enemies.length) {
			for (var i = 0; i < enemies.length; i++) {
				resetEnemy(enemies[i]);
			}
		}

		setGameState(GAME_STATE.PLAYING);
	}

	function resetLevel() {
		// Reset the current level to its initial state
		var currentLevel = findLevelByIndex(currentLevelIndex);
		if (currentLevel) {
			// Use data-driven loading
			loadLevelFromData(currentLevel);
		} else if (LEVEL_LOADERS && LEVEL_LOADERS[currentLevelIndex]) {
			// Fallback to loader function if data not available
			LEVEL_LOADERS[currentLevelIndex]();
		}

		// after the level is loaded, enemies can safely reference planets[0]
		if (enemies && enemies.length) {
			for (var i = 0; i < enemies.length; i++) {
				resetEnemy(enemies[i]);
			}
		}

		setGameState(GAME_STATE.PLAYING);
	}

	function initLevels() {
		var dataLevels = getLevelListFromWindow();
		if (dataLevels) {
			LEVEL_LOADERS = [];
			LEVEL_NAMES = [];

			for (var i = 0; i < dataLevels.length; i++) {
				(function (lvl, idx) {
					LEVEL_LOADERS.push(function () { loadLevelFromData(lvl); });
					LEVEL_NAMES.push((lvl && lvl.name) ? lvl.name : ("Level " + (lvl && lvl.id != null ? lvl.id : (idx + 1))));
				}(dataLevels[i], i));
			}
		} else {
			// fallback: original hardcoded levels
			LEVEL_LOADERS = [loadLevel1, loadLevel2, loadLevel3];
			LEVEL_NAMES = ["Level 1", "Level 2", "Level 3"];
		}

		unlockedLevelCount = clampInt(unlockedLevelCount, 1, LEVEL_LOADERS.length || 1);
		saveUnlockedLevelCount();
	}
	
	function loadLevel2 () {
		//clear in-place (safe; doesn't skip elements)
		planets.length = 0;
		flags.length = 0;
		
		ship.x = -100;
		ship.y = 25;
		flagCount = 3;
		flaggedCount = 0;
		claimsNeeded = 2;
		levelCount = 2;
		
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
		canFire = true;
	}
	
	function loadLevel3 () {
		//clear in-place (safe; doesn't skip elements)
		planets.length = 0;
		flags.length = 0;
		
		ship.x = -100;
		ship.y = 25;
		flagCount = 3;
		flaggedCount = 0;
		claimsNeeded = 2;
		levelCount = 3;
		
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
		canFire = true;
		//end level 3
	}

	function loadLevel1 () {
		//clear in-place (safe; doesn't skip elements)
		planets.length = 0;
		flags.length = 0;

		ship.x = -100;
		ship.y = 25;
		claimsNeeded = 1;
		levelCount = 1;

		flagCount = 8;
		flaggedCount = 0;
		canFire = true;

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
	}

	// level list (used by state machine + level select)
	initLevels();
	
	
	//---------Window Load------------
	
	canvas.addEventListener('mousedown', function () {
		if (gameState === GAME_STATE.PLAYING) {
			if (canFire === true){
				shootFlag();   //fire new flag
			}
			return;
		}

		if (gameState === GAME_STATE.TITLE) {
			goToLevelSelect();
			return;
		}

		if (gameState === GAME_STATE.LEVEL_SELECT) {
			startSelectedLevel();
			return;
		}

		if (gameState === GAME_STATE.PAUSED) {
			setGameState(GAME_STATE.PLAYING);
			return;
		}

		if (gameState === GAME_STATE.WIN) {
			goToNextLevel();
			return;
		}

		if (gameState === GAME_STATE.LOSE) {
			restartLevel();
			return;
		}
	}, false);

	window.addEventListener('keydown', function (e) {
		var key = e && e.key;
		var code = e && (e.keyCode || e.which);

		// normalize for older browsers
		if (!key && code) {
			if (code === 13) key = 'Enter';
			if (code === 27) key = 'Escape';
			if (code === 38) key = 'ArrowUp';
			if (code === 40) key = 'ArrowDown';
			if (code === 82) key = 'r';
			if (code === 76) key = 'l';
		}

		// global-ish controls (except title/level select)
		if (key === 'Escape' || code === 27) {
			if (gameState === GAME_STATE.PLAYING) {
				setGameState(GAME_STATE.PAUSED);
				e && e.preventDefault && e.preventDefault();
				return;
			}
			if (gameState === GAME_STATE.PAUSED) {
				setGameState(GAME_STATE.PLAYING);
				e && e.preventDefault && e.preventDefault();
				return;
			}
			if (gameState === GAME_STATE.LEVEL_SELECT) {
				goToTitle();
				e && e.preventDefault && e.preventDefault();
				return;
			}
		}

		// title -> level select
		if (key === 'Enter' || code === 13) {
			if (gameState === GAME_STATE.TITLE) {
				goToLevelSelect();
				e && e.preventDefault && e.preventDefault();
				return;
			}
			if (gameState === GAME_STATE.LEVEL_SELECT) {
				startSelectedLevel();
				e && e.preventDefault && e.preventDefault();
				return;
			}
			if (gameState === GAME_STATE.WIN) {
				goToNextLevel();
				e && e.preventDefault && e.preventDefault();
				return;
			}
			if (gameState === GAME_STATE.LOSE) {
				restartLevel();
				e && e.preventDefault && e.preventDefault();
				return;
			}
		}

		// level select navigation
		if (gameState === GAME_STATE.LEVEL_SELECT) {
			if (key === 'ArrowUp' || code === 38) {
				selectedLevelIndex = clampInt(selectedLevelIndex - 1, 0, getLevelSelectCount() - 1);
				e && e.preventDefault && e.preventDefault();
				return;
			}
			if (key === 'ArrowDown' || code === 40) {
				selectedLevelIndex = clampInt(selectedLevelIndex + 1, 0, getLevelSelectCount() - 1);
				e && e.preventDefault && e.preventDefault();
				return;
			}
		}

		// restart
		if ((key === 'r' || key === 'R' || code === 82) &&
			(gameState === GAME_STATE.PLAYING || gameState === GAME_STATE.PAUSED || gameState === GAME_STATE.WIN || gameState === GAME_STATE.LOSE)) {
			restartLevel();
			e && e.preventDefault && e.preventDefault();
			return;
		}

		// level select shortcut
		if ((key === 'l' || key === 'L' || code === 76) &&
			(gameState === GAME_STATE.PLAYING || gameState === GAME_STATE.PAUSED || gameState === GAME_STATE.WIN || gameState === GAME_STATE.LOSE)) {
			goToLevelSelect();
			e && e.preventDefault && e.preventDefault();
			return;
		}
	}, false);
	
	//art
	var sunpic = new Image();
	var planetpic = new Image();
	
	planetpic.src = "images/planet.jpg";
	sunpic.src = "images/sunpicture1.jpg";
	
	//create agents
	var ship = new Ship (-100, 25);
	var flags = [];
	var enemies = [];
	var planets = [];
	
	enemies[0] = new Enemy();
	
	var claimsNeeded = 1;
	var levelCount = 1;
	
	var flagCount = 0;
	var distanceWeight = 10;
	var canFire = false;
	var coolDownMs = 500;  //time between firing flags
	var flaggedCount = 0;
	
	//draw random starry background
	var stars = [];
	var starCount = 50;
	var starRadius = 1;
	
	for (var i = 0; i < starCount; i++) {
		stars[i] = new Star(utils.getRandomInt(0, canvas.width), utils.getRandomInt(0, canvas.height));
	}

	function updateAndDrawWorld(doUpdate) {
		// ship
		if (doUpdate) {
			setTurretAngle(ship);
			ship.update();
		}
		ship.draw();

		// planets + gravity/landing
		for (var i = 0; i < planets.length; i++) {
			var planet = planets[i];
			if (doUpdate) {
				planet.update();
			}
			planet.draw();

			if (doUpdate && flags.length > 0) {
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

		// flags
		for (var f = flags.length - 1; f >= 0; f--) {
			var fl = flags[f];
			if (fl.landed === true) {
				if (planets[fl.onPlanet] && planets[fl.onPlanet].sun === true) {
					resetEnemy(enemies[0]);
					if (doUpdate) {
						flags.splice(f, 1);
						continue;
					}
				} else {
					// keep flags stuck to orbiting planets
					onPlanet(fl);
				}
			} else if (doUpdate) {
				for (var e = 0; e < enemies.length; e++) {
					checkPursuitRadius(fl, enemies[e]);
				}
			}

			if (doUpdate) {
				checkBoundary(fl);
				fl.update();
			}
			fl.draw();
		}

		// enemies
		for (var ei = 0; ei < enemies.length; ei++) {
			var enemy = enemies[ei];

			if (doUpdate && enemy.pursuing === true) {
				if (flags.length > 0) {
					pursue(enemy, flags[flags.length - 1]);
				} else {
					resetEnemy(enemy);
				}
			}

			if (doUpdate) {
				enemy.update();
			}
			enemy.draw();

			if (doUpdate) {
				//iterate backwards so removals via splice are safe
				for (var fc = flags.length - 1; fc >= 0; fc--) {
					var flg = flags[fc];
					if (utils.areColliding(enemy.x, enemy.y, enemy.radius, flg.x, flg.y, flg.hitBox)) {
						flags.splice(fc, 1);
						resetEnemy(enemy);
					}
				}
			}
		}
	}
	
	// FPS locking at 60 FPS
	var TARGET_FPS = 60;
	var FRAME_TIME_MS = 1000 / TARGET_FPS; // ~16.67ms per frame
	var lastFrameTime = (Date.now ? Date.now() : +new Date());
	var accumulatedTime = 0;

	//game loop
	(function update() {
		window.requestAnimationFrame(update, canvas);
		
		var currentTime = (Date.now ? Date.now() : +new Date());
		var deltaTime = currentTime - lastFrameTime;
		lastFrameTime = currentTime;
		
		// Cap deltaTime to prevent large jumps (e.g., tab switching)
		if (deltaTime > 100) {
			deltaTime = 100;
		}
		
		accumulatedTime += deltaTime;
		
		// Only update game logic when enough time has accumulated
		var shouldUpdate = (accumulatedTime >= FRAME_TIME_MS);
		if (shouldUpdate) {
			accumulatedTime -= FRAME_TIME_MS;
			// Keep accumulatedTime from growing too large
			if (accumulatedTime > FRAME_TIME_MS) {
				accumulatedTime = FRAME_TIME_MS;
			}
		}
		
		drawBackground();

		if (DEV_MODE) {
			updateDebugFps();
		}

		if (gameState === GAME_STATE.TITLE) {
			drawTitleScreen();
			if (DEV_MODE && DEBUG_OVERLAY) {
				drawDebugOverlay();
			}
			return;
		}

		if (gameState === GAME_STATE.LEVEL_SELECT) {
			drawLevelSelectScreen();
			if (DEV_MODE && DEBUG_OVERLAY) {
				drawDebugOverlay();
			}
			return;
		}

		if (gameState === GAME_STATE.PLAYING) {
			updateAndDrawWorld(shouldUpdate);
			drawHUD();

			// win/lose transitions (no reload)
			if (shouldUpdate) {
				if (isWinCondition()) {
					triggerWin();
				} else if (flagCount === 0 && isLoseCondition()) {
					triggerLose();
				}
			}

			if (DEV_MODE && DEBUG_OVERLAY) {
				drawDebugOverlay();
			}
			return;
		}

		// PAUSED / WIN / LOSE: draw a frozen world (no updates), then overlay
		updateAndDrawWorld(false);
		drawHUD();

		if (gameState === GAME_STATE.PAUSED) {
			drawPauseOverlay();
		} else if (gameState === GAME_STATE.WIN) {
			drawWinOverlay();
		} else if (gameState === GAME_STATE.LOSE) {
			drawLoseOverlay();
		}

		if (DEV_MODE && DEBUG_OVERLAY) {
			drawDebugOverlay();
		}
		
	}());
	