// Tracking Map Component Template
// Copy to: mobile-apps/customer-app/components/TrackingMap.tsx

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

interface Location {
  latitude: number;
  longitude: number;
}

interface TrackingMapProps {
  restaurant: Location;
  deliveryAddress: Location;
  driverLocation?: Location;
  route?: Location[];
}

export function TrackingMap({
  restaurant,
  deliveryAddress,
  driverLocation,
  route,
}: TrackingMapProps) {
  const mapRef = useRef<MapView>(null);

  // Fit map to show all markers
  useEffect(() => {
    if (mapRef.current) {
      const coordinates = [restaurant, deliveryAddress];
      if (driverLocation) {
        coordinates.push(driverLocation);
      }

      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }, [restaurant, deliveryAddress, driverLocation]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: restaurant.latitude,
          longitude: restaurant.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
        showsMyLocationButton
        showsCompass
        showsTraffic={false}
      >
        {/* Restaurant Marker */}
        <Marker
          coordinate={restaurant}
          title="Restaurant"
          description="Pickup location"
          pinColor="#F59E0B"
        >
          <View style={styles.markerContainer}>
            <View style={[styles.marker, { backgroundColor: '#F59E0B' }]}>
              <Text style={styles.markerText}>🍽️</Text>
            </View>
          </View>
        </Marker>

        {/* Delivery Address Marker */}
        <Marker
          coordinate={deliveryAddress}
          title="Delivery Address"
          description="Your location"
          pinColor="#10B981"
        >
          <View style={styles.markerContainer}>
            <View style={[styles.marker, { backgroundColor: '#10B981' }]}>
              <Text style={styles.markerText}>🏠</Text>
            </View>
          </View>
        </Marker>

        {/* Driver Marker */}
        {driverLocation && (
          <Marker
            coordinate={driverLocation}
            title="Driver"
            description="Current location"
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.driverMarkerContainer}>
              <Image
                source={require('../assets/driver-marker.png')}
                style={styles.driverMarker}
                resizeMode="contain"
              />
            </View>
          </Marker>
        )}

        {/* Route Polyline */}
        {route && route.length > 0 && (
          <Polyline
            coordinates={route}
            strokeColor="#4F46E5"
            strokeWidth={4}
            lineDashPattern={[1]}
          />
        )}

        {/* Simple polyline if no route */}
        {!route && driverLocation && (
          <Polyline
            coordinates={[restaurant, driverLocation, deliveryAddress]}
            strokeColor="#4F46E5"
            strokeWidth={3}
            strokeColors={['#4F46E5', '#10B981']}
          />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerText: {
    fontSize: 20,
  },
  driverMarkerContainer: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverMarker: {
    width: 50,
    height: 50,
  },
});

// Driver Navigation Map (For Driver App)
export function DriverNavigationMap({
  currentLocation,
  destination,
  route,
}: {
  currentLocation: Location;
  destination: Location;
  route?: Location[];
}) {
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (mapRef.current && currentLocation) {
      // Center on driver location
      mapRef.current.animateCamera({
        center: currentLocation,
        zoom: 16,
        heading: 0,
        pitch: 60, // Tilt for navigation view
      });
    }
  }, [currentLocation]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation
        showsMyLocationButton
        showsCompass
        showsTraffic
        followsUserLocation
        mapType="standard"
      >
        {/* Destination Marker */}
        <Marker
          coordinate={destination}
          title="Delivery Address"
          pinColor="#10B981"
        />

        {/* Route */}
        {route && route.length > 0 && (
          <Polyline
            coordinates={route}
            strokeColor="#4F46E5"
            strokeWidth={5}
          />
        )}
      </MapView>
    </View>
  );
}
