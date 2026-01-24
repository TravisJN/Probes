// Level definitions are plain data objects.
// `game.js` is responsible for hydrating entities via `loadLevel(levelId)`.

// Coordinate helpers:
// - Use `{ from: "center"|"left"|"right", offset: number }` for X
// - Use `{ from: "center"|"top"|"bottom", offset: number }` for Y
// - Or use a number: 0..1 is treated as fraction of canvas size; otherwise pixels.

window.PROBES_LEVELS = [
	{
		id: 1,
		name: "Level 1",
		flagCount: 8,
		claimsNeeded: 1,
		ship: { x: -100, y: 25 },
		planets: [
			{
				gravity: 5,
				sun: true,
				color: "yellow",
				radius: 45,
				gravityRadius: 200,
				orbit: false,
				x: { from: "center", offset: 0 },
				y: { from: "center", offset: 0 }
			},
			{
				gravity: 25,
				x: { from: "center", offset: 0 },
				y: { from: "bottom", offset: -80 },
				// stationary target
				target: { self: true }
			}
		]
	},
	{
		id: 2,
		name: "Level 2",
		flagCount: 3,
		claimsNeeded: 2,
		ship: { x: -100, y: 25 },
		planets: [
			{
				gravity: 20,
				sun: true,
				color: "yellow",
				radius: 30,
				gravityRadius: 175,
				orbit: false,
				x: { from: "center", offset: 0 },
				y: { from: "center", offset: 0 }
			},
			{
				gravity: 5,
				radius: 18,
				x: { from: "center", offset: 0 },
				y: { from: "bottom", offset: -80 },
				orbit: true,
				target: { planetIndex: 0 }
			}
		]
	},
	{
		id: 3,
		name: "Level 3",
		flagCount: 3,
		claimsNeeded: 2,
		ship: { x: -100, y: 25 },
		planets: [
			{
				gravity: 20,
				sun: true,
				color: "yellow",
				radius: 45,
				gravityRadius: 175,
				orbit: false,
				x: { from: "center", offset: 0 },
				y: { from: "center", offset: 0 }
			},
			{
				gravity: 5,
				radius: 15,
				x: { from: "center", offset: 0 },
				y: { from: "bottom", offset: -35 },
				orbit: true,
				target: { planetIndex: 0 }
			},
			{
				gravity: 5,
				radius: 10,
				x: { from: "center", offset: 0 },
				y: { from: "bottom", offset: -120 },
				orbit: true,
				orbitRadius: 175,
				orbitSpeed: 0.01,
				target: { planetIndex: 0 }
			}
		]
	}
];