// WebGIS Leaflet Map Controller for Forest Rights Act (FRA) Monitoring
// Manages geospatial layers, district boundaries, markers, clusters, and interactive popups

import { DISTRICT_REGIONS, FOREST_RESERVE_LAYERS } from '../data/districtBoundaries.js';

export class WebGISMapManager {
  constructor(mapContainerId, onSelectClaimCallback, onSelectDistrictCallback) {
    this.containerId = mapContainerId;
    this.onSelectClaim = onSelectClaimCallback;
    this.onSelectDistrict = onSelectDistrictCallback;

    this.map = null;
    this.markerClusterGroup = null;
    this.districtLayersGroup = null;
    this.forestLayersGroup = null;
    this.activeClaims = [];
    this.activeDistricts = DISTRICT_REGIONS;

    this.currentBasemap = "dark";
    this.tileLayers = {};

    this.visibleLayers = {
      districts: true,
      ifr: true,
      cfr: true,
      anomalies: true,
      forestCover: true
    };
  }

  init() {
    if (this.map) return;

    // Centered on the Geographic Center of India
    this.map = L.map(this.containerId, {
      center: [22.50, 79.50],
      zoom: 5,
      zoomControl: false,
      attributionControl: false
    });

    // Add zoom control at top-left
    L.control.zoom({ position: 'topleft' }).addTo(this.map);

    // Setup 100% Free, No-Key-Required High-Res GIS Tile Basemaps (ESRI & OSM)
    // Dark Gray Canvas: Clean dark GIS basemap with zero watermarks
    this.tileLayers.dark = L.tileLayer(
      'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 16,
        attribution: 'ESRI Dark Gray Canvas'
      }
    );

