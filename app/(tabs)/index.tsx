import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/contexts/theme-context";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function HomeScreen() {
  const { user, profile, isAdmin } = useAuth();
  const router = useRouter();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme ?? "light"];
  const [stats, setStats] = useState({
    totalPlaces: 0,
    myPlaces: 0,
    totalReviews: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = React.useCallback(async () => {
    try {
      const [placesRes, myPlacesRes, reviewsRes] = await Promise.all([
        supabase.from("places").select("id", { count: "exact", head: true }),
        supabase
          .from("places")
          .select("id", { count: "exact", head: true })
          .eq("added_by", user!.id),
        supabase.from("reviews").select("id", { count: "exact", head: true }),
      ]);

      setStats({
        totalPlaces: placesRes.count || 0,
        myPlaces: myPlacesRes.count || 0,
        totalReviews: reviewsRes.count || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.content}>
        <View style={styles.greetingSection}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              Hello,
            </Text>
            <Text style={[styles.name, { color: colors.text }]}>
              {profile?.full_name || "Student"}!
            </Text>
          </View>
          {isAdmin && (
            <View
              style={[
                styles.adminBadge,
                { backgroundColor: colors.warning + "20" },
              ]}
            >
              <IconSymbol
                name="crown.fill"
                size={16}
                color={colors.warning}
                style={styles.badgeIcon}
              />
              <Text style={[styles.adminBadgeText, { color: colors.warning }]}>
                Admin
              </Text>
            </View>
          )}
        </View>

        <View style={styles.statsContainer}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <Text style={[styles.statNumber, { color: colors.primary }]}>
              {stats.totalPlaces}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Total Places
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <Text style={[styles.statNumber, { color: colors.primary }]}>
              {stats.myPlaces}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              My Places
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <Text style={[styles.statNumber, { color: colors.primary }]}>
              {stats.totalReviews}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Reviews
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Quick Actions
          </Text>
          <TouchableOpacity
            style={[
              styles.actionCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
            onPress={() => router.push("/add-place")}
          >
            <View
              style={[
                styles.actionIcon,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <IconSymbol
                name="plus.circle.fill"
                size={28}
                color={colors.primary}
              />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>
                Add New Place
              </Text>
              <Text
                style={[
                  styles.actionDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Share a great spot with your peers
              </Text>
            </View>
            <IconSymbol
              name="chevron.right"
              size={24}
              color={colors.textTertiary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
            onPress={() => router.push("/(tabs)/places")}
          >
            <View
              style={[
                styles.actionIcon,
                { backgroundColor: colors.accent + "20" },
              ]}
            >
              <IconSymbol name="map.fill" size={28} color={colors.accent} />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>
                Explore Places
              </Text>
              <Text
                style={[
                  styles.actionDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Discover amazing locations around campus
              </Text>
            </View>
            <IconSymbol
              name="chevron.right"
              size={24}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            About Campus Trails
          </Text>
          <View
            style={[
              styles.infoCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Campus Trails helps students discover the best places around
              campus. Share your favorite spots, read reviews, and explore new
              locations!
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  greetingSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    marginBottom: 2,
  },
  name: {
    fontSize: 28,
    fontWeight: "bold",
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeIcon: {
    marginRight: 4,
  },
  adminBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  actionCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 14,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
  },
  bottomSpacer: {
    height: 40,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
});
