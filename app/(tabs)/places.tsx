import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useTheme } from "@/contexts/theme-context";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";

import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    Keyboard,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import MapView, { Callout, Marker, PROVIDER_GOOGLE } from "react-native-maps";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.7;

interface Place {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  tags: string[];
  image_urls?: string[];
  added_by: string;
  created_at: string;
  latitude?: number;
  longitude?: number;
  distance_km?: number;
  road_distance_km?: number;
  profiles: {
    full_name: string;
  } | null;
}

const POPULAR_TAGS = [
  "food",
  "cafe",
  "study",
  "sports",
  "shopping",
  "cheap",
  "hangout",
  "library",
  "gym",
  "vegetarian",
  "non-veg",
  "fast-food",
  "restaurant",
  "park",
];

const haversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

interface CombinedSuggestion {
  type: "db" | "osm";
  id: string;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  distance_km?: number;
  dbPlace?: Place;
}

export default function PlacesScreen() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<CombinedSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedOsmMarker, setSelectedOsmMarker] = useState<{
    latitude: number;
    longitude: number;
    name: string;
  } | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const osmSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [currentLocation, setCurrentLocation] =
    useState<Location.LocationObject | null>(null);
  const mapRef = useRef<MapView>(null);
  const router = useRouter();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme ?? "light"];

  const fetchPlaces = React.useCallback(async () => {
    if (!currentLocation) return;

    try {
      const { data, error } = await supabase.rpc("get_nearby_places", {
        user_lat: currentLocation.coords.latitude,
        user_lng: currentLocation.coords.longitude,
        radius_km: 100,
      });

      if (error) throw error;

      // Transform the data to match our interface
      const transformedData =
        data?.map((item: any) => ({
          ...item,
          profiles: item.profiles
            ? { full_name: item.profiles.full_name }
            : null,
        })) || [];

      setPlaces(transformedData);
      setFilteredPlaces(transformedData);
    } catch (error: any) {
      console.error("Error fetching nearby places:", error.message);
    } finally {
      setLoading(false);
    }
  }, [currentLocation]);

  const fetchSearchSuggestions = React.useCallback(
    async (query: string) => {
      if (!query.trim() || !currentLocation) {
        setSearchSuggestions([]);
        setShowSuggestions(false);
        setSearchLoading(false);
        return;
      }

      const userLat = currentLocation.coords.latitude;
      const userLon = currentLocation.coords.longitude;

      setSearchLoading(true);
      try {
        // 1. DB places — prioritised, top 5
        const { data: dbData, error: dbError } = await supabase.rpc(
          "get_nearby_places",
          { user_lat: userLat, user_lng: userLon, radius_km: 50 },
        );

        const dbSuggestions: CombinedSuggestion[] = dbError
          ? []
          : (dbData || [])
              .filter(
                (place: any) =>
                  place.name.toLowerCase().includes(query.toLowerCase()) ||
                  place.description
                    ?.toLowerCase()
                    .includes(query.toLowerCase()) ||
                  place.address?.toLowerCase().includes(query.toLowerCase()),
              )
              .slice(0, 5)
              .map((place: any) => ({
                type: "db" as const,
                id: place.id,
                name: place.name,
                address: place.address,
                latitude: place.latitude,
                longitude: place.longitude,
                distance_km: place.distance_km,
                dbPlace: place,
              }));

        // 2. OSM (Nominatim) places nearby up to 50 km
        // viewbox = left,top,right,bottom (±0.5° ≈ 55 km bounding box)
        let osmSuggestions: CombinedSuggestion[] = [];
        try {
          const delta = 0.5;
          const viewbox = `${userLon - delta},${userLat + delta},${userLon + delta},${userLat - delta}`;
          const osmUrl =
            `https://nominatim.openstreetmap.org/search` +
            `?q=${encodeURIComponent(query)}` +
            `&format=json&limit=20&addressdetails=1` +
            `&viewbox=${viewbox}&bounded=0`;
          const response = await fetch(osmUrl, {
            headers: {
              "Accept-Language": "en",
              "User-Agent": "CampusTrails/1.0",
            },
          });
          if (response.ok) {
            const osmData = await response.json();
            osmSuggestions = osmData
              .map((item: any) => {
                const lat = parseFloat(item.lat);
                const lon = parseFloat(item.lon);
                const dist = haversineDistance(userLat, userLon, lat, lon);
                const rawName =
                  item.name && item.name.trim()
                    ? item.name
                    : item.display_name.split(",")[0].trim();
                return {
                  type: "osm" as const,
                  id: `osm_${item.osm_id}`,
                  name: rawName,
                  address: item.display_name,
                  latitude: lat,
                  longitude: lon,
                  distance_km: dist,
                };
              })
              .filter(
                (s: CombinedSuggestion) => (s.distance_km ?? Infinity) <= 50,
              )
              .slice(0, 5);
          }
        } catch (e) {
          console.warn("OSM search failed:", e);
        }

        const combined = [...dbSuggestions, ...osmSuggestions];
        setSearchSuggestions(combined);
        setShowSuggestions(combined.length > 0);
      } catch (error: any) {
        console.error("Error fetching search suggestions:", error.message);
        setSearchSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setSearchLoading(false);
      }
    },
    [currentLocation],
  );

  const handlePlaceSelect = async (suggestion: CombinedSuggestion) => {
    Keyboard.dismiss();
    setShowSuggestions(false);
    setSearchQuery(suggestion.name);

    // DB place → navigate directly to its detail page
    if (suggestion.type === "db" && suggestion.dbPlace) {
      router.push(`/place/${suggestion.dbPlace.id}`);
      return;
    }

    // OSM (external) place → mark on map and show nearby DB places
    const { latitude, longitude } = suggestion;
    setSelectedOsmMarker({ latitude, longitude, name: suggestion.name });

    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude,
        longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_nearby_places", {
        user_lat: latitude,
        user_lng: longitude,
        radius_km: 5,
      });

      if (error) throw error;

      const transformedData =
        data?.map((item: any) => ({
          ...item,
          profiles: item.profiles
            ? { full_name: item.profiles.full_name }
            : null,
        })) || [];

      setFilteredPlaces(transformedData);
    } catch (error: any) {
      console.error("Error fetching nearby DB places:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission denied",
          "Location permission is required to show your current position.",
        );
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location);
    } catch (error) {
      console.error("Error getting location:", error);
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (currentLocation) {
      fetchPlaces();
    }
  }, [currentLocation, fetchPlaces]);

  const filterPlaces = React.useCallback(() => {
    let filtered = places;

    // Only filter by tags (search is now handled by suggestions)
    if (selectedTags.length > 0) {
      filtered = filtered.filter((place) =>
        selectedTags.some((tag) => place.tags.includes(tag)),
      );
    }

    setFilteredPlaces(filtered);
  }, [selectedTags, places]);

  useEffect(() => {
    filterPlaces();
  }, [filterPlaces]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const centerOnCurrentLocation = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  const navigateToPlace = async (place: Place) => {
    if (!place.latitude || !place.longitude) {
      Alert.alert("Error", "Location coordinates not available");
      return;
    }

    try {
      // Try Google Maps first (most common on Android)
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}&destination_place_id=${encodeURIComponent(place.name)}`;

      const canOpenGoogleMaps = await Linking.canOpenURL(googleMapsUrl);
      if (canOpenGoogleMaps) {
        await Linking.openURL(googleMapsUrl);
        return;
      }

      // Fallback to Apple Maps (iOS) or general maps URL
      const appleMapsUrl = `http://maps.apple.com/?daddr=${place.latitude},${place.longitude}&dirflg=d`;
      const canOpenAppleMaps = await Linking.canOpenURL(appleMapsUrl);
      if (canOpenAppleMaps) {
        await Linking.openURL(appleMapsUrl);
        return;
      }

      // Last resort - open in browser
      const webUrl = `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`;
      await Linking.openURL(webUrl);
    } catch (error) {
      Alert.alert("Error", "Unable to open maps application");
      console.error("Error opening maps:", error);
    }
  };

  const renderPlaceCard = ({ item }: { item: Place }) => (
    <TouchableOpacity
      style={[
        styles.placeCard,
        { backgroundColor: colors.card, borderColor: colors.cardBorder },
      ]}
      onPress={() => {
        // Navigate to place details and center map
        if (mapRef.current && item.latitude && item.longitude) {
          mapRef.current.animateToRegion({
            latitude: item.latitude,
            longitude: item.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
        router.push(`/place/${item.id}`);
      }}
    >
      <View style={styles.placeCardImageContainer}>
        {item.image_urls && item.image_urls.length > 0 ? (
          <Image
            source={{ uri: item.image_urls[0] }}
            style={styles.placeCardImage}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.placeCardImagePlaceholder,
              { backgroundColor: colors.card },
            ]}
          >
            <Ionicons name="image-outline" size={48} color={colors.primary} />
          </View>
        )}
        <View style={styles.placeCardOverlay}>
          <TouchableOpacity
            style={[
              styles.navigateButton,
              { backgroundColor: "rgba(255, 255, 255, 0.9)" },
            ]}
            onPress={() => navigateToPlace(item)}
          >
            <Ionicons name="navigate" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.placeCardContent}>
        <View style={styles.placeCardHeader}>
          <Text
            style={[styles.placeCardName, { color: colors.text }]}
            numberOfLines={2}
          >
            {item.name}
          </Text>
          {item.distance_km && (
            <View style={styles.placeCardDistance}>
              <Ionicons name="location" size={12} color={colors.primary} />
              <Text
                style={[
                  styles.placeCardDistanceText,
                  { color: colors.primary },
                ]}
              >
                {item.distance_km.toFixed(1)} km
              </Text>
            </View>
          )}
        </View>

        {item.address && (
          <Text
            style={[styles.placeCardAddress, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {item.address}
          </Text>
        )}

        {item.tags && item.tags.length > 0 && (
          <View style={styles.placeCardTags}>
            {item.tags.slice(0, 2).map((tag) => (
              <View
                key={tag}
                style={[styles.miniTag, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.miniTagText}>#{tag}</Text>
              </View>
            ))}
            {item.tags.length > 2 && (
              <Text
                style={[styles.moreTagsText, { color: colors.textSecondary }]}
              >
                +{item.tags.length - 2} more
              </Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: currentLocation?.coords.latitude || 16.5062,
          longitude: currentLocation?.coords.longitude || 80.648,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {filteredPlaces
          .filter((place) => place.latitude && place.longitude)
          .map((place) => (
            <Marker
              key={place.id}
              coordinate={{
                latitude: place.latitude!,
                longitude: place.longitude!,
              }}
              title={place.name}
              description={`${place.description || ""}${place.distance_km ? `\n${place.distance_km.toFixed(1)} km away` : ""}`}
            >
              <Callout onPress={() => router.push(`/place/${place.id}`)}>
                <View
                  style={[
                    styles.calloutContainer,
                    { backgroundColor: colors.card },
                  ]}
                >
                  <Text style={[styles.calloutTitle, { color: colors.text }]}>
                    {place.name}
                  </Text>
                  {place.description && (
                    <Text
                      style={[
                        styles.calloutDescription,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {place.description}
                    </Text>
                  )}
                  {place.distance_km && (
                    <Text
                      style={[
                        styles.calloutDistance,
                        { color: colors.primary },
                      ]}
                    >
                      {place.distance_km.toFixed(1)} km away
                    </Text>
                  )}
                  <View style={styles.calloutButtons}>
                    <TouchableOpacity
                      style={[
                        styles.calloutButton,
                        { backgroundColor: colors.primary },
                      ]}
                      onPress={() => router.push(`/place/${place.id}`)}
                    >
                      <Ionicons
                        name="information-circle"
                        size={16}
                        color="#fff"
                      />
                      <Text style={styles.calloutButtonText}>Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.calloutButton,
                        { backgroundColor: colors.primary },
                      ]}
                      onPress={() => navigateToPlace(place)}
                    >
                      <Ionicons name="navigate" size={16} color="#fff" />
                      <Text style={styles.calloutButtonText}>Navigate</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Callout>
            </Marker>
          ))}
        {selectedOsmMarker && (
          <Marker
            coordinate={{
              latitude: selectedOsmMarker.latitude,
              longitude: selectedOsmMarker.longitude,
            }}
            title={selectedOsmMarker.name}
            pinColor="#f97316"
          >
            <Callout>
              <View
                style={[
                  styles.calloutContainer,
                  { backgroundColor: colors.card },
                ]}
              >
                <Text style={[styles.calloutTitle, { color: colors.text }]}>
                  {selectedOsmMarker.name}
                </Text>
                <Text
                  style={[
                    styles.calloutDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  External location
                </Text>
              </View>
            </Callout>
          </Marker>
        )}
      </MapView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <View
            style={[styles.loadingContainer, { backgroundColor: colors.card }]}
          >
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Finding nearby places...
            </Text>
          </View>
        </View>
      )}

      <View style={styles.overlay}>
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <IconSymbol
              name="magnifyingglass"
              size={20}
              color={colors.textTertiary}
              style={styles.searchIcon}
            />
            <TextInput
              style={[
                styles.searchInput,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                  color: colors.text,
                },
              ]}
              placeholder="Search places..."
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                if (osmSearchTimeoutRef.current)
                  clearTimeout(osmSearchTimeoutRef.current);
                osmSearchTimeoutRef.current = setTimeout(
                  () => fetchSearchSuggestions(text),
                  400,
                );
              }}
              onFocus={() => {
                if (searchQuery.trim()) {
                  fetchSearchSuggestions(searchQuery);
                }
              }}
              onBlur={() => {
                setTimeout(() => setShowSuggestions(false), 250);
              }}
              placeholderTextColor={colors.placeholder}
            />
            <TouchableOpacity
              style={styles.locationIcon}
              onPress={() => {
                Keyboard.dismiss();
                centerOnCurrentLocation();
              }}
              disabled={searchLoading}
            >
              {searchLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="locate" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.addPlaceButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/add-place")}
          >
            <Ionicons name="add" size={26} color="#fff" />
          </TouchableOpacity>
        </View>

        {showSuggestions && searchSuggestions.length > 0 && (
          <View
            style={[
              styles.suggestionsContainer,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <ScrollView
              style={styles.suggestionsScrollView}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              {searchSuggestions.map((suggestion) => (
                <TouchableOpacity
                  key={suggestion.id}
                  style={styles.suggestionItem}
                  onPress={() => handlePlaceSelect(suggestion)}
                >
                  <View style={styles.suggestionContent}>
                    <View style={styles.suggestionHeader}>
                      <Ionicons
                        name={
                          suggestion.type === "db"
                            ? "location"
                            : "globe-outline"
                        }
                        size={14}
                        color={
                          suggestion.type === "db"
                            ? colors.primary
                            : colors.textSecondary
                        }
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        style={[styles.suggestionName, { color: colors.text }]}
                      >
                        {suggestion.name}
                      </Text>
                    </View>
                    {suggestion.address && (
                      <Text
                        style={[
                          styles.suggestionAddress,
                          { color: colors.textSecondary },
                        ]}
                        numberOfLines={1}
                      >
                        {suggestion.address}
                      </Text>
                    )}
                    {suggestion.distance_km != null && (
                      <Text
                        style={[
                          styles.suggestionDistance,
                          { color: colors.primary },
                        ]}
                      >
                        {suggestion.distance_km.toFixed(1)} km away
                      </Text>
                    )}
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.textTertiary}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.tagsSection}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={POPULAR_TAGS}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterTag,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                  },
                  selectedTags.includes(item) && {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                ]}
                onPress={() => toggleTag(item)}
              >
                <Text
                  style={[
                    styles.filterTagText,
                    { color: colors.textSecondary },
                    selectedTags.includes(item) && styles.filterTagTextSelected,
                  ]}
                >
                  #{item}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.tagsScrollContent}
          />
        </View>
      </View>

      {filteredPlaces.length > 0 && (
        <View style={styles.placesCardsContainer}>
          <FlatList
            horizontal
            data={filteredPlaces}
            renderItem={renderPlaceCard}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.placesCardsContent}
            snapToInterval={CARD_WIDTH + 12}
            decelerationRate="fast"
          />
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  overlay: {
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  addPlaceButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  searchIcon: {
    position: "absolute",
    left: 12,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    borderRadius: 12,
    paddingLeft: 40,
    paddingRight: 40,
    paddingVertical: 14,
    fontSize: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
  },
  locationIcon: {
    position: "absolute",
    right: 12,
    zIndex: 1,
    padding: 4,
  },
  suggestionsContainer: {
    position: "absolute",
    top: 68,
    left: 0,
    right: 0,
    maxHeight: 250,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  suggestionsScrollView: {
    maxHeight: 250,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  suggestionAddress: {
    fontSize: 14,
    marginBottom: 2,
  },
  suggestionDistance: {
    fontSize: 12,
    fontWeight: "500",
  },
  tagsSection: {
    marginBottom: 12,
  },
  tagsScrollContent: {
    paddingRight: 16,
  },
  filterTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  filterTagText: {
    fontSize: 14,
    fontWeight: "600",
  },
  filterTagTextSelected: {
    color: "#fff",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
  },

  placesCardsContainer: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    height: 220,
  },
  placesCardsContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  placeCard: {
    width: CARD_WIDTH,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  placeCardImageContainer: {
    position: "relative",
  },
  placeCardImage: {
    width: "100%",
    height: 100,
  },
  placeCardImagePlaceholder: {
    width: "100%",
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
  },
  placeCardOverlay: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  placeCardContent: {
    padding: 16,
  },
  placeCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  placeCardName: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
    marginRight: 8,
    lineHeight: 20,
  },
  placeCardAddress: {
    fontSize: 13,
    marginBottom: 8,
    lineHeight: 16,
  },
  placeCardDistance: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  placeCardDistanceText: {
    fontSize: 12,
    fontWeight: "600",
  },
  navigateButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  placeCardTags: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  miniTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  miniTagText: {
    fontSize: 11,
    color: "#fff",
    fontWeight: "600",
  },
  moreTagsText: {
    fontSize: 11,
    fontWeight: "500",
  },
  calloutContainer: {
    minWidth: 200,
    padding: 12,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  calloutDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  calloutDistance: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
  },
  calloutButtons: {
    flexDirection: "row",
    gap: 8,
  },
  calloutButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  calloutButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
});
