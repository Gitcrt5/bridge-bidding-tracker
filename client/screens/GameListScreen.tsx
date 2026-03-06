import React, { useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { HeaderButton } from "@react-navigation/elements";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Game } from "@/types/bridge";
import { getAllGames, deleteGame } from "@/lib/storage";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function GameCard({
  game,
  index,
  onPress,
  onLongPress,
}: {
  game: Game;
  index: number;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <AnimatedPressable
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.gameCard,
          { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
          animatedStyle,
        ]}
        testID={`game-card-${game.id}`}
      >
        <View style={styles.cardHeader}>
          <ThemedText type="h4" style={styles.tournamentName}>
            {game.tournamentName}
          </ThemedText>
          <ThemedText
            type="small"
            style={[styles.dateText, { color: theme.textSecondary }]}
          >
            {formatDate(game.date)}
          </ThemedText>
        </View>
        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Feather
              name="users"
              size={14}
              color={theme.textSecondary}
              style={styles.detailIcon}
            />
            <ThemedText
              type="body"
              style={[styles.detailText, { color: theme.textSecondary }]}
            >
              {game.partner}
            </ThemedText>
          </View>
          {game.location ? (
            <View style={styles.detailRow}>
              <Feather
                name="map-pin"
                size={14}
                color={theme.textSecondary}
                style={styles.detailIcon}
              />
              <ThemedText
                type="small"
                style={[styles.detailText, { color: theme.textSecondary }]}
              >
                {game.location}
              </ThemedText>
            </View>
          ) : null}
        </View>
        <View style={styles.cardFooter}>
          <View
            style={[styles.badge, { backgroundColor: theme.backgroundSecondary }]}
          >
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {game.numberOfBoards} boards
            </ThemedText>
          </View>
          <View
            style={[styles.badge, { backgroundColor: theme.backgroundSecondary }]}
          >
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {game.movementType}
            </ThemedText>
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

function EmptyState({ onCreateGame }: { onCreateGame: () => void }) {
  const { theme } = useTheme();

  return (
    <View style={styles.emptyContainer}>
      <Image
        source={require("../../assets/images/empty-games.png")}
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <ThemedText type="h4" style={styles.emptyTitle}>
        No Games Yet
      </ThemedText>
      <ThemedText
        type="body"
        style={[styles.emptyMessage, { color: theme.textSecondary }]}
      >
        Start tracking your bridge bidding by creating your first game.
      </ThemedText>
      <Pressable
        onPress={onCreateGame}
        style={({ pressed }) => [
          styles.emptyButton,
          { backgroundColor: theme.link, opacity: pressed ? 0.9 : 1 },
        ]}
        testID="button-create-first-game"
      >
        <Feather name="plus" size={20} color="#FFFFFF" />
        <ThemedText
          type="body"
          style={[styles.emptyButtonText, { color: "#FFFFFF" }]}
        >
          Create Game
        </ThemedText>
      </Pressable>
    </View>
  );
}

export default function GameListScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();

  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadGames = useCallback(async () => {
    try {
      const loadedGames = await getAllGames();
      setGames(loadedGames);
    } catch (error) {
      console.error("Error loading games:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadGames();
    }, [loadGames])
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <HeaderButton
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate("CreateGame");
          }}
          testID="button-add-game"
        >
          <Feather name="plus" size={24} color={theme.link} />
        </HeaderButton>
      ),
    });
  }, [navigation, theme]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadGames();
  };

  const handleGamePress = (game: Game) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("BiddingEntry", { gameId: game.id, boardNumber: 1 });
  };

  const handleGameLongPress = async (game: Game) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  const handleCreateGame = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("CreateGame");
  };

  const renderItem = ({ item, index }: { item: Game; index: number }) => (
    <GameCard
      game={item}
      index={index}
      onPress={() => handleGamePress(item)}
      onLongPress={() => handleGameLongPress(item)}
    />
  );

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <View style={styles.skeletonCard} />
        <View style={styles.skeletonCard} />
        <View style={styles.skeletonCard} />
      </ThemedView>
    );
  }

  return (
    <FlatList
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.contentContainer,
        {
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
        },
        games.length === 0 && styles.emptyList,
      ]}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
      data={games}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ListEmptyComponent={<EmptyState onCreateGame={handleCreateGame} />}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  emptyList: {
    flex: 1,
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: 100,
    gap: Spacing.md,
  },
  skeletonCard: {
    height: 140,
    borderRadius: BorderRadius.lg,
    backgroundColor: "rgba(128, 128, 128, 0.1)",
  },
  gameCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  tournamentName: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  dateText: {},
  cardDetails: {
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailIcon: {
    marginRight: Spacing.sm,
  },
  detailText: {},
  cardFooter: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  emptyContainer: {
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyImage: {
    width: 180,
    height: 180,
    marginBottom: Spacing.xl,
    opacity: 0.9,
  },
  emptyTitle: {
    marginBottom: Spacing.sm,
  },
  emptyMessage: {
    textAlign: "center",
    marginBottom: Spacing["2xl"],
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  emptyButtonText: {
    fontWeight: "600",
  },
});
