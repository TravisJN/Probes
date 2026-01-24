/* global window */
(function (global) {
  var Probes = global.Probes = global.Probes || {};
  var entities = Probes.entities = Probes.entities || {};

  function getCanvasSafe() {
    return (Probes.state && Probes.state.canvas) ? Probes.state.canvas : { width: 0, height: 0 };
  }

  // --------- Constructors ---------

  function Ship(x, y) {
    this.width = 50;
    this.height = 15;
    this.wingSize = 10;
    this.turretRadius = this.width / 8;
    this.turretWidth = 4;
    this.turretHeight = 12;

    this.x = x;
    this.y = y;
    this.turretX = this.x + this.width / 2;
    this.turretY = this.y + this.height;
    this.orientation = 0;

    this.targetX = 225;
    this.targetY = 25;

    this.vx = 0;
    this.vy = 0;

    this.steerX = 0;
    this.steerY = 0;

    this.maxAcceleration = 0.2;
    this.maxVelocity = 0.2;
  }

  function Flag() {
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
    this.onPlanet = undefined;

    this.headRadius = 3;
    this.height = 12;
    this.hitBox = 3;
    this.radius = 3; // used by boundary wrap
  }

  function Star(x, y) {
    this.x = x;
    this.y = y;
  }

  function Planet(gravity) {
    var canvas = getCanvasSafe();
    this.x = canvas.width / 2;
    this.y = canvas.height / 2;
    this.radius = 25;

    this.gravity = gravity;
    this.gravityRadius = 125; // gravity force only applies within this distance

    this.spring = 0;
    this.friction = 0;

    this.targetX = this.x;
    this.targetY = this.y;

    this.vx = 0;
    this.vy = 0;
    this.color = "brown";
    this.orbitRadius = 100;
    this.orbit = false;
    this.orbitSpeed = 0.02;
    this.maxVelocity = 5;

    this.flagged = false;

    this.sun = false;
    this.enemy = false;
    this.pursuing = false;
  }

  function Enemy() {
    var canvas = getCanvasSafe();
    this.x = canvas.width / 2;
    this.y = canvas.height - 120;
    this.radius = 6;

    this.gravityRadius = 125;

    this.spring = 0;
    this.friction = 0;

    this.targetX = canvas.width / 2;
    this.targetY = canvas.width / 2;

    this.vx = 0;
    this.vy = 0;
    this.color = "white";
    this.orbitRadius = 150;
    this.orbit = true;
    this.orbitSpeed = 0.05;

    this.maxVelocity = 5;

    this.pursuing = false;
    this.pursuitRadius = 75;
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

  // --------- Prototypes ---------

  Star.prototype.draw = function () {
    var ctx = Probes.state.context;
    var r = (Probes.config && Probes.config.starRadius) ? Probes.config.starRadius : 1;

    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = "white";
    ctx.arc(this.x, this.y, r, 0, 2 * Math.PI, true);
    ctx.fill();
    ctx.restore();
  };

  Ship.prototype.draw = function () {
    var ctx = Probes.state.context;
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = "grey";

    // body
    ctx.fillRect(this.x, this.y, this.width, this.height);
    // front
    ctx.arc(this.x + this.width, this.y + this.height / 2, this.width / 3, 0, Math.PI * 2, true);
    // wings
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x, this.y - this.wingSize);
    ctx.lineTo(this.x + this.wingSize, this.y);
    ctx.moveTo(this.x, this.y + this.height);
    ctx.lineTo(this.x, this.y + this.height + this.wingSize);
    ctx.lineTo(this.x + this.wingSize, this.y + this.height);
    ctx.fill();

    // turret
    ctx.arc(this.turretX, this.turretY, this.turretRadius, 0, 2 * Math.PI, true);
    ctx.translate(this.turretX, this.turretY);
    ctx.rotate(this.orientation);
    ctx.fillRect(0 - this.turretWidth / 2, 0, this.turretWidth, this.turretHeight);
    ctx.fill();

    ctx.restore();
  };

  Flag.prototype.draw = function () {
    var ctx = Probes.state.context;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.orientation);

    // head
    ctx.beginPath();
    ctx.strokeStyle = "green";
    ctx.fillStyle = "green";
    ctx.arc(0, 0 - this.height, this.headRadius, 0, 2 * Math.PI, true);
    ctx.stroke();
    ctx.fill();

    // body
    ctx.beginPath();
    ctx.moveTo(0, 0 - this.height);
    ctx.lineTo(0, 0);
    ctx.stroke();

    ctx.restore();
  };

  Planet.prototype.draw = function () {
    var ctx = Probes.state.context;
    var assets = Probes.assets || {};

    ctx.save();
    if (this.sun === true) {
      if (assets.sunpic) {
        ctx.drawImage(assets.sunpic, this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
      }
    } else {
      if (assets.planetpic) {
        ctx.drawImage(assets.planetpic, this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
      }
    }
    ctx.restore();
  };

  Enemy.prototype.draw = function () {
    var ctx = Probes.state.context;
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, true);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };

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
  };

  Ship.prototype.update = function () {
    var dx = this.targetX - this.x;
    var dy = this.targetY - this.y;
    var distance = Math.sqrt(dx * dx + dy * dy);

    // optimization: do not run calculations if ship has arrived at target
    if (distance > 2) {
      var angle = Math.atan2(dy, dx);

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
  };

  Flag.prototype.update = function () {
    this.x += this.vx;
    this.y += this.vy;

    this.vx += this.steerX;
    this.vy += this.steerY;

    var speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);

    // check for maximum velocity and stop accelerating when agent reaches it
    if (this.landed === false) {
      if (speed > this.maxVelocity && speed > 0) {
        this.vx = (this.vx / speed) * this.maxVelocity;
        this.vy = (this.vy / speed) * this.maxVelocity;
      }

      this.orientation = Math.atan2(this.vy, this.vx) + (3 * Math.PI / 2);
    }

    // reset steering forces each frame
    this.steerX = 0;
    this.steerY = 0;
  };

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
  };

  // --------- Export ---------

  entities.Ship = Ship;
  entities.Flag = Flag;
  entities.Star = Star;
  entities.Planet = Planet;
  entities.Enemy = Enemy;
  entities.Bullet = Bullet;
}(window));

