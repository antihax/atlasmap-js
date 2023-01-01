/* global L, console */

function findGlobalBiome(list) {
	for (let x in list) {
		if (list[x].includes(' Ocean Water')) return list[x].replace(' Ocean Water', '');

		let name = list[x];
		name = name.replace('Western ', '');
		name = name.replace('Eastern ', '');
		name = name.replace('Central ', '');
		name = name.replace('At Land', '');
		name = name.replace('Ocean Water', '');
		name = name.replace(' Mountain Peak', '');
		name = name.replace('High ', '');
		name = name.replace('Low ', '');
		name = name.trim();
		if (name) return name;
	}
	return false;
}

L.AtlasGrid = L.LayerGroup.extend({
	options: {
		xticks: 2,
		yticks: 3,
		grids: [],
		// Path style for the grid lines
		lineStyle: {
			stroke: true,
			color: '#111',
			opacity: 0.2,
			weight: 1,
		},
	},

	initialize: function (options) {
		L.LayerGroup.prototype.initialize.call(this);
		L.Util.setOptions(this, options);
	},

	onAdd: function (map) {
		this._map = map;

		// zoom map text
		map.on('zoomend', function () {
			let gridHeader = document.querySelectorAll('.leaflet-grid-header');
			if (gridHeader) {
				let size = 7 + map.getZoom() * 2.5;
				for (let i = 0; i < gridHeader.length; ++i) {
					gridHeader[i].style.fontSize = size + 'px';
				}
			}
		});

		let bounds = map._originalBounds;
		this._xTickSize = (bounds.getEast() - bounds.getWest()) / this.options.xticks;
		this._yTickSize = (bounds.getSouth() - bounds.getNorth()) / this.options.yticks;

		let grid;
		this.eachLayer(map.addLayer, map);

		fetch('json' + map.options.config.version + '/gridList.json', {
			dataType: 'json',
		})
			.then((res) => res.json())
			.then((grids) => {
				grid = this.draw(grids);
			})
			.catch((error) => {
				console.log(error);
			});
	},

	onRemove: function () {
		this.eachLayer(this.removeLayer, this);
	},

	_getGridBoarderOverridePosition: function (startVector, directionVector, angle) {
		// SGE can give us conflicting information.
		if (
			directionVector[0] === null ||
			directionVector.reduce(function (a, b) {
				return a + b;
			}, 2) === 0
		)
			return;

		let icon = L.icon({
			iconUrl: 'icons/Arrow2.svg',
			iconSize: [8, 8],
			iconAnchor: [4, 0],
		});
		let x = this._xTickSize * directionVector[0] + this._xTickSize / 2;
		let y = this._yTickSize * directionVector[1] + this._yTickSize / 2;
		this._drawGridBorderPin(startVector[0], startVector[1], x, y, icon, 'Grid Transfer', angle);
	},

	_drawGridBoarderOverrides: function (x, y, g) {
		this._getGridBoarderOverridePosition(
			[this._xTickSize * (x + 1), this._yTickSize * y + this._yTickSize / 2],
			g.DestEast,
			90,
		);
		this._getGridBoarderOverridePosition(
			[this._xTickSize * x, this._yTickSize * y + this._yTickSize / 2],
			g.DestWest,
			270,
		);
		this._getGridBoarderOverridePosition(
			[this._xTickSize * x + this._xTickSize / 2, this._yTickSize * y],
			g.DestNorth,
			0,
		);
		this._getGridBoarderOverridePosition(
			[this._xTickSize * x + this._xTickSize / 2, this._yTickSize * (y + 1)],
			g.DestSouth,
			180,
		);
	},

	_drawGridBorderPin: function (sX1, sY1, sX2, sY2, icon, title, angle) {
		let pin1 = this._map.addPortalPin(icon, [sY1, sX1], title, angle);
		this._map.Portals.addLayer(pin1);
		let pl = L.polyline(
			[
				[sY1, sX1],
				[sY2, sX2],
			],
			{color: 'red', opacity: 0.01},
		);
		pin1.lines = [pl];
		pin1.firstPin = pin1;
		this._map.Portals.addLayer(pl);
	},

	draw: function (grids) {
		let bounds = this._map._originalBounds;
		for (let i = 0; i < this.options.xticks + 1; i++) {
			this.addLayer(
				new L.Polyline(
					[
						[bounds.getNorth(), bounds.getWest() + this._xTickSize * i],
						[bounds.getSouth(), bounds.getWest() + this._xTickSize * i],
					],
					this.options.lineStyle,
				),
			);
		}
		for (let i = 0; i < this.options.yticks + 1; i++) {
			this.addLayer(
				new L.Polyline(
					[
						[bounds.getNorth() + this._yTickSize * i, bounds.getWest()],
						[bounds.getNorth() + this._yTickSize * i, bounds.getEast()],
					],
					this.options.lineStyle,
				),
			);
		}

		for (let x = 0; x < this.options.xticks; x++) {
			for (let y = 0; y < this.options.yticks; y++) {
				const grid = String.fromCharCode(65 + x) + (y + 1);

				this._drawGridBoarderOverrides(x, y, grids[grid]);

				let serverType = '';
				let serverTypeName = 'Lawless';
				switch (grids[grid].forceServerRules) {
					case 1: // Lawless
						serverType = '';
						serverTypeName = 'Lawless';
						break;
					case 2: // Lawless claim
						serverType = '&#9760;';
						serverTypeName = 'Claimable';
						break;
					case 3: // island claim
						serverType = '&#9813;';
						serverTypeName = 'Settlements';
						break;
					case 4:
						serverType = '&#9774;';
						serverTypeName = 'Freeport';
						break;
					case 5:
						serverType = '&#9774;';
						serverTypeName = 'Golden Age';
						break;
				}

				let text = `<div><div class="leaflet-grid-header">${grid}</div> <div class="leaflet-grid-header leaflet-grid-icon">${serverType}</div>`;
				let tooltip = L.marker(
					[bounds.getWest() + this._yTickSize * y, bounds.getNorth() + this._xTickSize * x],
					{
						icon: L.divIcon({
							className: 'leaflet-grid-marker',
							iconAnchor: [-2, -2],
						}),
						title: `${findGlobalBiome(grids[grid].biomes)} ${serverTypeName}`,
						clickable: false,
					},
				);
				this.addLayer(tooltip);
				tooltip._icon.innerHTML = text;
			}
		}

		return this;
	},
});

L.atlasgrid = function (options) {
	return new L.Grid(options);
};
