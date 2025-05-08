import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './mapbox.css';
import { IoMenuOutline, IoCloseOutline } from "react-icons/io5";
import earthIcon from '../assets/earth.jpg';
import satelliteIcon from '../assets/satellite.jpeg';
import lightIcon from '../assets/light.gif';
import darkIcon from '../assets/dark.png';
import locationIcon from '../assets/location.png'
import carSvg from '../assets/Car.svg'


const Mapbox = () => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const selectedItemRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [originInput, setOriginInput] = useState('');
  const [destinationInput, setDestinationInput] = useState('');
  const [isUIVisible, setIsUIVisible] = useState(true);
  const [showTraffic, setShowTraffic] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [bookmarkInput, setBookmarkInput] = useState('');
  const [bookmarks, setBookmarks] = useState([]);
  const markerRefs = useRef([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [cursorCoords, setCursorCoords] = useState({ lng: 0, lat: 0 });
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [selectedOriginSuggestionIndex, setSelectedOriginSuggestionIndex] = useState(-1);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [selectedDestinationSuggestionIndex, setSelectedDestinationSuggestionIndex] = useState(-1);

  const [bookmarkSuggestions, setBookmarkSuggestions] = useState([]);
  const [showBookmarkSuggestions, setShowBookmarkSuggestions] = useState(false);
  const [selectedBookmarkSuggestionIndex, setSelectedBookmarkSuggestionIndex] = useState(-1);

  const [adding, setAdding] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [newBookmarkCoords, setNewBookmarkCoords] = useState(null);
  const [newBookmarkName, setNewBookmarkName] = useState('');

  const [showStyleModal, setShowStyleModal] = useState(false);
  const [styleId, setStyleId] = useState('streets-v12');
  const [lightPreset, setLightPreset] = useState('day');

  const [routeGeoJSONs, setRouteGeoJSONs] = useState([]);
  const [routeMarkers, setRouteMarkers] = useState([]); 

  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [carMarker, setCarMarker] = useState(null);

  const [drivingSpeed, setDrivingSpeed] = useState(1);

  const drivingSpeedRef = useRef(drivingSpeed);
  useEffect(() => {
    drivingSpeedRef.current = drivingSpeed;
  }, [drivingSpeed]);

  const changeStyle = (id) => setStyleId(id);

  const changeLightPreset = (preset) => {
    setLightPreset(preset);
    if (styleId === 'standard' && mapRef.current) {
      mapRef.current.setConfigProperty('basemap', 'lightPreset', preset);
    }
  };

  const addingRef = useRef(adding);
  useEffect(() => {
    addingRef.current = adding;
  }, [adding]);

  const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
  mapboxgl.accessToken = accessToken;

  const toggleUI = () => setIsUIVisible(!isUIVisible);

  const getZoomLevel = (placeType) => {
    switch (placeType) {
      case 'country':
        return 4;
      case 'region':
      case 'state':
      case 'province':
        return 6;
      case 'district':
        return 8;
      case 'place':
      case 'city':
      case 'town':
        return 12;
      case 'locality':
      case 'neighborhood':
        return 14;
      case 'address':
      case 'poi':
        return 16;
      default:
        return 13;
    }
  };

  const handleSearch = async () => {
    try {
      setShowSuggestions(false);
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${accessToken}`
      );
      const data = await response.json();

      if (data.features?.length > 0) {
        const [longitude, latitude] = data.features[0].center;
        const placeType = data.features[0].place_type[0];
        const zoomLevel = getZoomLevel(placeType);

        if (markerRef.current) markerRef.current.remove();

        markerRef.current = new mapboxgl.Marker({ color: '#00bcd4' })
          .setLngLat([longitude, latitude])
          .setPopup(new mapboxgl.Popup().setHTML(`<h4>${data.features[0].place_name}</h4>`))
          .addTo(mapRef.current);

        mapRef.current.flyTo({
          center: [longitude, latitude],
          zoom: zoomLevel,
          speed: 1.2,
        });
      } else {
        alert('Place not found!');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed!');
    }
  };

  const handleAddBookmark = async () => {
    if (!bookmarkInput.trim()) return;

    try {
      const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(bookmarkInput)}.json?access_token=${accessToken}`);
      const data = await response.json();

      if (data.features?.length > 0) {
        const [longitude, latitude] = data.features[0].center;
        const placeType = data.features[0].place_type[0];
        const zoomLevel = getZoomLevel(placeType);

        const newMarker = new mapboxgl.Marker({ color: '#00bcd4' })
          .setLngLat([longitude, latitude])
          .setPopup(new mapboxgl.Popup().setHTML(`<h4>${data.features[0].place_name}</h4>`))
          .addTo(mapRef.current);

        markerRefs.current.push(newMarker); // Store marker reference
        setBookmarks(prev => [...prev, {
          id: Date.now(), // Add a unique ID for each bookmark
          name: data.features[0].place_name,
          coords: [longitude, latitude],
          zoom: zoomLevel
        }]);

        mapRef.current.flyTo({
          center: [longitude, latitude],
          zoom: zoomLevel,
          speed: 1.2
        });

        setBookmarkInput('');
      } else {
        alert('Place not found!');
      }
    } catch (error) {
      console.log('Error occurred:', error);
    }
  };

  const handleDeleteBookmark = (id) => {
    const bookmarkToDelete = bookmarks.find(bookmark => bookmark.id === id);
    if (bookmarkToDelete) {
      // Remove the marker from the map
      const indexToDelete = bookmarks.findIndex(bookmark => bookmark.id === id);
      if (indexToDelete > -1 && markerRefs.current[indexToDelete]) {
        markerRefs.current[indexToDelete].remove();
        // Remove the marker reference
        markerRefs.current.splice(indexToDelete, 1);
      }

      // Remove the bookmark from the state
      setBookmarks(prev => prev.filter(bookmark => bookmark.id !== id));

      // Optionally, fly back to a default view or the previous bookmark
      if (bookmarks.length > 1) {
        const previousBookmark = bookmarks[bookmarks.length - 2];
        mapRef.current.flyTo({
          center: previousBookmark.coords,
          zoom: previousBookmark.zoom,
          speed: 1.2
        });
      } else if (bookmarks.length === 1) {
        // If it was the last bookmark, maybe fly to an initial map view
        mapRef.current.flyTo({ center: [0, 0], zoom: 2 }); // Example: fly to a world view
      }
    }
  };

  const handleInputChange = async (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.length > 2) {
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json?access_token=${accessToken}&autocomplete=true&limit=5`
        );
        const data = await response.json();
        setSuggestions(data.features || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Suggestion error:', error);
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleOriginInputChange = async (e) => {
    const value = e.target.value;
    setOriginInput(value);

    if (value.length > 2) {
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json?access_token=${accessToken}&autocomplete=true&limit=5`
        );
        const data = await response.json();
        setOriginSuggestions(data.features || []);
        setShowOriginSuggestions(true);
      } catch (error) {
        setOriginSuggestions([]);
      }
    } else {
      setOriginSuggestions([]);
      setShowOriginSuggestions(false);
    }
  };

  const handleOriginKeyDown = (e) => {
    if (!showOriginSuggestions || !originSuggestions.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedOriginSuggestionIndex(prev => prev < originSuggestions.length - 1 ? prev + 1 : prev);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedOriginSuggestionIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedOriginSuggestionIndex >= 0) {
          const selected = originSuggestions[selectedOriginSuggestionIndex];
          setOriginInput(selected.place_name);
          setOriginSuggestions([]);
          setShowOriginSuggestions(false);
          setSelectedOriginSuggestionIndex(-1);
        }
        break;
      case 'Escape':
        setShowOriginSuggestions(false);
        setSelectedOriginSuggestionIndex(-1);
        break;
      default:
        break;
    }
  };

  const handleDestinationInputChange = async (e) => {
    const value = e.target.value;
    setDestinationInput(value);

    if (value.length > 2) {
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json?access_token=${accessToken}&autocomplete=true&limit=5`
        );
        const data = await response.json();
        setDestinationSuggestions(data.features || []);
        setShowDestinationSuggestions(true);
      } catch (error) {
        setDestinationSuggestions([]);
      }
    } else {
      setDestinationSuggestions([]);
      setShowDestinationSuggestions(false);
    }
  };

  const handleDestinationKeyDown = (e) => {
    if (!showDestinationSuggestions || !destinationSuggestions.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedDestinationSuggestionIndex(prev => prev < destinationSuggestions.length - 1 ? prev + 1 : prev);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedDestinationSuggestionIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedDestinationSuggestionIndex >= 0) {
          const selected = destinationSuggestions[selectedDestinationSuggestionIndex];
          setDestinationInput(selected.place_name);
          setDestinationSuggestions([]);
          setShowDestinationSuggestions(false);
          setSelectedDestinationSuggestionIndex(-1);
        }
        break;
      case 'Escape':
        setShowDestinationSuggestions(false);
        setSelectedDestinationSuggestionIndex(-1);
        break;
      default:
        break;
    }
  };

  const handleBookmarkInputChange = async (e) => {
    const value = e.target.value;
    setBookmarkInput(value);

    if (value.length > 2) {
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json?access_token=${accessToken}&autocomplete=true&limit=5`
        );
        const data = await response.json();
        setBookmarkSuggestions(data.features || []);
        setShowBookmarkSuggestions(true);
      } catch (error) {
        setBookmarkSuggestions([]);
      }
    } else {
      setBookmarkSuggestions([]);
      setShowBookmarkSuggestions(false);
    }
  };

  const handleBookmarkKeyDown = (e) => {
    if (!showBookmarkSuggestions || !bookmarkSuggestions.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedBookmarkSuggestionIndex(prev => prev < bookmarkSuggestions.length - 1 ? prev + 1 : prev);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedBookmarkSuggestionIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedBookmarkSuggestionIndex >= 0) {
          const selected = bookmarkSuggestions[selectedBookmarkSuggestionIndex];
          setBookmarkInput(selected.place_name);
          setBookmarkSuggestions([]);
          setShowBookmarkSuggestions(false);
          setSelectedBookmarkSuggestionIndex(-1);
        }
        break;
      case 'Escape':
        setShowBookmarkSuggestions(false);
        setSelectedBookmarkSuggestionIndex(-1);
        break;
      default:
        break;
    }
  };


  const handleKeyDown = (e) => {
    if (!showSuggestions || !suggestions.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prevIndex => 
          prevIndex < suggestions.length - 1 ? prevIndex + 1 : prevIndex
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prevIndex => 
          prevIndex > 0 ? prevIndex - 1 : 0
        );
        break;
      
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          const selected = suggestions[selectedSuggestionIndex];
          setSearchQuery(selected.place_name);
          setSuggestions([]);
          setShowSuggestions(false);
          setSelectedSuggestionIndex(-1);
          
          // Trigger search with selected location
          const [longitude, latitude] = selected.center;
          const zoomLevel = getZoomLevel(selected.place_type[0]);
          if (markerRef.current) markerRef.current.remove();
          
          markerRef.current = new mapboxgl.Marker({ color: '#00bcd4' })
            .setLngLat([longitude, latitude])
            .setPopup(new mapboxgl.Popup().setHTML(`<h4>${selected.place_name}</h4>`))
            .addTo(mapRef.current);
          
          mapRef.current.flyTo({
            center: [longitude, latitude],
            zoom: zoomLevel,
            speed: 1.2,
          });
        }
        break;
      
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  const handleFindRoute = async () => {
    try {
      const map = mapRef.current;

      // Clear all existing markups first
      // Remove event listeners and layers from all routes
      for (let i = 0; i < 10; i++) {
        if (map.getLayer(`route-${i}`)) {
          map.off('mouseenter', `route-${i}`);
          map.off('mousemove', `route-${i}`);
          map.off('mouseleave', `route-${i}`);
          map.removeLayer(`route-${i}`);
        }
        if (map.getSource(`route-${i}`)) {
          map.removeSource(`route-${i}`);
        }
      }

      // Remove all existing markers
      const markers = document.getElementsByClassName('mapboxgl-marker');
      while (markers[0]) {
        markers[0].remove();
      }

      // Remove all existing popups
      const popups = document.getElementsByClassName('mapboxgl-popup');
      while (popups[0]) {
        popups[0].remove();
      }

      // Clear search marker if exists
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }

      // Now proceed with route finding
      if (!originInput || !destinationInput) {
        throw new Error('Please enter both origin and destination');
      }

      const getCoords = async (place) => {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(place)}.json?access_token=${accessToken}`
        );
        const data = await res.json();
        if (!data.features?.length) throw new Error(`Could not find: ${place}`);
        return data.features[0].center;
      };
  
      const originCoords = await getCoords(originInput);
      const destCoords = await getCoords(destinationInput);
      const routeRes = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${originCoords[0]},${originCoords[1]};${destCoords[0]},${destCoords[1]}?geometries=geojson&overview=full&alternatives=true&steps=true&access_token=${accessToken}`
      );
      const routeData = await routeRes.json();
      const routes = routeData.routes;
  
      if (!routes?.length) throw new Error('No route found');
  
      // 🎨 Define route colors
      const colors = [
        '#3b9ddd',  // Blue for fastest route
        '#FF5722',  // Deep Orange for first alternative
        '#4CAF50'   // Green for second alternative
      ];
  
      // 🛣️ Add each route
      routes.forEach((route, i) => {
        map.addSource(`route-${i}`, {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: route.geometry
          }
        });
  
        map.addLayer({
          id: `route-${i}`,
          type: 'line',
          source: `route-${i}`,
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': colors[i] || '#999',
            'line-width': i === 0 ? 6 : 4,
            'line-opacity': i === 0 ? 1 : 0.6
          }
        });

        // Format time for better readability
        const hours = Math.floor(route.duration / 3600);
        const minutes = Math.floor((route.duration % 3600) / 60);
        const timeString = hours > 0 ? 
          `${hours} hr ${minutes} min` : 
          `${minutes} min`;

        // Create popup but don't add to map yet
        const popup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          className: 'route-popup'
        }).setHTML(`
          <div class="route-info-popup">
            <h4>Route ${i === 0 ? '(Fastest)' : i + 1}</h4>
            <div>🛣️ Distance: ${(route.distance / 1000).toFixed(1)} km</div>
            <div>⏱️ Duration: ${timeString}</div>
          </div>
        `);

        // Add hover events
        map.on('mouseenter', `route-${i}`, (e) => {
          map.getCanvas().style.cursor = 'pointer';
          popup.setLngLat(e.lngLat).addTo(map);
        });

        map.on('mousemove', `route-${i}`, (e) => {
          popup.setLngLat(e.lngLat);
        });

        map.on('mouseleave', `route-${i}`, () => {
          map.getCanvas().style.cursor = '';
          popup.remove();
        });

        setRouteCoordinates(route.geometry.coordinates);
      });
  
      // 🗺️ Fit map to bounds
      const bounds = new mapboxgl.LngLatBounds()
        .extend(originCoords)
        .extend(destCoords);
      map.fitBounds(bounds, { padding: 50, duration: 1000 });
  
      // 📍 Optional: Add start/end markers
      new mapboxgl.Marker({ color: 'green' }).setLngLat(originCoords).addTo(map);
      new mapboxgl.Marker({ color: 'red' }).setLngLat(destCoords).addTo(map);

      // After drawing all routes:
      setRouteGeoJSONs(
        routes.map((route, i) => ({
          geojson: route.geometry,
          color: colors[i] || '#999',
          popupInfo: {
            distance: route.distance,
            duration: route.duration,
            index: i,
            // ...any other info you want for popup
          }
        }))
      );
      // Optionally, save start/end marker coords:
      setRouteMarkers([
        { lngLat: originCoords, color: 'green' },
        { lngLat: destCoords, color: 'red' }
      ]);
  
      // 🧠 Get info of the fastest route
      const fastest = routes[0];
      const durationMins = (fastest.duration / 60).toFixed(1);
      const distanceKm = (fastest.distance / 1000).toFixed(1);
      const avgSpeed = 60; // km/h
      const estTime = ((distanceKm / avgSpeed) * 60).toFixed(1);

      // Create route info popup at the destination
      new mapboxgl.Popup({
        closeButton: true,
        closeOnClick: false,
        className: 'route-popup'
      })
        .setLngLat(destCoords)
        .setHTML(`
          <div class="route-info-popup">
            <h4>Route Information</h4>
            <div>🛣️ Distance: ${distanceKm} km</div>
            <div>⏱️ Duration: ${durationMins} mins</div>
            <div>🚗 Est. Drive Time: ${estTime} mins</div>
            <div>🔄 Alternative Routes: ${routes.length - 1}</div>
          </div>
        `)
        .addTo(map);

    } catch (error) {
      alert(error.message || 'Failed to find route!');
    }
  };

  const handleDriving = () => {
    if (!routeCoordinates.length) {
      alert('Please find a route first!');
      return;
    }
  
    if (isAnimating) {
      return;
    }
  
    setIsAnimating(true);
    
    if (carMarker) {
      carMarker.remove();
    }
  
    const map = mapRef.current;
    
    // Set appropriate zoom level before starting animation with smooth transition
    map.flyTo({
      center: routeCoordinates[0],
      zoom: 15,
      duration: 2000,
      essential: true
    });
    
    // Wait for the initial zoom to complete before starting the animation
    setTimeout(() => {
      // Create a div container for proper positioning
      const markerContainer = document.createElement('div');
      markerContainer.className = 'car-marker-container';
      markerContainer.style.position = 'relative';
      
      // Create the car image element
      const carEl = document.createElement('img');
      carEl.src = carSvg;
      carEl.style.width = '30px';
      carEl.style.height = '30px';
      carEl.style.transformOrigin = 'center';
      carEl.style.transform = 'rotate(90deg)'; // Initial rotation
  
      // Add the car image to the container
      markerContainer.appendChild(carEl);
  
      // Create the marker using the container
      const car = new mapboxgl.Marker({
        element: markerContainer,
        anchor: 'center',
        rotationAlignment: 'map',
        pitchAlignment: 'map'
      })
      .setLngLat(routeCoordinates[0])
      .addTo(map);
  
      setCarMarker(car);
  
      // Track the actual distance traveled so far
      let distanceTraveled = 0;
      let lastTimestamp = null;
      let targetPosition = [...routeCoordinates[0]];
      
      // Calculate total route distance for reference
      const totalDistance = routeCoordinates.reduce((acc, coord, i) => {
        if (i === 0) return 0;
        return acc + getDistance(routeCoordinates[i - 1], coord);
      }, 0);
  
      function animate(timestamp) {
        if (!lastTimestamp) {
          lastTimestamp = timestamp;
          requestAnimationFrame(animate);
          return;
        }
        
        // Calculate time elapsed since last frame
        const deltaTime = timestamp - lastTimestamp;
        lastTimestamp = timestamp;
        
        // Get current speed setting from ref (1x, 2x, etc.)
        const speedKmH = 100 * drivingSpeedRef.current;
        const speedMS = speedKmH * (1000 / 3600);
        
        // Calculate distance to move in this frame based on current speed
        const frameDistance = (deltaTime / 1000) * speedMS;
        
        // Add to total distance traveled
        distanceTraveled += frameDistance;
        
        if (distanceTraveled >= totalDistance) {
          setIsAnimating(false);
          return;
        }
  
        // Find position on route based on distance traveled
        let coveredDistance = 0;
        let targetIndex = 0;
  
        while (targetIndex < routeCoordinates.length - 1) {
          const segmentDistance = getDistance(
            routeCoordinates[targetIndex],
            routeCoordinates[targetIndex + 1]
          );
          if (coveredDistance + segmentDistance > distanceTraveled) {
            break;
          }
          coveredDistance += segmentDistance;
          targetIndex++;
        }
  
        if (targetIndex < routeCoordinates.length - 1) {
          const coord1 = routeCoordinates[targetIndex];
          const coord2 = routeCoordinates[targetIndex + 1];
          const segmentDistance = getDistance(coord1, coord2);
          const segmentProgress = (distanceTraveled - coveredDistance) / segmentDistance;
  
          const currentPosition = [
            coord1[0] + (coord2[0] - coord1[0]) * segmentProgress,
            coord1[1] + (coord2[1] - coord1[1]) * segmentProgress
          ];
  
          const bearing = getBearing(coord1, coord2);
          
          // Update the car position on the map
          car.setLngLat(currentPosition);
          
          // Apply the bearing rotation plus the 90-degree correction
          carEl.style.transform = `rotate(${bearing + 270}deg)`;
          
          // Look ahead on the path to create a smoother camera follow
          let lookAheadPosition;
          
          // If we're near the end of the route, just use the destination
          if (targetIndex >= routeCoordinates.length - 3) {
            lookAheadPosition = routeCoordinates[routeCoordinates.length - 1];
          } else {
            // Look 2-3 points ahead if possible
            const lookAheadIndex = Math.min(targetIndex + 2, routeCoordinates.length - 1);
            lookAheadPosition = routeCoordinates[lookAheadIndex];
          }
          
          // Smoothly interpolate the camera target position
          targetPosition[0] += (lookAheadPosition[0] - targetPosition[0]) * 0.05;
          targetPosition[1] += (lookAheadPosition[1] - targetPosition[1]) * 0.05;
          
          // Smooth camera follow with easing
          map.easeTo({
            center: targetPosition,
            duration: 300,
            easing: (t) => t * (2 - t), // Ease out quad for smooth motion
            essential: true
          });
          
          requestAnimationFrame(animate);
        }
      }
      
      // Begin animation
      requestAnimationFrame(animate);
    }, 2000); // Give the initial flyTo time to complete
  };
  
  // Helper functions for calculations
  const getDistance = (coord1, coord2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = coord1[1] * Math.PI / 180;
    const φ2 = coord2[1] * Math.PI / 180;
    const Δφ = (coord2[1] - coord1[1]) * Math.PI / 180;
    const Δλ = (coord2[0] - coord1[0]) * Math.PI / 180;
  
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
    return R * c; // Distance in meters
  };
  
  const getBearing = (coord1, coord2) => {
    const λ1 = coord1[0] * Math.PI / 180;
    const λ2 = coord2[0] * Math.PI / 180;
    const φ1 = coord1[1] * Math.PI / 180;
    const φ2 = coord2[1] * Math.PI / 180;
  
    const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) -
            Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
    const θ = Math.atan2(y, x);
    
    return (θ * 180 / Math.PI + 360) % 360;
  };

  const toggleTraffic = () => {
    if (!showTraffic) {
      mapRef.current.addLayer({
        id: 'traffic',
        type: 'line',
        source: {
          type: 'vector',
          url: 'mapbox://mapbox.mapbox-traffic-v1'
        },
        'source-layer': 'traffic',
        paint: {
          'line-color': [
            'match',
            ['get', 'congestion'],
            'low', '#4CAF50',
            'moderate', '#FFD700',
            'heavy', '#FF0000',
            'severe', '#800000',
            '#000000'
          ],
          'line-width': 2
        }
      });
    } else {
      mapRef.current.removeLayer('traffic');
    }
    setShowTraffic(!showTraffic);
  };

  const handleClearMap = () => {
    try {
      const map = mapRef.current;

      // Remove event listeners from all routes
      for (let i = 0; i < 10; i++) {
        if (map.getLayer(`route-${i}`)) {
          map.off('mouseenter', `route-${i}`);
          map.off('mousemove', `route-${i}`);
          map.off('mouseleave', `route-${i}`);
          map.removeLayer(`route-${i}`);
        }
        if (map.getSource(`route-${i}`)) {
          map.removeSource(`route-${i}`);
        }
      }

      // Remove traffic layer if active
      if (showTraffic) {
        if (map.getLayer('traffic')) {
          map.removeLayer('traffic');
        }
        if (map.getSource('traffic')) {
          map.removeSource('traffic');
        }
        setShowTraffic(false);
      }

      // Remove current search marker
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }

      // Remove all markers
      const markers = document.getElementsByClassName('mapboxgl-marker');
      while (markers[0]) {
        markers[0].remove();
      }

      // Remove all popups
      const popups = document.getElementsByClassName('mapboxgl-popup');
      while (popups[0]) {
        popups[0].remove();
      }

      // Reset all inputs and states
      setSearchQuery('');
      setOriginInput('');
      setDestinationInput('');
      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);

      // Reset map view to default India view with animation
      map.flyTo({
        center: [78.9629, 20.5937],
        zoom: 4,
        duration: 1500,
        essential: true
      });

    } catch (error) {
      console.error('Error clearing map:', error);
      alert('Error clearing map');
    }
  };

  const handleBookmarkNameChange = (e) => setNewBookmarkName(e.target.value);

  const saveBookmark = () => {
    if (!newBookmarkCoords || !newBookmarkName.trim() || !mapRef.current) {
      closeModal();
      return;
    }

    // Add marker to map
    const marker = new mapboxgl.Marker({ color: "gold", draggable: true })
      .setLngLat(newBookmarkCoords)
      .setPopup(new mapboxgl.Popup().setText(newBookmarkName))
      .addTo(mapRef.current);

    markerRefs.current.push(marker);
    setBookmarks(prev => [
      ...prev,
      {
        id: Date.now(),
        name: newBookmarkName,
        coords: newBookmarkCoords,
        zoom: 16
      }
    ]);
    closeModal();
  };

  const closeModal = () => {
    setModalOpen(false);
    setNewBookmarkCoords(null);
    setNewBookmarkName('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') saveBookmark();
  };

  const startAdding = () => {
    if (!mapRef.current) return;
    setAdding(true);
    mapRef.current.getCanvas().style.cursor = "crosshair";
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: styleId === 'standard'
        ? 'mapbox://styles/mapbox/standard'
        : `mapbox://styles/mapbox/${styleId}`,
      center: [78.9629, 20.5937],
      zoom: 4
    });
  
    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
  
    map.on('style.load', () => {
      if (styleId === 'standard') {
        map.setConfigProperty('basemap', 'lightPreset', lightPreset);
      }
    });
  
    map.on('mousemove', (e) => {
      setCursorCoords({
        lng: e.lngLat.lng.toFixed(4),
        lat: e.lngLat.lat.toFixed(4),
      });
      setCursorPos({
        x: e.originalEvent.clientX,
        y: e.originalEvent.clientY,
      });
    });
  
    return () => map.remove();
  }, [styleId, lightPreset]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.search-input-container')) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedSuggestionIndex]);

  useEffect(() => {
    if (!mapRef.current) return;

    const onMapClick = (e) => {
      if (!addingRef.current) return;
      setNewBookmarkCoords([e.lngLat.lng, e.lngLat.lat]);
      setModalOpen(true);
      mapRef.current.getCanvas().style.cursor = "";
      setAdding(false);
    };

    mapRef.current.on("click", onMapClick);
    return () => {
      mapRef.current.off("click", onMapClick);
    };
  }, []); // Attach only once!

  return (
    <>
      <button className="toggle-btn" onClick={toggleUI}>
        {isUIVisible ? <IoCloseOutline size={20} /> : <IoMenuOutline size={20} />}
      </button>

      <div className={`map-ui ${isUIVisible ? 'active' : ''}`}>
        <div className="search-container">
          <div className="search-input-container">
            <input type="text" placeholder="Search Location" value={searchQuery} onChange={handleInputChange} onKeyDown={handleKeyDown} onFocus={() => setShowSuggestions(true)} className="search-input"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="suggestions-container">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={suggestion.id}
                    ref={index === selectedSuggestionIndex ? selectedItemRef : null}
                    className={`suggestion-item ${index === selectedSuggestionIndex ? 'selected' : ''}`}
                    onClick={() => {
                      setSearchQuery(suggestion.place_name);
                      setSuggestions([]);
                      setShowSuggestions(false);
                      setSelectedSuggestionIndex(-1);
                      // Trigger search with selected location
                      const [longitude, latitude] = suggestion.center;
                      mapRef.current.flyTo({
                        center: [longitude, latitude],
                        zoom: getZoomLevel(suggestion.place_type[0]),
                        speed: 1.2,
                      });
                      if (markerRef.current) markerRef.current.remove();
                      markerRef.current = new mapboxgl.Marker({ color: '#00bcd4' })
                        .setLngLat([longitude, latitude])
                        .setPopup(new mapboxgl.Popup().setHTML(`<h4>${suggestion.place_name}</h4>`))
                        .addTo(mapRef.current);
                    }}
                  >
                   {suggestion.place_name}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button 
            onClick={() => {
              handleSearch();
              setShowSuggestions(false);
            }} 
            className="search-button"
          >
            🔍
          </button>
        </div>

        <div className="route-container">
          <div className="search-input-container">
            <input type="text" placeholder="Origin" value={originInput} onChange={handleOriginInputChange} onKeyDown={handleOriginKeyDown} onFocus={() => setShowOriginSuggestions(true)} className="route-input"/>
            {showOriginSuggestions && originSuggestions.length > 0 && (
              <div className="suggestions-container">
                {originSuggestions.map((suggestion, index) => (
                  <div
                    key={suggestion.id}
                    className={`suggestion-item ${index === selectedOriginSuggestionIndex ? 'selected' : ''}`}
                    onClick={() => {
                      setOriginInput(suggestion.place_name);
                      setOriginSuggestions([]);
                      setShowOriginSuggestions(false);
                      setSelectedOriginSuggestionIndex(-1);
                    }}
                  >
                    {suggestion.place_name}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Destination input with suggestions */}
          <div className="search-input-container">
            <input type="text" placeholder="Destination" value={destinationInput} onChange={handleDestinationInputChange} onKeyDown={handleDestinationKeyDown} onFocus={() => setShowDestinationSuggestions(true)} className="route-input"/>
            {showDestinationSuggestions && destinationSuggestions.length > 0 && (
              <div className="suggestions-container">
                {destinationSuggestions.map((suggestion, index) => (
                  <div
                    key={suggestion.id}
                    className={`suggestion-item ${index === selectedDestinationSuggestionIndex ? 'selected' : ''}`}
                    onClick={() => {
                      setDestinationInput(suggestion.place_name);
                      setDestinationSuggestions([]);
                      setShowDestinationSuggestions(false);
                      setSelectedDestinationSuggestionIndex(-1);
                    }}
                  >
                    {suggestion.place_name}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={handleFindRoute} className="route-button">🧭 Find Route</button>
          <button onClick={handleDriving} className="start-driving">🚗 Start Driving</button>
          <div className="driving-controls">
            <button
              className="speed-toggle-btn"
              onClick={() => setDrivingSpeed(prev => prev === 1 ? 10 : 1)}
            >
              {drivingSpeed === 1 ? '⏩ 10x' : '▶️ 1x'}
            </button>

            {/* Not working */}
            {/* <button 
              className="pause-resume-btn"
              onClick={() => {
                if (animationFrameIdRef.current) {
                  cancelAnimationFrame(animationFrameIdRef.current);
                }
                setIsAnimating(false);
                setDrivingSpeed(1); // Reset speed to default when stopping
              }}
            >
              ⏹️ Stop
            </button> */}
          </div>
        </div>

        <div className="controls-container">
          <button onClick={handleClearMap} className="clear-button">🗑️ Clear Map</button>
          <button onClick={toggleTraffic} className="traffic-button">
            {showTraffic ? '🚦 Hide Traffic' : '🚦 Show Traffic'}
          </button>
        </div>

        <div className="bookmark-container">
          <div className="bookmark-row">
            <input type="text" className="bookmark-input" value={bookmarkInput} onChange={handleBookmarkInputChange} onKeyDown={handleBookmarkKeyDown} onFocus={() => setShowBookmarkSuggestions(true)} placeholder="Bookmark place" />
            <button
              type="button"
              className="location-btn"
              onClick={startAdding}
              title="Drop a pin on the map"
            >
              <img src={locationIcon} alt="location" />
            </button>
            <button onClick={handleAddBookmark} className="bookmark-button">Add</button>
          </div>
          {showBookmarkSuggestions && bookmarkSuggestions.length > 0 && (
            <div className="suggestions-container">
              {bookmarkSuggestions.map((suggestion, index) => (
                <div
                  key={suggestion.id}
                  className={`suggestion-item ${index === selectedBookmarkSuggestionIndex ? 'selected' : ''}`}
                  onClick={() => {
                    setBookmarkInput(suggestion.place_name);
                    setBookmarkSuggestions([]);
                    setShowBookmarkSuggestions(false);
                    setSelectedBookmarkSuggestionIndex(-1);
                  }}
                >
                  {suggestion.place_name}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bookmarks-list">
          {bookmarks.length > 0 ? (
            <ul>
              {bookmarks.map((bookmark) => (
                <li key={bookmark.id} className="bookmark-item">
                  <span>{bookmark.name}</span>
                  <button onClick={() => handleDeleteBookmark(bookmark.id)} className="delete-button">
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No bookmarks added yet.</p>
          )}
        </div>
      </div>
      <div
        className="coords-follow"
        style={{
          left: `${cursorPos.x}px`,
          top: `${cursorPos.y}px`,
        }}
        >{cursorCoords.lng}, {cursorCoords.lat}
      </div>

      {modalOpen && (
        <div className="modal-background" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Name your bookmark</h3>
            <input type="text"  value={newBookmarkName} onChange={handleBookmarkNameChange} onKeyPress={handleKeyPress} autoFocus placeholder="Enter location name"/>
            <div className="modal-buttons">
              <button onClick={closeModal} className="cancel-btn">Cancel</button>
              <button onClick={saveBookmark} className="save-btn">Save</button>
            </div>
          </div>
        </div>
      )}

      <div className="map-style-bar">
        <button
          className={`style-btn${styleId === 'streets-v12' ? ' active' : ''}`}
          onClick={() => changeStyle('streets-v12')}
          title="Streets"
        >
          <img src={earthIcon} alt="Streets" />
        </button>
        <button
          className={`style-btn${styleId === 'satellite-streets-v12' ? ' active' : ''}`}
          onClick={() => changeStyle('satellite-streets-v12')}
          title="Satellite"
        >
          <img src={satelliteIcon} alt="Satellite" />
        </button>
        <button
          className={`style-btn${styleId === 'light-v11' ? ' active' : ''}`}
          onClick={() => changeStyle('light-v11')}
          title="Light"
        >
          <img src={lightIcon} alt="Light" />
        </button>
        <button
          className={`style-btn${styleId === 'dark-v11' ? ' active' : ''}`}
          onClick={() => changeStyle('dark-v11')}
          title="Dark"
        >
          <img src={darkIcon} alt="Dark" />
        </button>
      </div>

      <div ref={mapContainerRef} className={`custom-cursor-map map-container${adding ? " adding" : ""}`} />
    </>
  );
};

export default Mapbox;