(function (Probes) {
  'use strict';

  Probes.entities = Probes.entities || {};

  function getCanvas() {
    return Probes.canvas || { width: 500, height: 500 };
  }

  // --------- Constructors ---------
  function Ship(x, y) {
    this.width = 50;
    this.height = 15;
    this.wingSize = 10;
    this.turretRadius = this.width / 8;
    this.turretWidth = 4;
    this.turretHeight = 12;

    this.x = x;
    this.y = y;
    this.turretX = this.x + this.width / 2;
    // `game.js` had a typo (`turretyY`); keep both fields for compatibility.
    this.turretY = this.y + this.height;
    this.turretyY = this.turretY;
    this.orientation = 0;

    this.targetX = 225;
    this.targetY = 25;

    this.vx = 0;
    this.vy = 0;

    this.steerX = 0;
    this.steerY = 0;

    this.maxAcceleration = 0.2;
    this.maxVelocity = 0.2;
  }

  function Flag() {
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
    this.onPlanet = undefined;

    this.headRadius = 3;
    this.height = 12;
    this.hitBox = 3;
    this.radius = 3; // used by boundary wrapping
  }

  function Star(x, y) {
    this.x = x;
    this.y = y;
  }

  function Planet(gravity) {
    var canvas = getCanvas();
    this.x = canvas.width / 2;
    this.y = canvas.height / 2;
    this.radius = 25;

    this.gravity = gravity;
    this.gravityRadius = 125; // gravity force applied within this distance

    this.spring = 0;
    this.friction = 0;

    this.targetX = this.x;
    this.targetY = this.y;

    this.vx = 0;
    this.vy = 0;
    this.color = 'brown';
    this.orbitRadius = 100;
    this.orbit = false;
    this.orbitSpeed = 0.02;
    this.maxVelocity = 5;

    this.flagged = false;

    this.sun = false;
    this.enemy = false;
    this.pursuing = false;
  }

  function Enemy() {
    var canvas = getCanvas();
    this.x = canvas.width / 2;
    this.y = canvas.height - 120;
    this.radius = 6;

    this.gravityRadius = 125;

    this.spring = 0;
    this.friction = 0;

    this.targetX = canvas.width / 2;
    this.targetY = canvas.width / 2;

    this.vx = 0;
    this.vy = 0;
    this.color = 'white';
    this.orbitRadius = 150;
    this.orbit = true;
    this.orbitSpeed = 0.05;

    this.maxVelocity = 5;

    this.pursuing = false;
    this.pursuitRadius = 75;
  }

  function Bullet(x, y, targetx, targety) {
    this.x = x;
    this.y = y;
    this.damage = 1;
    this.velocity = 7;
    this.radius = 7;
    this.color = 'red';
    this.targetx = targetx;
    this.targety = targety;
    this.angle = 0;
  }

  // --------- Prototypes ---------
  Star.prototype.draw = function () {
    var context = Probes.context;
    var starRadius = Probes.starRadius || 1;
    if (!context) return;

    context.save();
    context.beginPath();
    context.fillStyle = 'white';
    context.arc(this.x, this.y, starRadius, 0, 2 * Math.PI, true);
    context.fill();
    context.restore();
  };

  Ship.prototype.draw = function () {
    var context = Probes.context;
    if (!context) return;

    context.save();
    context.beginPath();
    context.fillStyle = 'grey';
    // body
    context.fillRect(this.x, this.y, this.width, this.height);
    // front
    context.arc(this.x + this.width, this.y + this.height / 2, this.width / 3, 0, Math.PI * 2, true);
    // wings
    context.moveTo(this.x, this.y);
    context.lineTo(this.x, this.y - this.wingSize);
    context.lineTo(this.x + this.wingSize, this.y);
    context.moveTo(this.x, this.y + this.height);
    context.lineTo(this.x, this.y + this.height + this.wingSize);
    context.lineTo(this.x + this.wingSize, this.y + this.height);
    context.fill();
    // turret
    context.arc(this.turretX, this.turretY, this.turretRadius, 0, 2 * Math.PI, true);
    context.translate(this.turretX, this.turretY);
    context.rotate(this.orientation);
    context.fillRect(0 - this.turretWidth / 2, 0, this.turretWidth, this.turretHeight);
    context.fill();
    context.restore();
  };

  Flag.prototype.draw = function () {
    var context = Probes.context;
    if (!context) return;

    context.save();
    context.translate(this.x, this.y);
    context.rotate(this.orientation);

    // head
    context.beginPath();
    context.strokeStyle = 'green';
    context.fillStyle = 'green';
    context.arc(0, 0 - this.height, this.headRadius, 0, 2 * Math.PI, true);
    context.stroke();
    context.fill();

    // body
    context.beginPath();
    context.moveTo(0, 0 - this.height);
    context.lineTo(0, 0);
    context.stroke();

    context.restore();
  };

  Planet.prototype.draw = function () {
    var context = Probes.context;
    if (!context) return;

    context.save();
    if (this.sun === true) {
      if (Probes.assets && Probes.assets.sunpic) {
        context.drawImage(Probes.assets.sunpic, this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
      }
    } else {
      if (Probes.assets && Probes.assets.planetpic) {
        context.drawImage(Probes.assets.planetpic, this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
      }
    }
    context.restore();
  };

  Enemy.prototype.draw = function () {
    var context = Probes.context;
    if (!context) return;

    context.save();
    context.beginPath();
    context.fillStyle = this.color;
    context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, true);
    context.fill();
    context.stroke();
    context.restore();
  };

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
  };

  Ship.prototype.update = function () {
    var dx, dy;
    var angle;
    var distance;

    dx = this.targetX - this.x;
    dy = this.targetY - this.y;
    distance = Math.sqrt(dx * dx + dy * dy);

    // optimization: skip if ship arrived
    if (distance > 2) {
      angle = Math.atan2(dy, dx);

      this.vx = (Math.cos(angle) * this.maxVelocity) * distance / 6;
      this.vy = (Math.sin(angle) * this.maxVelocity) * distance / 6;

      this.x += this.vx;
      this.y += this.vy;

      this.turretX = this.x + this.width / 2;
      this.turretY = this.y + this.height;
      this.turretyY = this.turretY;
    } else {
      this.vx = 0;
      this.vy = 0;
    }
  };

  Flag.prototype.update = function () {
    this.x += this.vx;
    this.y += this.vy;

    this.vx += this.steerX;
    this.vy += this.steerY;

    var speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);

    if (this.landed === false) {
      if (speed > this.maxVelocity && speed > 0) {
        this.vx = (this.vx / speed) * this.maxVelocity;
        this.vy = (this.vy / speed) * this.maxVelocity;
      }

      this.orientation = Math.atan2(this.vy, this.vx) + (3 * Math.PI / 2);
    }

    // reset steering
    this.steerX = 0;
    this.steerY = 0;
  };

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
  };

  // --------- Exports ---------
  Probes.entities.Ship = Ship;
  Probes.entities.Flag = Flag;
  Probes.entities.Star = Star;
  Probes.entities.Planet = Planet;
  Probes.entities.Enemy = Enemy;
  Probes.entities.Bullet = Bullet;
}(window.Probes = window.Probes || {}));

