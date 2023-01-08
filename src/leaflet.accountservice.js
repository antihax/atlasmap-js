/* global L */

L.Control.AccountService = L.Control.extend({
	options: {
		position: 'topleft',
	},

	// hardcode for now
	_icons_src: {
		Bed: 'Item_SimpleBed_Icon',
		Broadsider: 'ICON_Broadsider',
		Carrack: 'ICON_Carrack',
		Cog: 'ICON_Cog',
		Brigantine: 'Item_BrigHull_Icon',
		Harrier: 'ICON_Harrier',
		Kraken: 'KrakenShipNewIcon',
		Turtle: 'Turtleship_Icon',
		MortarShip: 'Mortarship_Icon',
		Ramming_Galley: 'Galley_Icon',
		Galleon: 'Item_GalleonHull_Icon',
		Raft: 'Item_Raft_Icon',
		Schooner: 'Item_SchoonerHull_Icon',
		Sloop: 'Item_SloopHull_Icon',
		Sloop_FromNPC: 'Item_SloopHull_Icon',
		Submarine: 'Item_Submarine_Icon',
		TrampFreighter: 'ICON_Tramp_Freighter',
		TurtleShip: 'Turtleship_Icon',
	},

	_icons: {},
	_ships: {},
	_eventSource: {},

	initialize: function (options) {
		L.Util.setOptions(this, options);
		for (let i in this._icons_src) {
			this._icons[i] = L.icon({
				iconUrl: '/atlasIcons/entities/' + this._icons_src[i] + '_32.png',
				iconSize: [30, 30],
				iconAnchor: [15, 15],
				popupAnchor: [0, -15],
			});
		}
		this._icons.dead = L.icon({
			iconUrl: '/atlasIcons/entities/sunk.png',
			iconSize: [30, 30],
			iconAnchor: [15, 15],
			popupAnchor: [0, -15],
		});
	},

	onAdd: function (map) {
		let container = L.DomUtil.create('div', 'leaflet-control-zoom leaflet-bar leaflet-control');
		this._map = map;
		this._config = map.options.config;

		fetch(this._config.AtlasMapServer + '/s/account', {
			dataType: 'json',
		})
			.then((r) => {
				r.json()
					.then((account) => {
						this._createButton(
							'<img src="icons/logout.svg" height=30 width=30>',
							'logout',
							'leaflet-control-pin leaflet-bar-part leaflet-bar-part-top-and-bottom',
							container,
							this._logout,
							this,
						);
						this._startEventListener(map);
					})
					.catch((error) => {
						this._createButton(
							'<img src="icons/steam.svg" height=30 width=30>',
							'Login with Steam',
							'leaflet-control-pin leaflet-bar-part leaflet-bar-part-top-and-bottom',
							container,
							this._login,
							this,
						);
					});
			})
			.catch((error) => {
				console.log('backend unavailable; not enabling login', error);
			});
		return container;
	},

	onRemove: function (map) {},
	_startEventListener: function (map) {
		this._eventSource = new EventSource(this._config.AtlasMapServer + '/s/events');
		this._eventSource.onmessage = (event) => {
			let d = JSON.parse(event.data);
			if (d.EntityType !== undefined) {
				this._processEntity(d);
			}
		};
	},

	_processEntity: function (d) {
		switch (d.EntityType) {
			case 'Ship':
			case 'ETribeEntityType::Ship':
				this._trackShip(d);
				break;

			case 'Bed':
			case 'ETribeEntityType::Bed':
				this._trackShip(d);
				break;
		}
	},
	_trackShip: function (d) {
		if (d.ParentEntityID !== 0) 
			return; // ignore child entities (beds on ships)

		// Get server grid reference.
		let duration = 5000,
			x = d.ServerID >> 16,
			y = d.ServerID & 0xffff,
			unrealX = this._map.options.config.GridSize * d.X + this._map.options.config.GridSize * x,
			unrealY = this._map.options.config.GridSize * d.Y + this._map.options.config.GridSize * y,
			gps = this._map.worldToLeaflet(unrealX, unrealY);
		let ship = this._ships[d.EntityID];
		if (ship === undefined) {
			if (this._icons[d.ShipType] !== undefined) {
				ship = L.Marker.movingMarker([gps], [duration], {
					icon: d.IsDead ? this._icons.dead : this._icons[d.ShipType],
					title: d.EntityName,
				}).addTo(this._map);
			} else {
				if (d.ParentEntityID === 0) {
					ship = L.Marker.movingMarker([gps], [duration],{
						icon: d.EntityType === "Bed" ? this._icons.Bed : null,
						title: d.EntityName,
					}).addTo(this._map);
				}
			}
		}

		ship.addLatLng(gps, duration);
		ship.start();
		this._ships[d.EntityID] = ship;
	},

	_login: function () {
		window.location = this._config.AtlasMapServer + '/login';
	},

	_logout: function () {
		window.location = this._config.AtlasMapServer + '/logout';
	},

	_createButton: function (html, title, className, container, fn, context) {
		let link = L.DomUtil.create('a', className, container);
		link.innerHTML = html;
		link.href = '#';
		link.title = title;

		L.DomEvent.on(link, 'click', L.DomEvent.stopPropagation)
			.on(link, 'click', L.DomEvent.preventDefault)
			.on(link, 'click', fn, context)
			.on(link, 'dbclick', L.DomEvent.stopPropagation);
		return link;
	},

	draw: function (grids) {
		return this;
	},
});

L.control.accountControl = function (options) {
	return new L.Control.AccountService(options);
};

var accountControl;
L.Map.addInitHook(function () {
	if (this.options.config.AtlasMapServer) {
		this.accountControl = new L.Control.AccountService();
		accountControl = this.accountControl;
		this.addControl(this.accountControl);
	}
});
