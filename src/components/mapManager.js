// WebGIS Leaflet Map Controller for Forest Rights Act (FRA) Monitoring
// Manages geospatial layers, district boundaries, markers, clusters, and interactive popups

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { DISTRICT_REGIONS, FOREST_RESERVE_LAYERS } from '../data/districtBoundaries.js';

// Fix Leaflet's default icon paths, which break under Vite's bundled asset URLs.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

export class WebGISMapManager {
  constructor(mapContainerId, onSelectClaimCallback, onSelectDistrictCallback) {
    this.containerId = mapContainerId;
    this.onSelectClaim = onSelectClaimCallback;
    this.onSelectDistrict = onSelectDistrictCallback;

    this.map = null;
    this.markerClusterGroup = null;
    this.districtLayersGroup = null;
    this.forestLayersGroup = null;
    this.heatmapLayerGroup = null;
    this.activeClaims = [];
    this.activeDistricts = DISTRICT_REGIONS;

    this.currentBasemap = "satellite";
    this.tileLayers = {};

    this.visibleLayers = {
      districts: true,
      ifr: true,
      cfr: true,
      anomalies: true,
      forestCover: true,
      heatmap: false
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

    this.tileLayers.satellite.addTo(this.map);

    // Initialize Layer Groups
    this.districtLayersGroup = L.featureGroup().addTo(this.map);
    this.forestLayersGroup = L.featureGroup().addTo(this.map);
    this.heatmapLayerGroup = L.featureGroup();

    // Initialize Marker Cluster Group with Dynamic Anomaly Risk Detection
    this.markerClusterGroup = L.markerClusterGroup({
      maxClusterRadius: 45,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: (cluster) => {
        const markers = cluster.getAllChildMarkers();
        const count = markers.length;
        
        let anomalyCount = 0;
        let hasCritical = false;
        let hasHigh = false;

        markers.forEach((m) => {
          if (m.claimData && m.claimData.hasAnomaly) {
            anomalyCount++;
            const isCritical = m.claimData.anomalies && m.claimData.anomalies.some(
              (a) => a.severity === 'CRITICAL' || a.type === 'HIGH_REJECTION' || a.type === 'SPATIAL_OVERLAP'
            );
            if (isCritical) hasCritical = true;
            else hasHigh = true;
          }
        });

        let cClass = 'marker-cluster-small';
        if (count > 25) cClass = 'marker-cluster-medium';
        if (count > 70) cClass = 'marker-cluster-large';

        // Anomaly alert styling
        let anomalyClass = '';
        let badgeHtml = '';

        if (anomalyCount > 0) {
          if (hasCritical || anomalyCount >= 5) {
            anomalyClass = 'cluster-anomaly-critical';
          } else {
            anomalyClass = 'cluster-anomaly-high';
          }
          badgeHtml = `<span class="cluster-anomaly-badge" title="${anomalyCount} Anomalies Flagged"><i class="fa-solid fa-triangle-exclamation"></i> ${anomalyCount}</span>`;
        }

        return L.divIcon({
          html: `<div class="cluster-inner"><span>${count}</span>${badgeHtml}</div>`,
          className: `marker-cluster ${cClass} ${anomalyClass}`,
          iconSize: L.point(42, 42)
        });
      }
    });

    this.map.addLayer(this.markerClusterGroup);

    // Render Initial Static Geo Overlays
    this.renderDistrictBoundaries();
    this.renderForestOverlays();
  }

  setBasemap(type) {
    if (!this.map) return;
    if (this.tileLayers[this.currentBasemap]) {
      this.map.removeLayer(this.tileLayers[this.currentBasemap]);
    }
    if (this.tileLayers[type]) {
      this.tileLayers[type].addTo(this.map);
      this.currentBasemap = type;
    }
  }

  setDistrictAnalytics(analytics) {
    this.districtAnalytics = analytics || [];
    this.renderDistrictBoundaries();
  }

  renderDistrictBoundaries() {
    if (!this.districtLayersGroup) return;
    this.districtLayersGroup.clearLayers();

    this.activeDistricts.forEach((district) => {
      let layer;
      
      // Look up district analytics to get live risk tier & anomaly count
      const analytics = (this.districtAnalytics || []).find((d) => d.name === district.name && d.state === district.state);
      const riskTier = analytics?.riskTier || 'LOW';
      const anomalyCount = analytics?.anomalousClaimsCount || 0;

      let borderColor = '#06b6d4';
      let fillColor = 'rgba(6, 182, 212, 0.08)';
      let dashArray = '4, 4';
      let fillOpacity = 0.25;

      if (riskTier === 'CRITICAL' || anomalyCount >= 8) {
        borderColor = '#f43f5e';
        fillColor = 'rgba(244, 63, 94, 0.18)';
        dashArray = '3, 3';
        fillOpacity = 0.35;
      } else if (riskTier === 'MODERATE' || anomalyCount >= 3) {
        borderColor = '#f59e0b';
        fillColor = 'rgba(245, 158, 11, 0.12)';
        dashArray = '4, 4';
        fillOpacity = 0.28;
      }

      const tooltipContent = `
        <div style="font-size: 11px; min-width: 140px;">
          <strong style="color: ${borderColor}; font-size: 12px;">${district.name} (${district.state})</strong><br/>
          <span>Risk Status: <strong>${riskTier}</strong> (${anomalyCount} Anomalies)</span><br/>
          <span>Tribal Pop: ${district.tribalPct}% | Forest: ${(district.forestAreaHa / 1000).toFixed(0)}k Ha</span>
          ${analytics ? `<br/><span>Recognition: ${analytics.recognitionRate}% | Rejection: ${analytics.rejectionRate}%</span>` : ''}
        </div>
      `;

      if (district.geoJson) {
        layer = L.geoJSON(district.geoJson, {
          style: {
            color: borderColor,
            weight: riskTier === 'CRITICAL' ? 2.5 : 2,
            dashArray: dashArray,
            fillColor: fillColor,
            fillOpacity: fillOpacity
          },
          onEachFeature: (feature, fLayer) => {
            fLayer.bindTooltip(tooltipContent, { sticky: true, className: 'leaflet-tooltip-dark' });

            fLayer.on('click', () => {
              if (this.onSelectDistrict) {
                this.onSelectDistrict(district.name, district.state);
              }
              this.map.flyTo(district.center, district.zoom || 9, { duration: 1 });
            });

            fLayer.on('mouseover', (e) => {
              e.target.setStyle({
                weight: 3.5,
                color: '#10b981',
                fillOpacity: 0.45
              });
            });

            fLayer.on('mouseout', (e) => {
              e.target.setStyle({
                weight: riskTier === 'CRITICAL' ? 2.5 : 2,
                color: borderColor,
                fillOpacity: fillOpacity
              });
            });
          }
        });
      } else {
        layer = L.polygon(district.polygon, {
          color: borderColor,
          weight: riskTier === 'CRITICAL' ? 2.5 : 2,
          dashArray: dashArray,
          fillColor: fillColor,
          fillOpacity: fillOpacity
        });

        layer.bindTooltip(tooltipContent, { sticky: true, className: 'leaflet-tooltip-dark' });

        layer.on('click', () => {
          if (this.onSelectDistrict) {
            this.onSelectDistrict(district.name, district.state);
          }
          this.map.flyTo(district.center, district.zoom || 9, { duration: 1 });
        });

        layer.on('mouseover', (e) => {
          const l = e.target;
          l.setStyle({
            weight: 3.5,
            color: '#10b981',
            fillOpacity: 0.45
          });
        });

        layer.on('mouseout', (e) => {
          const l = e.target;
          l.setStyle({
            weight: riskTier === 'CRITICAL' ? 2.5 : 2,
            color: borderColor,
            fillOpacity: fillOpacity
          });
        });
      }

      this.districtLayersGroup.addLayer(layer);
    });
  }

  renderForestOverlays() {
    if (!this.forestLayersGroup) return;
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
    if (!this.markerClusterGroup) return;
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
      marker.claimData = claim;

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

      const hoverTooltipContent = `
        <div style="font-size: 11px; min-width: 170px; line-height: 1.4;">
          <strong style="color: ${claim.hasAnomaly ? '#f43f5e' : '#10b981'}; font-size: 12px;">${claim.id} • ${claim.claimType}</strong><br/>
          <span><strong>Applicant:</strong> ${claim.applicant} (${claim.category})</span><br/>
          <span><strong>Area:</strong> ${claim.landAreaHa} Ha | <strong>Stage:</strong> ${claim.status}</span><br/>
          <span><strong>Gram Sabha:</strong> ${claim.gramSabha}, ${claim.district}</span>
          ${claim.hasAnomaly ? `<div style="margin-top: 4px; color: #f43f5e; font-weight: 700;"><i class="fa-solid fa-triangle-exclamation"></i> ${claim.anomalies[0].title}</div>` : ''}
        </div>
      `;

      marker.bindTooltip(hoverTooltipContent, {
        sticky: true,
        direction: 'top',
        className: 'leaflet-tooltip-dark'
      });

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

    this.renderPendingDensityHeatmap(claims);
  }

  /**
   * Lightweight "pending claims density" heatmap rendered as graduated,
   * softly-blurred circle markers sized/colored by pending backlog per district.
   */
  renderPendingDensityHeatmap(claims) {
    if (!this.heatmapLayerGroup) return;
    this.heatmapLayerGroup.clearLayers();

    const pendingByDistrict = new Map();
    claims.forEach((c) => {
      if (c.status === "Title Conferred" || c.status === "Rejected") return;
      const key = c.district;
      if (!pendingByDistrict.has(key)) pendingByDistrict.set(key, { count: 0, center: null });
      const entry = pendingByDistrict.get(key);
      entry.count += 1;
      if (!entry.center) {
        const district = this.activeDistricts.find((d) => d.name === c.district);
        entry.center = district ? district.center : c.coordinates;
      }
    });

    const maxCount = Math.max(1, ...[...pendingByDistrict.values()].map((v) => v.count));

    pendingByDistrict.forEach(({ count, center }) => {
      if (!center) return;
      const intensity = count / maxCount;
      const radius = 15000 + intensity * 45000;

      // Layered glow rings for a soft heat-blob effect (no extra plugin dependency)
      [1, 0.65, 0.35].forEach((scale, idx) => {
        this.heatmapLayerGroup.addLayer(
          L.circle(center, {
            radius: radius * scale,
            stroke: false,
            fillColor: intensity > 0.66 ? '#f43f5e' : intensity > 0.33 ? '#f59e0b' : '#eab308',
            fillOpacity: 0.22 - idx * 0.05,
            interactive: idx === 0
          }).bindTooltip(
            `<strong>${count} pending claim${count === 1 ? '' : 's'}</strong> in this district`,
            { sticky: true, className: 'leaflet-tooltip-dark' }
          )
        );
      });
    });
  }

  setLayerVisibility(layerKey, isVisible) {
    this.visibleLayers[layerKey] = isVisible;
    if (!this.map) return;

    if (layerKey === "districts") {
      if (isVisible) this.map.addLayer(this.districtLayersGroup);
      else this.map.removeLayer(this.districtLayersGroup);
    } else if (layerKey === "forestCover") {
      if (isVisible) this.map.addLayer(this.forestLayersGroup);
      else this.map.removeLayer(this.forestLayersGroup);
    } else if (layerKey === "heatmap") {
      if (isVisible) this.map.addLayer(this.heatmapLayerGroup);
      else this.map.removeLayer(this.heatmapLayerGroup);
    } else {
      this.updateClaimsMarkers(this.activeClaims);
    }
  }

  fitAll() {
    if (!this.map) return;
    this.map.flyTo([21.50, 82.50], 6, { duration: 1.2 });
  }

  focusDistrict(districtName) {
    if (!this.map) return;
    const dist = this.activeDistricts.find((d) => d.name === districtName);
    if (dist) {
      this.map.flyTo(dist.center, dist.zoom || 9, { duration: 1.2 });
    }
  }

  focusAnomalyHotspots() {
    if (!this.map) return;
    const anomalousClaims = this.activeClaims.filter((c) => c.hasAnomaly);
    if (anomalousClaims.length > 0) {
      const bounds = L.latLngBounds(anomalousClaims.map((c) => c.coordinates));
      this.map.flyToBounds(bounds, { padding: [50, 50], duration: 1.2 });
    }
  }
}
