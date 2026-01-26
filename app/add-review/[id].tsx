import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import Slider from "@react-native-community/slider";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function AddReviewScreen() {
  const { id } = useLocalSearchParams();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!comment.trim()) {
      Alert.alert("Error", "Please write a comment");
      return;
    }

    setLoading(true);
    try {
      // Check if user already reviewed this place
      const { data: existing } = await supabase
        .from("reviews")
        .select("id")
        .eq("place_id", id)
        .eq("user_id", user!.id)
        .single();

      if (existing) {
        // Update existing review
        const { error } = await supabase
          .from("reviews")
          .update({
            rating,
            comment: comment.trim(),
          })
          .eq("id", existing.id);

        if (error) throw error;
        Alert.alert("Success", "Review updated successfully!", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        // Insert new review
        const { error } = await supabase.from("reviews").insert({
          place_id: id,
          user_id: user!.id,
          rating,
          comment: comment.trim(),
        });

        if (error) throw error;
        Alert.alert("Success", "Review added successfully!", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    } catch (error: any) {
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
        <Text style={styles.headerTitle}>Write a Review</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>Rating</Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingValue}>{rating} / 5</Text>
            <Text style={styles.stars}>{"⭐".repeat(rating)}</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={5}
            step={1}
            value={rating}
            onValueChange={setRating}
            minimumTrackTintColor="#2563eb"
            maximumTrackTintColor="#e5e7eb"
            thumbTintColor="#2563eb"
            disabled={loading}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Your Review</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Share your experience about this place..."
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={6}
            editable={!loading}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Review</Text>
          )}
        </TouchableOpacity>
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
  card: {
    backgroundColor: "#fff",
    margin: 16,
    marginBottom: 0,
    padding: 20,
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
    marginBottom: 12,
  },
  ratingContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  ratingValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2563eb",
    marginBottom: 8,
  },
  stars: {
    fontSize: 24,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  textArea: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#1f2937",
    minHeight: 120,
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
});
