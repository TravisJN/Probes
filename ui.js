(function (Probes) {
  'use strict';

  Probes.ui = Probes.ui || {};
  var UI = Probes.ui;

  UI.drawBackground = function () {
    var canvas = Probes.canvas;
    var context = Probes.context;
    if (!canvas || !context) return;

    context.save();

    var grad1 = context.createRadialGradient(50, 50, 0, 65, 65, 65);
    grad1.addColorStop(0, 'white');
    grad1.addColorStop(1, 'black');

    context.fillStyle = grad1;
    context.fillRect(0, 0, canvas.width, canvas.height);

    for (var i = 0; i < Probes.stars.length; i++) {
      Probes.stars[i].draw();
    }

    context.restore();
  };

  UI.drawHUD = function () {
    var canvas = Probes.canvas;
    var context = Probes.context;
    if (!canvas || !context) return;

    context.save();
    context.fillStyle = 'white';
    context.font = '20px Terminal';
    context.fillText('Flags: ' + Probes.flagCount, 10, 20);
    context.fillText('Planets claimed: ' + Probes.flaggedCount + ' / ' + Probes.claimsNeeded, 20, canvas.height - 20);
    context.restore();
  };

  UI.updateDebugFps = function () {
    var d = Probes.dev;
    if (!d || !d.stats) return;

    var now = (Date.now ? Date.now() : +new Date());
    d.stats.frames++;
    if (now - d.stats.lastFpsT >= 500) {
      d.stats.fps = (d.stats.frames * 1000) / (now - d.stats.lastFpsT);
      d.stats.frames = 0;
      d.stats.lastFpsT = now;
    }
  };

  UI.drawDebugOverlay = function () {
    var canvas = Probes.canvas;
    var context = Probes.context;
    if (!canvas || !context) return;

    context.save();

    context.globalAlpha = 0.85;
    context.fillStyle = 'rgba(0, 0, 0, 0.6)';
    context.fillRect(8, 30, 260, 125);

    context.globalAlpha = 1;
    context.fillStyle = 'white';
    context.font = '12px monospace';

    var x = 14;
    var y = 48;
    var lh = 14;

    context.fillText('DEV overlay (` to toggle)', x, y); y += lh;
    context.fillText('FPS: ' + ((Probes.dev && Probes.dev.stats && Probes.dev.stats.fps) ? Probes.dev.stats.fps.toFixed(1) : '...'), x, y); y += lh;
    context.fillText('Mouse: ' + Math.round(Probes.mouse.x) + ', ' + Math.round(Probes.mouse.y), x, y); y += lh;

    if (Probes.ship && Probes.ship.x != null && Probes.ship.y != null) {
      context.fillText('Ship: ' + Probes.ship.x.toFixed(1) + ', ' + Probes.ship.y.toFixed(1), x, y); y += lh;
      context.fillText('Ship v: ' + Probes.ship.vx.toFixed(2) + ', ' + Probes.ship.vy.toFixed(2), x, y); y += lh;
    }

    context.fillText('Flags: ' + (Probes.flags ? Probes.flags.length : 0) + ' (left ' + Probes.flagCount + ')', x, y); y += lh;
    context.fillText('Planets: ' + (Probes.planets ? Probes.planets.length : 0) + ' | Enemies: ' + (Probes.enemies ? Probes.enemies.length : 0), x, y);

    context.restore();
  };

  UI.checkWin = function () {
    if (Probes.flaggedCount === Probes.claimsNeeded) {
      Probes.canFire = false;
      UI.youWin();
    }
  };

  UI.checkLose = function () {
    for (var i = 0; i < Probes.flags.length; i++) {
      if (Probes.flags[i].landed === false) return false;
    }
    return true;
  };

  UI.youWin = function () {
    var canvas = Probes.canvas;
    var context = Probes.context;
    if (!canvas || !context) return;

    context.save();
    context.beginPath();
    context.fillStyle = 'green';
    context.fillRect(canvas.width / 4, canvas.height / 4, canvas.width / 2, canvas.height / 2.5);
    context.fill();
    context.stroke();
    context.strokeStyle = 'black';
    context.fillStyle = 'black';
    context.font = '40px Courier';
    context.fillText('You Win!', (canvas.width / 4) + 26, (canvas.height / 4) + 40);
    context.font = '20px Courier';
    context.fillText('(next level)', (canvas.width / 4) + 30, (canvas.height / 4) + 170);

    window.setTimeout(function () {
      // preserve current behavior: win jumps to level 3
      Probes.levels.loadLevel3();
    }, 1000);
  };

  UI.youLose = function () {
    var canvas = Probes.canvas;
    var context = Probes.context;
    if (!canvas || !context) return;

    context.save();
    context.beginPath();
    context.fillStyle = 'red';
    context.fillRect(canvas.width / 4, canvas.height / 4, canvas.width / 2, canvas.height / 2.5);
    context.fill();
    context.stroke();
    context.strokeStyle = 'black';
    context.fillStyle = 'black';
    context.font = '40px Courier';
    context.fillText('You Lose!', (canvas.width / 4) + 26, (canvas.height / 4) + 40);
    context.font = '20px Courier';
    context.fillText('(click to restart)', (canvas.width / 4) + 30, (canvas.height / 4) + 170);

    window.setTimeout(function () {
      context.restore();
      location.reload();
    }, 1000);
  };
}(window.Probes = window.Probes || {}));

