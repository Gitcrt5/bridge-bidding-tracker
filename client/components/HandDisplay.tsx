import React from "react";
import { View, StyleSheet } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, BridgeColors } from "@/constants/theme";
import { BoardHands, Hand, Rank, getSuitSymbol } from "@/types/bridge";

interface HandDisplayProps {
  hands: BoardHands;
  compact?: boolean;
}

function formatCards(ranks: Rank[]): string {
  if (ranks.length === 0) return "-";
  const order: Rank[] = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];
  return ranks.sort((a, b) => order.indexOf(a) - order.indexOf(b)).join("");
}

function SingleHand({ hand, position, compact }: { hand: Hand; position: string; compact?: boolean }) {
  const { theme, isDark } = useTheme();

  const suits = [
    { symbol: "S", cards: hand.spades, color: isDark ? BridgeColors.spadesLight : BridgeColors.spades },
    { symbol: "H", cards: hand.hearts, color: BridgeColors.hearts },
    { symbol: "D", cards: hand.diamonds, color: BridgeColors.diamonds },
    { symbol: "C", cards: hand.clubs, color: isDark ? BridgeColors.clubsLight : BridgeColors.clubs },
  ];

  return (
    <View style={[styles.hand, compact && styles.handCompact]}>
      <ThemedText type="small" style={[styles.positionLabel, { color: theme.textSecondary }]}>
        {position}
      </ThemedText>
      <View style={styles.suitsList}>
        {suits.map((suit) => (
          <View key={suit.symbol} style={styles.suitRow}>
            <ThemedText style={[styles.suitSymbol, { color: suit.color }]}>
              {getSuitSymbol(suit.symbol as any)}
            </ThemedText>
            <ThemedText type="small" style={[styles.cards, { color: theme.text }]}>
              {formatCards(suit.cards)}
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

export function HandDisplay({ hands, compact }: HandDisplayProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { borderColor: theme.border }]}>
      <View style={styles.topRow}>
        <View style={styles.spacer} />
        <SingleHand hand={hands.north} position="N" compact={compact} />
        <View style={styles.spacer} />
      </View>
      <View style={styles.middleRow}>
        <SingleHand hand={hands.west} position="W" compact={compact} />
        <View style={[styles.centerSpace, { borderColor: theme.border }]} />
        <SingleHand hand={hands.east} position="E" compact={compact} />
      </View>
      <View style={styles.bottomRow}>
        <View style={styles.spacer} />
        <SingleHand hand={hands.south} position="S" compact={compact} />
        <View style={styles.spacer} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  middleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  spacer: {
    flex: 1,
  },
  centerSpace: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 60,
    borderWidth: 1,
    borderRadius: BorderRadius.xs,
    margin: Spacing.xs,
  },
  hand: {
    alignItems: "center",
    padding: Spacing.xs,
    minWidth: 80,
  },
  handCompact: {
    minWidth: 60,
    padding: 2,
  },
  positionLabel: {
    fontWeight: "700",
    marginBottom: 2,
  },
  suitsList: {
    gap: 1,
  },
  suitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  suitSymbol: {
    fontSize: 14,
    fontWeight: "700",
    width: 16,
    textAlign: "center",
  },
  cards: {
    fontFamily: "monospace",
    fontSize: 12,
  },
});
