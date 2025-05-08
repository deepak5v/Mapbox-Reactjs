import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl'; // Main Mapbox GL library
import 'mapbox-gl/dist/mapbox-gl.css'; // Mapbox default styles
import './mapbox.css'; // Custom styles

const MapboxMap = () => {
  // Refs to store DOM element and map instance
  const mapContainerRef = useRef(null); // Reference to the map container div
  const mapRef = useRef(null); // Reference to store the map instance
  const [searchQuery, setSearchQuery] = useState(''); // State to store search input value

  // Function to handle search operations
  const handleSearch = async () => {
    try {
      // Make API call to Mapbox Geocoding API to convert search text to coordinates
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${mapboxgl.accessToken}`
      );
      const data = await response.json();

      // Check if we got any results
      if (data.features && data.features.length > 0) {
        // Extract coordinates from the first result
        const [longitude, latitude] = data.features[0].center;
        
        // Animate map to new location
        mapRef.current.flyTo({
          center: [longitude, latitude],
          zoom: 15,
          essential: true // This ensures the animation runs
        });

        // Add a marker pin at the searched location
        new mapboxgl.Marker({ color: '#4CAF50' })
          .setLngLat([longitude, latitude])
          .setPopup( // Add popup information window
            new mapboxgl.Popup({ offset: 25 }) // Offset to position popup above marker
              .setHTML(`<h3>📍 ${data.features[0].place_name}</h3>`)
          )
          .addTo(mapRef.current);

        // Remove existing highlight area if any
        if (mapRef.current.getLayer('search-area')) {
          mapRef.current.removeLayer('search-area');
        }

        // Add new highlight area source (data for the highlight circle)
        mapRef.current.addSource('search-area', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [longitude, latitude]
            }
          }
        });

        // Add visual highlight circle layer
        mapRef.current.addLayer({
          id: 'search-area',
          source: 'search-area',
          type: 'circle',
          paint: {
            'circle-radius': 25, // Size of highlight circle
            'circle-color': '#4CAF50', // Green color
            'circle-opacity': 0.2, // Semi-transparent
            'circle-stroke-width': 1, // Border width
            'circle-stroke-color': '#4CAF50' // Border color
          }
        });
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  // Initialize map when component mounts
  useEffect(() => {
    // Set Mapbox access token
    mapboxgl.accessToken = 'pk.eyJ1IjoiZGVlcGFrNTUiLCJhIjoiY205OWhsczJ4MGRpcDJqcGgzMnJocHZ0OCJ9.C_JWK_NHKQm2rD1-qPgd-w';

    if (!mapContainerRef.current) return;

    // Create new map instance
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12', // Map style to use
      center: [78.9629, 20.5937], // Initial center coordinates (India)
      zoom: 3, // Initial zoom level
    });

    mapRef.current = map; // Store map reference

    // When map is loaded
    map.on('load', () => {
      // Add zoom/rotation controls
      map.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Get user's current location if available
      if ("geolocation" in navigator) {
        
        navigator.geolocation.getCurrentPosition(
          // Success callback
          (position) => {
            const { latitude, longitude } = position.coords;
            
            // Move map to user's location
            map.flyTo({
              center: [longitude, latitude],
              zoom: 11,
              speed: 1.1,
              curve: 1.5,
              easing: (t) => t,
              essential: true
            });

            // Add red marker at user's location
            new mapboxgl.Marker({ color: '#FF0000' })
              .setLngLat([longitude, latitude])
              .setPopup(new mapboxgl.Popup().setHTML('<h3>You are here</h3>'))
              .addTo(map);
          },
          // Error callback
          (error) => {
            console.error('Error getting location:', error);
            // Fall back to default location
            map.flyTo({
              center: [78.9629, 20.5937],
              zoom: 11,
            });
          },
          // Options for getting location
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          }
        );
      }

      // Fetch and display household data markers
      fetchHouseholdData(map);
    });
    
    // Cleanup function to remove map when component unmounts
    return () => map.remove();
  }, []); // Empty dependency array means this runs once on mount

  const fetchHouseholdData = async (map) => {
    try {
      const response = await fetch('http://192.168.1.15:5238/api/MobApi/GetMasterHouseHold/be0d4aac-cd46-48dd-a1ce-40bd551889a4');
      const data = await response.json();
      const limitedData = data.slice(0, 50);

      limitedData.forEach((corrd) => {
        const { latitude, longitude, ownerName, propertyType, propertyCategory, primaryMobileNo } = corrd;

        const markerEl = document.createElement('div');
        markerEl.className = 'custom-marker';
        markerEl.style.width = '15px';  // Reduced from 30px
        markerEl.style.height = '15px'; // Reduced from 30px
        markerEl.style.cursor = 'pointer';
        markerEl.style.display = 'flex';
        markerEl.style.alignItems = 'center';
        markerEl.style.justifyContent = 'center';

        const img = document.createElement('img');
        img.src = markerImage;
        img.alt = 'Marker';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.borderRadius = '50%';

        markerEl.appendChild(img);

        const popup = new mapboxgl.Popup({ offset: 25, className: 'custom-popup' }).setHTML(`
          <div>
            <h3>📍 Location Info</h3>
            <p>👤 <strong>Owner:</strong> ${ownerName || 'N/A'}</p>
            <p>🏠 <strong>Property Type:</strong> ${propertyType || 'N/A'}</p>
            <p>📂 <strong>Category:</strong> ${propertyCategory || 'N/A'}</p>
            <p>📞 <strong>Phone:</strong> ${primaryMobileNo || 'N/A'}</p>
          </div>
        `);

        new mapboxgl.Marker(markerEl)
          .setLngLat([longitude, latitude])
          .setPopup(popup)
          .addTo(map);
      });
    } catch (err) {
      console.error('Failed to fetch household data:', err);
    }
  };

  return (
    <div className="map-wrapper">
      <div className="search-box">
        <div className="search-input-container">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search any place..."
            className="search-input"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button 
            onClick={handleSearch} 
            className="search-button"
            disabled={!searchQuery}
          >
            <span role="img" aria-label="search">🔍</span>
          </button>
        </div>
      </div>
      <div ref={mapContainerRef} className="map-container" />
    </div>
  );
};

export default MapboxMap;