    // ESRI World Imagery: High-resolution satellite imagery
    this.tileLayers.satellite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 18,
        attribution: 'ESRI World Imagery'
      }
    );

    // OpenStreetMap: Standard detailed topographic reference
    this.tileLayers.topo = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution: 'OpenStreetMap'
      }
    );

    this.tileLayers.dark.addTo(this.map);

    // Initialize Layer Groups
    this.districtLayersGroup = L.featureGroup().addTo(this.map);
    this.forestLayersGroup = L.featureGroup().addTo(this.map);

    // Initialize Marker Cluster Group
    this.markerClusterGroup = L.markerClusterGroup({
      maxClusterRadius: 45,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        let cClass = 'marker-cluster-small';
        if (count > 25) cClass = 'marker-cluster-medium';
        if (count > 70) cClass = 'marker-cluster-large';

        return L.divIcon({
          html: `<div><span>${count}</span></div>`,
          className: `marker-cluster ${cClass}`,
          iconSize: L.point(36, 36)
        });
      }
    });

    this.map.addLayer(this.markerClusterGroup);

    // Render Initial Static Geo Overlays
    this.renderDistrictBoundaries();
    this.renderForestOverlays();
  }

  setBasemap(type) {
    if (this.tileLayers[this.currentBasemap]) {
      this.map.removeLayer(this.tileLayers[this.currentBasemap]);
    }
    if (this.tileLayers[type]) {
      this.tileLayers[type].addTo(this.map);
      this.currentBasemap = type;
    }
  }

  renderDistrictBoundaries() {
    this.districtLayersGroup.clearLayers();

    this.activeDistricts.forEach((district) => {
      let layer;

      if (district.geoJson) {
        layer = L.geoJSON(district.geoJson, {
          style: {
            color: '#06b6d4',
            weight: 2,
            dashArray: '4, 4',
            fillColor: 'rgba(6, 182, 212, 0.08)',
            fillOpacity: 0.25
          },
          onEachFeature: (feature, fLayer) => {
            const featName = feature.properties?.name || district.name;
            fLayer.bindTooltip(
              `<strong>${featName} (${district.state})</strong><br/>Official Boundary (LGD: ${feature.properties?.['ref:LGD:district'] || 'District'})<br/>Tribal Pop: ${district.tribalPct}% | Forest: ${(district.forestAreaHa / 1000).toFixed(0)}k Ha`,
              { sticky: true, className: 'leaflet-tooltip-dark' }
            );

            fLayer.on('click', () => {
              if (this.onSelectDistrict) {
                this.onSelectDistrict(district.name, district.state);
              }
              this.map.flyTo(district.center, district.zoom || 9, { duration: 1 });
            });

            fLayer.on('mouseover', (e) => {
              e.target.setStyle({
                weight: 3,
                color: '#10b981',
                fillOpacity: 0.4
              });
            });

            fLayer.on('mouseout', (e) => {
              e.target.setStyle({
                weight: 2,
                color: '#06b6d4',
                fillOpacity: 0.25
              });
            });
          }
        });
      } else {
        layer = L.polygon(district.polygon, {
          color: '#06b6d4',
          weight: 2,
          dashArray: '4, 4',
          fillColor: 'rgba(6, 182, 212, 0.08)',
          fillOpacity: 0.25
        });

        layer.bindTooltip(
          `<strong>${district.name} (${district.state})</strong><br/>Tribal Pop: ${district.tribalPct}% | Forest: ${(district.forestAreaHa / 1000).toFixed(0)}k Ha`,
          { sticky: true, className: 'leaflet-tooltip-dark' }
        );

        layer.on('click', () => {
          if (this.onSelectDistrict) {
            this.onSelectDistrict(district.name, district.state);
          }
          this.map.flyTo(district.center, district.zoom || 9, { duration: 1 });
        });

        layer.on('mouseover', (e) => {
          const l = e.target;
          l.setStyle({
            weight: 3,
            color: '#10b981',
            fillOpacity: 0.4
          });
        });

        layer.on('mouseout', (e) => {
          const l = e.target;
          l.setStyle({
            weight: 2,
            color: '#06b6d4',
            fillOpacity: 0.25
          });
        });
      }

      this.districtLayersGroup.addLayer(layer);
    });
  }

  renderForestOverlays() {
    this.forestLayersGroup.clearLayers();

    FOREST_RESERVE_LAYERS.forEach((res) => {
      const poly = L.polygon(res.polygon, {
        color: res.color,
        weight: 1.5,
        fillColor: res.fillColor,
        fillOpacity: 0.4
      });

      poly.bindTooltip(`<strong>${res.name}</strong><br/>${res.type}`, { sticky: true });
      this.forestLayersGroup.addLayer(poly);
    });
  }

  updateClaimsMarkers(claims) {
    this.activeClaims = claims;
    this.markerClusterGroup.clearLayers();

    claims.forEach((claim) => {
      // Layer visibility filter check
      if (claim.claimType === "IFR" && !this.visibleLayers.ifr) return;
      if ((claim.claimType === "CFR" || claim.claimType === "CFRR" || claim.claimType === "CR") && !this.visibleLayers.cfr) return;
      if (claim.hasAnomaly && !this.visibleLayers.anomalies) return;

      let pinClass = "pin-ifr";
      let pinText = "IFR";

      if (claim.hasAnomaly) {
        pinClass = "pin-anomaly";
        pinText = "!";
      } else if (claim.status === "Title Conferred") {
        pinClass = "pin-title";
        pinText = "✓";
      } else if (claim.claimType === "CFR" || claim.claimType === "CFRR") {
        pinClass = "pin-cfr";
        pinText = "CFR";
      }

      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="custom-map-pin ${pinClass}" style="width: 24px; height: 24px;">${pinText}</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker(claim.coordinates, { icon: customIcon });

      const anomalyBadge = claim.hasAnomaly
        ? `<span class="badge badge-danger"><i class="fa-solid fa-triangle-exclamation"></i> ${claim.anomalies[0].title}</span>`
        : `<span class="badge badge-primary"><i class="fa-solid fa-check"></i> Compliant</span>`;

      const popupHtml = `
        <div class="popup-claim-header">
          <h4>${claim.id}</h4>
          <span class="badge ${claim.status === 'Title Conferred' ? 'badge-primary' : 'badge-warning'}">${claim.status}</span>
        </div>
        <div class="popup-claim-details">
          <div><strong>Applicant:</strong> ${claim.applicant} (${claim.category} - ${claim.tribe || "ST"})</div>
          <div><strong>Type & Area:</strong> ${claim.claimType} | <strong>${claim.landAreaHa} Ha</strong></div>
          <div><strong>Gram Sabha:</strong> ${claim.gramSabha}, ${claim.district}</div>
          <div><strong>Days in Pipeline:</strong> ${claim.daysInPipeline} days</div>
          <div style="margin-top: 4px;">${anomalyBadge}</div>
        </div>
        <div class="popup-claim-footer">
          <button class="btn btn-primary btn-sm" id="btn-popup-inspect-${claim.id.replace(/[^a-zA-Z0-9]/g, '')}">
            <i class="fa-solid fa-magnifying-glass"></i> Inspect Dossier
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 320 });

      marker.on('popupopen', () => {
        const btnId = `btn-popup-inspect-${claim.id.replace(/[^a-zA-Z0-9]/g, '')}`;
        const inspectBtn = document.getElementById(btnId);
        if (inspectBtn) {
          inspectBtn.onclick = () => {
            if (this.onSelectClaim) this.onSelectClaim(claim);
          };
        }
      });

      this.markerClusterGroup.addLayer(marker);
    });
  }

  setLayerVisibility(layerKey, isVisible) {
    this.visibleLayers[layerKey] = isVisible;

    if (layerKey === "districts") {
      if (isVisible) this.map.addLayer(this.districtLayersGroup);
      else this.map.removeLayer(this.districtLayersGroup);
    } else if (layerKey === "forestCover") {
      if (isVisible) this.map.addLayer(this.forestLayersGroup);
      else this.map.removeLayer(this.forestLayersGroup);
    } else {
      this.updateClaimsMarkers(this.activeClaims);
    }
  }

  fitAll() {
    this.map.flyTo([21.50, 82.50], 6, { duration: 1.2 });
  }

  focusDistrict(districtName) {
    const dist = this.activeDistricts.find((d) => d.name === districtName);
    if (dist) {
      this.map.flyTo(dist.center, dist.zoom || 9, { duration: 1.2 });
    }
  }

  focusAnomalyHotspots() {
    const anomalousClaims = this.activeClaims.filter((c) => c.hasAnomaly);
    if (anomalousClaims.length > 0) {
      const bounds = L.latLngBounds(anomalousClaims.map((c) => c.coordinates));
      this.map.flyToBounds(bounds, { padding: [50, 50], duration: 1.2 });
    }
  }
}
