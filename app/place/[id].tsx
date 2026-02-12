import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";

interface Place {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  tags: string[];
  added_by: string;
  created_at: string;
  profiles: {
    full_name: string;
    role: string;
  };
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles: {
    full_name: string;
  };
}

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams();
  const [place, setPlace] = useState<Place | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    fetchPlaceDetails();
    fetchReviews();
  }, [id]);

  const fetchPlaceDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("places")
        .select("*, profiles(full_name, role)")
        .eq("id", id)
        .single();

      if (error) throw error;
      setPlace(data);
    } catch (error: any) {
      Alert.alert("Error", error.message);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*, profiles(full_name)")
        .eq("place_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error: any) {
      console.error("Error fetching reviews:", error);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Place",
      "Are you sure you want to delete this place? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: confirmDelete,
        },
      ],
    );
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.from("places").delete().eq("id", id);

      if (error) throw error;

      Alert.alert("Success", "Place deleted successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setDeleting(false);
    }
  };

  const canDelete = place && (place.added_by === user?.id || isAdmin);

  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        ).toFixed(1)
      : null;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!place) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>{place.name}</Text>
          {averageRating && (
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>⭐ {averageRating}</Text>
              <Text style={styles.reviewCount}>({reviews.length} reviews)</Text>
            </View>
          )}
        </View>

        {place.description && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Description</Text>
            <Text style={styles.description}>{place.description}</Text>
          </View>
        )}

        {place.address && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Address</Text>
            <Text style={styles.address}>📍 {place.address}</Text>
          </View>
        )}

        {place.latitude && place.longitude && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Location</Text>
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: place.latitude,
                  longitude: place.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
              >
                <Marker
                  coordinate={{
                    latitude: place.latitude,
                    longitude: place.longitude,
                  }}
                  title={place.name}
                />
              </MapView>
            </View>
          </View>
        )}

        {place.tags.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {place.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Reviews ({reviews.length})</Text>
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <View key={review.id} style={styles.review}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewAuthor}>
                    {review.profiles.full_name}
                  </Text>
                  <Text style={styles.reviewRating}>
                    {"⭐".repeat(review.rating)}
                  </Text>
                </View>
                {review.comment && (
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                )}
                <Text style={styles.reviewDate}>
                  {new Date(review.created_at).toLocaleDateString()}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noReviews}>
              No reviews yet. Be the first to review!
            </Text>
          )}
          <TouchableOpacity
            style={styles.addReviewButton}
            onPress={() => router.push(`/add-review/${id}`)}
          >
            <Text style={styles.addReviewButtonText}>
              {reviews.some((r) => r.profiles.full_name === user?.email)
                ? "Update Your Review"
                : "Add Review"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Added By</Text>
          <Text style={styles.addedBy}>
            {place.profiles.full_name}
            {place.profiles.role === "admin" && " 👑"}
          </Text>
          <Text style={styles.addedDate}>
            {new Date(place.created_at).toLocaleDateString()}
          </Text>
        </View>

        {canDelete && (
          <TouchableOpacity
            style={[
              styles.deleteButton,
              deleting && styles.deleteButtonDisabled,
            ]}
            onPress={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.deleteButtonText}>Delete Place</Text>
            )}
          </TouchableOpacity>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
  backButton: {},
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
  },
  titleSection: {
    backgroundColor: "#fff",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f59e0b",
  },
  reviewCount: {
    fontSize: 14,
    color: "#6b7280",
  },
  card: {
    backgroundColor: "#fff",
    marginTop: 12,
    padding: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: "#4b5563",
    lineHeight: 24,
  },
  address: {
    fontSize: 16,
    color: "#2563eb",
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
  },
  map: {
    flex: 1,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 14,
    color: "#2563eb",
    fontWeight: "600",
  },
  review: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  reviewAuthor: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
  },
  reviewRating: {
    fontSize: 14,
  },
  reviewComment: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 4,
    lineHeight: 20,
  },
  reviewDate: {
    fontSize: 12,
    color: "#9ca3af",
  },
  noReviews: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    paddingVertical: 20,
  },
  addReviewButton: {
    backgroundColor: "#2563eb",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  addReviewButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  addedBy: {
    fontSize: 16,
    color: "#1f2937",
    marginBottom: 4,
  },
  addedDate: {
    fontSize: 14,
    color: "#6b7280",
  },
  deleteButton: {
    backgroundColor: "#ef4444",
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  bottomSpacer: {
    height: 20,
  },
});
