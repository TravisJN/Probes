/* global window */
(function (global) {
  var Probes = global.Probes = global.Probes || {};
  var physics = Probes.physics = Probes.physics || {};

  function getDistanceWeight() {
    return (Probes.config && Probes.config.distanceWeight) ? Probes.config.distanceWeight : 10;
  }

  function pursue(hunter, prey) {
    var ctx = Probes.state.context;

    hunter.orbit = false;
    hunter.pursuing = true;

    var dx = prey.x - hunter.x;
    var dy = prey.y - hunter.y;

    var speed = Math.sqrt(prey.vx * prey.vx + prey.vy * prey.vy);
    var distanceToTarget = Math.sqrt(dx * dx + dy * dy);
    var lookAheadScale = 2;

    // Currently unused look-ahead (kept for parity / future use)
    void (speed);
    void (distanceToTarget);
    void (lookAheadScale);

    hunter.targetX = prey.x;
    hunter.targetY = prey.y;

    // draw circle for hunter's target
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = "white";
    ctx.arc(hunter.targetX, hunter.targetY, (hunter && hunter.radius) ? hunter.radius : 6, 0, 2 * Math.PI, true);
    ctx.stroke();
    ctx.restore();
  }

  function checkPursuitRadius(flag, enemy) {
    var dx = enemy.x - flag.x;
    var dy = enemy.y - flag.y;
    var distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= enemy.pursuitRadius) {
      enemy.pursuing = true;
    } else if (enemy.pursuing === true && distance > enemy.pursuitRadius + 15) {
      resetEnemy(enemy);
    }
  }

  function resetEnemy(enemy) {
    var planets = Probes.state.planets;
    enemy.pursuing = false;
    enemy.orbit = true;
    enemy.targetX = planets[0].x;
    enemy.targetY = planets[0].y;
  }

  function applyForce(flag, planet) {
    var dx = planet.x - flag.x;
    var dy = planet.y - flag.y;

    var angle = Math.atan2(dy, dx);
    var distance = Math.sqrt(dx * dx + dy * dy);
    var distanceWeight = getDistanceWeight();

    // only apply gravitational force if flag is within the gravity well
    if (distance <= planet.gravityRadius) {
      flag.vx += Math.cos(angle) * (planet.gravity / (distance * distanceWeight));
      flag.vy += Math.sin(angle) * (planet.gravity / (distance * distanceWeight));

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

  // check that player has landed on a planet
  function checkLanding(flag, planet) {
    if (Probes.utils.areColliding(flag.x, flag.y, flag.hitBox, planet.x, planet.y, planet.radius)) {
      flag.vx = 0;
      flag.vy = 0;

      var dx = planet.x - flag.x;
      var dy = planet.y - flag.y;
      var distance = Math.sqrt(dx * dx + dy * dy);
      void (distance);

      var currentAngle = Math.atan2(dy, dx);

      var flagOrientation = currentAngle + Math.PI; // add PI so agent appears outside planet
      flag.x = (Math.cos(flagOrientation) * planet.radius + planet.x);
      flag.y = (Math.sin(flagOrientation) * planet.radius + planet.y);

      flag.landed = true;
      return true;
    }
    return false;
  }

  function checkBoundary(agent) {
    var canvas = Probes.state.canvas;
    // check right boundary
    if (agent.x - agent.radius >= canvas.width) {
      agent.x = 0 - agent.radius + 2;
    } else if (agent.x + agent.radius <= 0) {
      agent.x = canvas.width + agent.radius - 2;
    }
    if (agent.y - agent.radius >= canvas.height) {
      agent.y = 0 - agent.radius + 2;
    } else if (agent.y + agent.radius <= 0) {
      agent.y = canvas.height + agent.radius - 2;
    }
  }

  function onPlanet(flag) {
    var planets = Probes.state.planets;
    var angle = flag.orientation - (3 * Math.PI / 2);
    flag.x = planets[flag.onPlanet].x - Math.cos(angle) * planets[flag.onPlanet].radius;
    flag.y = planets[flag.onPlanet].y - Math.sin(angle) * planets[flag.onPlanet].radius;
  }

  physics.pursue = pursue;
  physics.checkPursuitRadius = checkPursuitRadius;
  physics.resetEnemy = resetEnemy;
  physics.applyForce = applyForce;
  physics.checkLanding = checkLanding;
  physics.checkBoundary = checkBoundary;
  physics.onPlanet = onPlanet;
}(window));

(function (Probes) {
  'use strict';

  Probes.physics = Probes.physics || {};
  var P = Probes.physics;

  function getCanvas() {
    return Probes.canvas || { width: 500, height: 500 };
  }

  P.spawnNewFlag = function () {
    var Flag = Probes.entities.Flag;
    var newFlag = new Flag();
    Probes.flags.push(newFlag);
    Probes.flagCount--;
    return newFlag;
  };

  P.setTurretAngle = function (ship) {
    var mouse = Probes.mouse;
    if (!mouse) return;

    var dx = mouse.x - ship.turretX;
    var dy = mouse.y - ship.turretY;
    var angle = Math.atan2(dy, dx) + (3 * Math.PI / 2);

    // limit turret angle
    if (angle > 7.3) {
      ship.orientation = 7.3;
    } else if (angle < 5.3) {
      ship.orientation = 5.3;
    } else {
      ship.orientation = angle;
    }
  };

  P.pursue = function (hunter, prey) {
    hunter.orbit = false;
    hunter.pursuing = true;

    hunter.targetX = prey.x;
    hunter.targetY = prey.y;

    // draw a circle for hunter's target (debug-ish)
    var context = Probes.context;
    if (context) {
      context.save();
      context.beginPath();
      context.strokeStyle = 'white';
      // wanderRadius is not defined on our hunter types; use a safe marker size
      context.arc(hunter.targetX, hunter.targetY, (hunter && hunter.radius) ? hunter.radius : 6, 0, 2 * Math.PI, true);
      context.stroke();
      context.restore();
    }
  };

  P.checkPursuitRadius = function (flag, enemy) {
    var dx = enemy.x - flag.x;
    var dy = enemy.y - flag.y;

    var distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= enemy.pursuitRadius) {
      enemy.pursuing = true;
    } else if (enemy.pursuing === true && distance > enemy.pursuitRadius + 15) {
      P.resetEnemy(enemy);
    }
  };

  P.shootFlag = function () {
    var ship = Probes.ship;
    var flag = P.spawnNewFlag();

    Probes.canFire = false;
    flag.landed = false;

    flag.y = ship.turretY + (Math.sin(ship.orientation - (3 * Math.PI / 2)) * ship.turretHeight);
    flag.x = ship.turretX + (Math.cos(ship.orientation - (3 * Math.PI / 2)) * ship.turretHeight);

    flag.vx = Math.cos(ship.orientation - (3 * Math.PI / 2)) * flag.maxVelocity;
    flag.vy = Math.sin(ship.orientation - (3 * Math.PI / 2)) * flag.maxVelocity;

    flag.orientation = ship.orientation;
    if (Probes.flagCount > 0) {
      window.setTimeout(function () { Probes.canFire = true; }, Probes.coolDownMs);
    }
  };

  P.applyForce = function (flag, planet) {
    var dx = planet.x - flag.x;
    var dy = planet.y - flag.y;

    var angle = Math.atan2(dy, dx);
    var distance = Math.sqrt(dx * dx + dy * dy);

    // only apply gravitational force if within gravity well
    if (distance <= planet.gravityRadius) {
      flag.vx += Math.cos(angle) * (planet.gravity / (distance * Probes.distanceWeight));
      flag.vy += Math.sin(angle) * (planet.gravity / (distance * Probes.distanceWeight));

      flag.steerX += dx / distance * flag.maxAcceleration;
      flag.steerY += dy / distance * flag.maxAcceleration;

      if (planet.enemy === true) {
        planet.pursuing = true;
        P.pursue(planet, flag);
      }
    } else {
      planet.pursuing = false;
    }
  };

  P.checkLanding = function (flag, planet) {
    if (utils.areColliding(flag.x, flag.y, flag.hitBox, planet.x, planet.y, planet.radius)) {
      flag.vx = 0;
      flag.vy = 0;

      var dx = planet.x - flag.x;
      var dy = planet.y - flag.y;

      var currentAngle = Math.atan2(dy, dx);
      var flagOrientation = currentAngle + Math.PI;
      flag.x = (Math.cos(flagOrientation) * planet.radius + planet.x);
      flag.y = (Math.sin(flagOrientation) * planet.radius + planet.y);

      flag.landed = true;
      return true;
    }
    return false;
  };

  P.checkBoundary = function (agent) {
    var canvas = getCanvas();

    if (agent.x - agent.radius >= canvas.width) {
      agent.x = 0 - agent.radius + 2;
    } else if (agent.x + agent.radius <= 0) {
      agent.x = canvas.width + agent.radius - 2;
    }
    if (agent.y - agent.radius >= canvas.height) {
      agent.y = 0 - agent.radius + 2;
    } else if (agent.y + agent.radius <= 0) {
      agent.y = canvas.height + agent.radius - 2;
    }
  };

  P.onPlanet = function (flag) {
    var planets = Probes.planets;
    var angle = flag.orientation - (3 * Math.PI / 2);

    flag.x = planets[flag.onPlanet].x - Math.cos(angle) * planets[flag.onPlanet].radius;
    flag.y = planets[flag.onPlanet].y - Math.sin(angle) * planets[flag.onPlanet].radius;
  };

  P.resetEnemy = function (enemy) {
    enemy.pursuing = false;
    enemy.orbit = true;
    enemy.targetX = Probes.planets[0].x;
    enemy.targetY = Probes.planets[0].y;
  };
}(window.Probes = window.Probes || {}));

