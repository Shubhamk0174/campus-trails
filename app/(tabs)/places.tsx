import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useTheme } from "@/contexts/theme-context";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface Place {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  tags: string[];
  added_by: string;
  created_at: string;
  profiles: {
    full_name: string;
  };
}

const POPULAR_TAGS = [
  "food",
  "cafe",
  "study",
  "sports",
  "shopping",
  "cheap",
  "hangout",
];

export default function PlacesScreen() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const router = useRouter();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme ?? "light"];

  const fetchPlaces = async () => {
    try {
      const { data, error } = await supabase
        .from("places")
        .select("*, profiles(full_name)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPlaces(data || []);
      setFilteredPlaces(data || []);
    } catch (error: any) {
      console.error("Error fetching places:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPlaces();
  }, []);

  const filterPlaces = React.useCallback(() => {
    let filtered = places;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (place) =>
          place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          place.description
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          place.address?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter((place) =>
        selectedTags.some((tag) => place.tags.includes(tag)),
      );
    }

    setFilteredPlaces(filtered);
  }, [searchQuery, selectedTags, places]);

  useEffect(() => {
    filterPlaces();
  }, [filterPlaces]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPlaces();
  }, []);

  const renderPlace = ({ item }: { item: Place }) => (
    <TouchableOpacity
      style={[
        styles.placeCard,
        { backgroundColor: colors.card, borderColor: colors.cardBorder },
      ]}
      onPress={() => router.push(`/place/${item.id}`)}
    >
      <View style={styles.placeHeader}>
        <Text style={[styles.placeName, { color: colors.text }]}>
          {item.name}
        </Text>
      </View>
      {item.description && (
        <Text
          style={[styles.placeDescription, { color: colors.textSecondary }]}
          numberOfLines={2}
        >
          {item.description}
        </Text>
      )}
      {item.address && (
        <View style={styles.addressContainer}>
          <IconSymbol name="location.fill" size={14} color={colors.primary} />
          <Text
            style={[styles.placeAddress, { color: colors.primary }]}
            numberOfLines={1}
          >
            {item.address}
          </Text>
        </View>
      )}
      {item.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {item.tags.slice(0, 3).map((tag) => (
            <View
              key={tag}
              style={[styles.tag, { backgroundColor: colors.primary + "20" }]}
            >
              <Text style={[styles.tagText, { color: colors.primary }]}>
                #{tag}
              </Text>
            </View>
          ))}
          {item.tags.length > 3 && (
            <Text style={[styles.moreText, { color: colors.textSecondary }]}>
              +{item.tags.length - 3} more
            </Text>
          )}
        </View>
      )}
      <View style={[styles.placeFooter, { borderTopColor: colors.cardBorder }]}>
        <Text style={[styles.addedBy, { color: colors.textSecondary }]}>
          Added by {item.profiles.full_name}
        </Text>
        <Text style={[styles.date, { color: colors.textTertiary }]}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <IconSymbol name="map.fill" size={64} color={colors.textTertiary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No places found
      </Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        {searchQuery || selectedTags.length > 0
          ? "Try adjusting your filters"
          : "Be the first to add a place!"}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading places...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.pageHeader}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>
            Discover Places
          </Text>
          <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>
            {filteredPlaces.length} place
            {filteredPlaces.length !== 1 ? "s" : ""}
          </Text>
        </View>

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
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.placeholder}
          />
        </View>

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

      <FlatList
        data={filteredPlaces}
        renderItem={renderPlace}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => router.push("/add-place")}
      >
        <IconSymbol name="plus.circle.fill" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  pageHeader: {
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
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
    paddingRight: 14,
    paddingVertical: 14,
    fontSize: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
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
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  placeCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
  },
  placeHeader: {
    marginBottom: 8,
  },
  placeName: {
    fontSize: 18,
    fontWeight: "700",
  },
  placeDescription: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  placeAddress: {
    fontSize: 14,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
  },
  moreText: {
    fontSize: 12,
    alignSelf: "center",
  },
  placeFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    paddingTop: 8,
  },
  addedBy: {
    fontSize: 12,
  },
  date: {
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
});
