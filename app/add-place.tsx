import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";

const AVAILABLE_TAGS = [
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

export default function AddPlaceScreen() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [location, setLocation] = useState({
    latitude: 16.5062, // VIT AP default
    longitude: 80.2219,
  });
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [tempLocation, setTempLocation] = useState(location);
  const [selectedImages, setSelectedImages] = useState<
    ImagePicker.ImagePickerAsset[]
  >([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      setGettingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permission is required");
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      const newLocation = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };
      setLocation(newLocation);
      setTempLocation(newLocation);
    } catch (error) {
      console.error("Error getting location:", error);
    } finally {
      setGettingLocation(false);
    }
  };

  const openMapPicker = () => {
    Keyboard.dismiss();
    setTempLocation(location);
    setShowMapPicker(true);
  };

  const confirmLocation = () => {
    setLocation(tempLocation);
    setShowMapPicker(false);
  };

  const pickImageFromGallery = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Media library permission is required",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 5,
      });

      if (!result.canceled && result.assets) {
        const combined = [...selectedImages, ...result.assets].slice(0, 5);
        setSelectedImages(combined);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Camera permission is required");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const combined = [...selectedImages, ...result.assets].slice(0, 5);
        setSelectedImages(combined);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo");
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadAllImages = async (): Promise<string[]> => {
    const urls: string[] = [];

    for (let i = 0; i < selectedImages.length; i++) {
      const image = selectedImages[i];
      const uri = image.uri;

      const isPng =
        uri.toLowerCase().endsWith(".png") ||
        (image.mimeType ?? "").includes("png");
      const ext = isPng ? ".png" : ".jpg";
      const contentType = isPng ? "image/png" : "image/jpeg";
      const filePath = `places/${Date.now()}_${Math.random().toString(36).substring(7)}${ext}`;

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: "base64",
      });

      const { error } = await supabase.storage
        .from("images")
        .upload(filePath, decode(base64), {
          contentType,
          upsert: false,
        });

      if (error) {
        throw new Error(`Failed to upload image ${i + 1}: ${error.message}`);
      }

      const { data: urlData } = supabase.storage
        .from("images")
        .getPublicUrl(filePath);

      urls.push(urlData.publicUrl);
    }

    return urls;
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a place name");
      return;
    }

    if (selectedTags.length === 0) {
      Alert.alert("Error", "Please select at least one tag");
      return;
    }

    if (!user) {
      Alert.alert("Error", "You must be logged in to add a place");
      return;
    }

    setLoading(true);
    try {
      let imageUrls: string[] = [];

      if (selectedImages.length > 0) {
        setUploadingImages(true);
        imageUrls = await uploadAllImages();
        setUploadingImages(false);
      }

      const { error } = await supabase.from("places").insert({
        name: name.trim(),
        description: description.trim() || null,
        address: address.trim() || null,
        latitude: location.latitude,
        longitude: location.longitude,
        tags: selectedTags,
        image_urls: imageUrls,
        added_by: user!.id,
      });

      if (error) throw error;

      Alert.alert("Success", "Place added successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      setUploadingImages(false);
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Place</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.label}>
            Place Name <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Coffee House"
            placeholderTextColor="#6b7280"
            value={name}
            onChangeText={setName}
            editable={!loading}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell us more about this place..."
            placeholderTextColor="#6b7280"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            editable={!loading}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Near Main Gate"
            placeholderTextColor="#6b7280"
            value={address}
            onChangeText={setAddress}
            editable={!loading}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Location</Text>
          <Text style={styles.hint}>Tap to select location on map</Text>

          <TouchableOpacity
            style={styles.locationPreview}
            onPress={openMapPicker}
            disabled={loading}
          >
            <View style={styles.locationInfo}>
              <Ionicons name="location" size={24} color="#2563eb" />
              <View style={styles.locationText}>
                <Text style={styles.locationLabel}>
                  {location.latitude === 16.5062 &&
                  location.longitude === 80.2219
                    ? "Default location selected"
                    : "Location selected"}
                </Text>
                <Text style={styles.locationCoords}>
                  {location.latitude.toFixed(4)},{" "}
                  {location.longitude.toFixed(4)}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>

          <View style={styles.locationButtons}>
            <TouchableOpacity
              onPress={getCurrentLocation}
              disabled={gettingLocation || loading}
              style={styles.useLocationButton}
            >
              {gettingLocation ? (
                <ActivityIndicator size="small" color="#2563eb" />
              ) : (
                <>
                  <Ionicons name="navigate" size={18} color="#2563eb" />
                  <Text style={styles.useLocationText}>Use My Location</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Images</Text>
          <Text style={styles.hint}>
            Add up to 5 photos · {selectedImages.length}/5 selected
          </Text>

          {selectedImages.length > 0 && (
            <View style={styles.imagesPreview}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {selectedImages.map((image, index) => (
                  <View key={index} style={styles.imageContainer}>
                    <Image
                      source={{ uri: image.uri }}
                      style={styles.imagePreview}
                    />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                      disabled={loading}
                    >
                      <Ionicons name="close-circle" size={24} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.imageButtons}>
            <TouchableOpacity
              style={[
                styles.imageButton,
                selectedImages.length >= 5 && styles.imageButtonDisabled,
              ]}
              onPress={pickImageFromGallery}
              disabled={loading || selectedImages.length >= 5}
            >
              <Ionicons
                name="images"
                size={20}
                color={selectedImages.length >= 5 ? "#9ca3af" : "#2563eb"}
              />
              <Text
                style={[
                  styles.imageButtonText,
                  selectedImages.length >= 5 && styles.imageButtonTextDisabled,
                ]}
              >
                Gallery
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.imageButton,
                selectedImages.length >= 5 && styles.imageButtonDisabled,
              ]}
              onPress={takePhoto}
              disabled={loading || selectedImages.length >= 5}
            >
              <Ionicons
                name="camera"
                size={20}
                color={selectedImages.length >= 5 ? "#9ca3af" : "#2563eb"}
              />
              <Text
                style={[
                  styles.imageButtonText,
                  selectedImages.length >= 5 && styles.imageButtonTextDisabled,
                ]}
              >
                Camera
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>
            Tags <Text style={styles.required}>*</Text>
          </Text>
          <Text style={styles.hint}>Select all that apply</Text>
          <View style={styles.tagsContainer}>
            {AVAILABLE_TAGS.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tagChip,
                  selectedTags.includes(tag) && styles.tagChipSelected,
                ]}
                onPress={() => toggleTag(tag)}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.tagChipText,
                    selectedTags.includes(tag) && styles.tagChipTextSelected,
                  ]}
                >
                  #{tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.submitLoadingContainer}>
              <ActivityIndicator color="#fff" />
              {uploadingImages && (
                <Text style={styles.submitLoadingText}>
                  Uploading images...
                </Text>
              )}
            </View>
          ) : (
            <Text style={styles.submitButtonText}>Add Place</Text>
          )}
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Full Screen Map Picker Modal */}
      <Modal
        visible={showMapPicker}
        animationType="slide"
        onRequestClose={() => setShowMapPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowMapPicker(false)}
              style={styles.modalCancelButton}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Location</Text>
            <TouchableOpacity
              onPress={confirmLocation}
              style={styles.modalConfirmButton}
            >
              <Text style={styles.modalConfirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>

          <MapView
            style={styles.fullMap}
            initialRegion={{
              ...tempLocation,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            onPress={(e) => {
              setTempLocation(e.nativeEvent.coordinate);
            }}
            showsUserLocation={true}
          >
            <Marker coordinate={tempLocation} title="Selected Location" />
          </MapView>

          <View style={styles.mapInstructions}>
            <Ionicons name="information-circle" size={20} color="#2563eb" />
            <Text style={styles.mapInstructionsText}>
              Tap anywhere on the map to set the location
            </Text>
          </View>

          <TouchableOpacity
            style={styles.useMyLocationFab}
            onPress={async () => {
              await getCurrentLocation();
              setTempLocation(location);
            }}
            disabled={gettingLocation}
          >
            {gettingLocation ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Ionicons name="navigate" size={24} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#2563eb",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  backButton: {
    marginBottom: 8,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: "#fff",
    margin: 16,
    marginBottom: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
  },
  required: {
    color: "#ef4444",
  },
  hint: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 12,
  },
  imagesPreview: {
    marginBottom: 16,
  },
  imageContainer: {
    position: "relative",
    marginRight: 12,
    marginBottom: 8,
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "white",
    borderRadius: 12,
  },
  imageButtons: {
    flexDirection: "row",
    gap: 12,
  },
  imageButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    backgroundColor: "white",
  },
  imageButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#2563eb",
    fontWeight: "500",
  },
  imageButtonDisabled: {
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  imageButtonTextDisabled: {
    color: "#9ca3af",
  },
  input: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#1f2937",
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  locationPreview: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  locationText: {
    marginLeft: 12,
    flex: 1,
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 2,
  },
  locationCoords: {
    fontSize: 12,
    color: "#6b7280",
  },
  locationButtons: {
    flexDirection: "row",
    gap: 8,
  },
  useLocationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#dbeafe",
    borderRadius: 8,
    gap: 6,
  },
  useLocationText: {
    color: "#2563eb",
    fontSize: 14,
    fontWeight: "600",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  tagChipSelected: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  tagChipText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "600",
  },
  tagChipTextSelected: {
    color: "#fff",
  },
  submitButton: {
    backgroundColor: "#2563eb",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  submitLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  submitLoadingText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomSpacer: {
    height: 20,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  modalCancelButton: {
    padding: 4,
  },
  modalCancelText: {
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "600",
  },
  modalConfirmButton: {
    padding: 4,
  },
  modalConfirmText: {
    fontSize: 16,
    color: "#2563eb",
    fontWeight: "700",
  },
  fullMap: {
    flex: 1,
  },
  mapInstructions: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dbeafe",
    paddingHorizontal: 16,
    paddingVertical: 12,
    margin: 16,
    borderRadius: 8,
    gap: 8,
  },
  mapInstructionsText: {
    flex: 1,
    fontSize: 14,
    color: "#1e40af",
    fontWeight: "500",
  },
  useMyLocationFab: {
    position: "absolute",
    right: 20,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
});
