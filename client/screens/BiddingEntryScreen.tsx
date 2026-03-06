import React, { useState, useEffect, useCallback, useLayoutEffect } from "react";
import { Picker } from "@react-native-picker/picker";
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  ScrollView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HeaderButton } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
} from "react-native-reanimated";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { HandDisplay } from "@/components/HandDisplay";
import { DoubleDummyTable } from "@/components/DoubleDummyTable";
import { PBNImportModal } from "@/components/PBNImportModal";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, BridgeColors } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import {
  Game,
  Board,
  Bid,
  Position,
  Level,
  Suit,
  CardSuit,
  Rank,
  POSITIONS,
  LEVELS,
  SUITS,
  CARD_SUITS,
  RANKS,
  getSuitSymbol,
  formatBid,
  getPositionName,
} from "@/types/bridge";
import { getGameById, saveGame } from "@/lib/storage";
import { v4 as uuidv4 } from "uuid";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, "BiddingEntry">;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function getSuitColor(suit: Suit | CardSuit, isDark: boolean): string {
  switch (suit) {
    case "C":
      return isDark ? BridgeColors.clubsLight : BridgeColors.clubs;
    case "D":
      return BridgeColors.diamonds;
    case "H":
      return BridgeColors.hearts;
    case "S":
      return isDark ? BridgeColors.spadesLight : BridgeColors.spades;
    case "NT":
      return BridgeColors.noTrump;
    default:
      return isDark ? "#ECEDEE" : "#1A1A1A";
  }
}

function BidButton({
  label,
  onPress,
  selected,
  color,
  size = "normal",
  disabled,
}: {
  label: string;
  onPress: () => void;
  selected?: boolean;
  color?: string;
  size?: "normal" | "large";
  disabled?: boolean;
}) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withSpring(0.92, { damping: 15, stiffness: 200 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const buttonSize = size === "large" ? Spacing.suitButtonSize : Spacing.bidButtonSize;

  return (
    <AnimatedPressable
      onPress={() => {
        if (!disabled) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        styles.bidButton,
        {
          width: buttonSize,
          height: buttonSize,
          backgroundColor: selected ? theme.link : theme.backgroundDefault,
          borderColor: selected ? theme.link : theme.border,
          opacity: disabled ? 0.4 : 1,
        },
        animatedStyle,
      ]}
    >
      <ThemedText
        type="body"
        style={[
          styles.bidButtonText,
          {
            color: selected ? "#FFFFFF" : color || theme.text,
            fontWeight: "600",
            fontSize: size === "large" ? 24 : 18,
          },
        ]}
      >
        {label}
      </ThemedText>
    </AnimatedPressable>
  );
}

function BiddingTable({
  bids,
  dealer,
  onBidPress,
  minRows = 4,
}: {
  bids: Bid[];
  dealer: Position;
  onBidPress: (bid: Bid) => void;
  minRows?: number;
}) {
  const { theme, isDark } = useTheme();

  const dealerIndex = POSITIONS.indexOf(dealer);
  const rows: (Bid | null)[][] = [];
  
  let bidIndex = 0;
  while (bidIndex < bids.length || rows.length < minRows) {
    const row: (Bid | null)[] = [];
    for (let i = 0; i < 4; i++) {
      if (bidIndex < bids.length) {
        row.push(bids[bidIndex]);
        bidIndex++;
      } else {
        row.push(null);
      }
    }
    rows.push(row);
    if (bidIndex >= bids.length && rows.length >= minRows) break;
  }

  const orderedPositions = POSITIONS.slice(dealerIndex).concat(
    POSITIONS.slice(0, dealerIndex)
  );

  return (
    <View style={[styles.biddingTable, { borderColor: theme.border }]}>
      <View style={[styles.tableHeader, { backgroundColor: theme.backgroundDefault }]}>
        {orderedPositions.map((pos) => (
          <View key={pos} style={styles.tableHeaderCell}>
            <ThemedText type="small" style={{ fontWeight: "600" }}>
              {pos}
            </ThemedText>
          </View>
        ))}
      </View>
      {rows.map((row, rowIndex) => (
        <View
          key={rowIndex}
          style={[
            styles.tableRow,
            { borderTopColor: theme.border },
          ]}
        >
          {row.map((bid, colIndex) => (
            <Pressable
              key={colIndex}
              style={[
                styles.tableCell,
                colIndex > 0 && { borderLeftWidth: 1, borderLeftColor: theme.border },
              ]}
              onPress={() => bid && onBidPress(bid)}
              disabled={!bid}
            >
              {bid ? (
                <View style={styles.bidCellContent}>
                  <ThemedText
                    type="body"
                    style={[
                      styles.bidText,
                      {
                        color: bid.special
                          ? bid.special === "Pass"
                            ? theme.pass
                            : bid.special === "X"
                            ? theme.double
                            : theme.redouble
                          : bid.suit
                          ? getSuitColor(bid.suit, isDark)
                          : theme.text,
                      },
                    ]}
                  >
                    {formatBid(bid)}
                  </ThemedText>
                  {bid.alertText ? (
                    <View style={[styles.alertIndicator, { backgroundColor: theme.alertActive }]}>
                      <ThemedText style={styles.alertIndicatorText}>!</ThemedText>
                    </View>
                  ) : null}
                </View>
              ) : (
                <ThemedText type="body" style={{ color: theme.textSecondary }}>
                  -
                </ThemedText>
              )}
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}

function AlertModal({
  visible,
  bid,
  onClose,
  onSave,
}: {
  visible: boolean;
  bid: Bid | null;
  onClose: () => void;
  onSave: (text: string) => void;
}) {
  const { theme } = useTheme();
  const [alertText, setAlertText] = useState(bid?.alertText || "");

  useEffect(() => {
    setAlertText(bid?.alertText || "");
  }, [bid]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={[styles.alertModal, { backgroundColor: theme.backgroundRoot }]}
          onPress={(e) => e.stopPropagation()}
        >
          <ThemedText type="h4" style={styles.alertModalTitle}>
            Alert for {bid ? formatBid(bid) : ""}
          </ThemedText>
          <TextInput
            value={alertText}
            onChangeText={setAlertText}
            placeholder="Enter alert explanation..."
            placeholderTextColor={theme.textSecondary}
            multiline
            style={[
              styles.alertInput,
              {
                backgroundColor: theme.backgroundDefault,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
            autoFocus
          />
          <View style={styles.alertModalButtons}>
            <Pressable
              onPress={onClose}
              style={[styles.alertModalButton, { borderColor: theme.border }]}
            >
              <ThemedText type="body">Cancel</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => {
                onSave(alertText);
                onClose();
              }}
              style={[
                styles.alertModalButton,
                { backgroundColor: theme.link },
              ]}
            >
              <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
                Save
              </ThemedText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function BoardJumpModal({
  visible,
  currentBoard,
  totalBoards,
  onClose,
  onSelect,
}: {
  visible: boolean;
  currentBoard: number;
  totalBoards: number;
  onClose: () => void;
  onSelect: (board: number) => void;
}) {
  const { theme } = useTheme();

  const boards = Array.from({ length: totalBoards }, (_, i) => i + 1);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={[styles.boardJumpModal, { backgroundColor: theme.backgroundRoot }]}
          onPress={(e) => e.stopPropagation()}
        >
          <ThemedText type="h4" style={styles.boardJumpTitle}>
            Jump to Board
          </ThemedText>
          <ScrollView
            style={styles.boardJumpScroll}
            contentContainerStyle={styles.boardJumpGrid}
          >
            {boards.map((num) => (
              <Pressable
                key={num}
                onPress={() => {
                  onSelect(num);
                  onClose();
                }}
                style={[
                  styles.boardJumpButton,
                  {
                    backgroundColor:
                      num === currentBoard ? theme.link : theme.backgroundDefault,
                    borderColor: num === currentBoard ? theme.link : theme.border,
                  },
                ]}
              >
                <ThemedText
                  type="body"
                  style={{
                    color: num === currentBoard ? "#FFFFFF" : theme.text,
                    fontWeight: num === currentBoard ? "600" : "400",
                  }}
                >
                  {num}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function LockConfirmModal({
  visible,
  isLocked,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  isLocked: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { theme } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={[styles.lockModal, { backgroundColor: theme.backgroundRoot }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.lockModalIcon}>
            <Feather
              name={isLocked ? "unlock" : "lock"}
              size={32}
              color={isLocked ? theme.link : theme.alertActive}
            />
          </View>
          <ThemedText type="h4" style={styles.lockModalTitle}>
            {isLocked ? "Unlock Bidding?" : "Lock Bidding?"}
          </ThemedText>
          <ThemedText type="body" style={[styles.lockModalDescription, { color: theme.textSecondary }]}>
            {isLocked
              ? "This will allow editing of bids, notes, and results."
              : "This will prevent any changes to bids, notes, and results until unlocked."}
          </ThemedText>
          <View style={styles.lockModalButtons}>
            <Pressable
              onPress={onClose}
              style={[styles.lockModalButton, { borderColor: theme.border }]}
            >
              <ThemedText type="body">Cancel</ThemedText>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={[
                styles.lockModalButton,
                {
                  backgroundColor: isLocked ? theme.link : theme.alertActive,
                  borderColor: isLocked ? theme.link : theme.alertActive,
                },
              ]}
            >
              <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
                {isLocked ? "Unlock" : "Lock"}
              </ThemedText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function TricksPicker({
  value,
  onChange,
  disabled,
}: {
  value?: number;
  onChange: (tricks: number) => void;
  disabled?: boolean;
}) {
  const { theme } = useTheme();
  const [showPicker, setShowPicker] = useState(false);
  const [tempValue, setTempValue] = useState(value ?? 0);

  useEffect(() => {
    setTempValue(value ?? 0);
  }, [value]);

  return (
    <View style={styles.compactTricksPicker}>
      <Pressable
        onPress={() => !disabled && setShowPicker(true)}
        disabled={disabled}
        style={[
          styles.tricksDisplay,
          { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
          disabled && { opacity: 0.6 },
        ]}
      >
        <ThemedText type="body" style={{ fontWeight: "600" }}>
          {value ?? 0}
        </ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: 4 }}>
          tricks
        </ThemedText>
      </Pressable>

      <Modal visible={showPicker} transparent animationType="slide">
        <Pressable 
          style={styles.pickerModalOverlay} 
          onPress={() => {
            onChange(tempValue);
            setShowPicker(false);
          }}
        >
          <View 
            style={[styles.pickerModalContent, { backgroundColor: theme.backgroundRoot }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.pickerModalHeader}>
              <Pressable onPress={() => setShowPicker(false)}>
                <ThemedText type="body" style={{ color: theme.textSecondary }}>
                  Cancel
                </ThemedText>
              </Pressable>
              <ThemedText type="body" style={{ fontWeight: "600" }}>
                Tricks Taken
              </ThemedText>
              <Pressable
                onPress={() => {
                  onChange(tempValue);
                  setShowPicker(false);
                  Haptics.selectionAsync();
                }}
              >
                <ThemedText type="body" style={{ color: theme.link, fontWeight: "600" }}>
                  Done
                </ThemedText>
              </Pressable>
            </View>
            <Picker
              selectedValue={tempValue}
              onValueChange={(itemValue) => setTempValue(itemValue)}
              style={{ color: theme.text }}
            >
              {Array.from({ length: 14 }, (_, i) => i).map((num) => (
                <Picker.Item key={num} label={`${num} tricks`} value={num} color={theme.text} />
              ))}
            </Picker>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function LeadCardPicker({
  value,
  onChange,
  disabled,
}: {
  value?: { rank: Rank; suit: CardSuit };
  onChange: (card: { rank: Rank; suit: CardSuit } | undefined) => void;
  disabled?: boolean;
}) {
  const { theme, isDark } = useTheme();
  const [showPicker, setShowPicker] = useState(false);

  return (
    <View style={styles.compactLeadPicker}>
      <Pressable
        onPress={() => !disabled && setShowPicker(true)}
        disabled={disabled}
        style={[
          styles.leadCardDisplay,
          { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
          disabled && { opacity: 0.6 },
        ]}
      >
        {value ? (
          <View style={styles.selectedLeadCard}>
            <ThemedText
              type="body"
              style={{
                color: getSuitColor(value.suit, isDark),
                fontWeight: "700",
                fontSize: 18,
              }}
            >
              {value.rank}
              {getSuitSymbol(value.suit)}
            </ThemedText>
          </View>
        ) : (
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Lead
          </ThemedText>
        )}
      </Pressable>

      <Modal visible={showPicker} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowPicker(false)}>
          <View style={[styles.compactPickerModal, { backgroundColor: theme.backgroundRoot }]}>
            <View style={styles.pickerHeader}>
              <ThemedText type="h4">Select Lead Card</ThemedText>
              <Pressable onPress={() => setShowPicker(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <View style={styles.rankGrid}>
              {RANKS.map((rank) => (
                <Pressable
                  key={rank}
                  onPress={() => {
                    Haptics.selectionAsync();
                    if (value?.suit) {
                      onChange({ rank, suit: value.suit });
                    } else {
                      onChange({ rank, suit: "S" }); // Default to Spades if no suit
                    }
                  }}
                  style={[
                    styles.gridItem,
                    {
                      backgroundColor:
                        value?.rank === rank ? theme.link : theme.backgroundDefault,
                      borderColor: value?.rank === rank ? theme.link : theme.border,
                    },
                  ]}
                >
                  <ThemedText
                    style={{
                      color: value?.rank === rank ? "#FFFFFF" : theme.text,
                      fontWeight: "600",
                    }}
                  >
                    {rank}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            <View style={styles.suitGrid}>
              {CARD_SUITS.map((suit) => (
                <Pressable
                  key={suit}
                  onPress={() => {
                    Haptics.selectionAsync();
                    if (value?.rank) {
                      onChange({ rank: value.rank, suit });
                    } else {
                      onChange({ rank: "A", suit }); // Default to Ace if no rank
                    }
                  }}
                  style={[
                    styles.gridItem,
                    {
                      backgroundColor:
                        value?.suit === suit ? getSuitColor(suit, isDark) : theme.backgroundDefault,
                      borderColor: value?.suit === suit ? getSuitColor(suit, isDark) : theme.border,
                      flex: 1,
                    },
                  ]}
                >
                  <ThemedText
                    type="h4"
                    style={{
                      color: value?.suit === suit ? "#FFFFFF" : getSuitColor(suit, isDark),
                    }}
                  >
                    {getSuitSymbol(suit)}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={() => setShowPicker(false)}
              style={[styles.doneButton, { backgroundColor: theme.link }]}
            >
              <ThemedText style={{ color: "#FFFFFF", fontWeight: "600" }}>Done</ThemedText>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

export default function BiddingEntryScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { theme, isDark } = useTheme();

  const { gameId, boardNumber: initialBoard = 1 } = route.params;

  const [game, setGame] = useState<Game | null>(null);
  const [currentBoardNumber, setCurrentBoardNumber] = useState(initialBoard);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [alertBid, setAlertBid] = useState<Bid | null>(null);
  const [boardJumpVisible, setBoardJumpVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lockModalVisible, setLockModalVisible] = useState(false);
  const [pbnImportVisible, setPbnImportVisible] = useState(false);

  const currentBoard = game?.boards.find((b) => b.number === currentBoardNumber);

  useEffect(() => {
    loadGame();
  }, [gameId]);

  const loadGame = async () => {
    const loadedGame = await getGameById(gameId);
    if (loadedGame) {
      setGame(loadedGame);
    }
  };

  const saveCurrentGame = useCallback(async () => {
    if (game && !saving) {
      setSaving(true);
      try {
        await saveGame(game);
      } catch (error) {
        console.error("Error saving game:", error);
      }
      setSaving(false);
    }
  }, [game, saving]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      saveCurrentGame();
    }, 1000);
    return () => clearTimeout(timeout);
  }, [game]);

  const toggleLock = () => {
    if (!game) return;
    setGame({
      ...game,
      isLocked: !game.isLocked,
    });
    setLockModalVisible(false);
    Haptics.notificationAsync(
      game.isLocked ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning
    );
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerNav}>
          <Pressable
            onPress={() => {
              if (currentBoardNumber > 1) {
                setCurrentBoardNumber((n) => n - 1);
                Haptics.selectionAsync();
              }
            }}
            disabled={currentBoardNumber <= 1}
            style={{ opacity: currentBoardNumber <= 1 ? 0.3 : 1 }}
          >
            <Feather name="chevron-left" size={20} color={theme.text} />
          </Pressable>
          <Pressable onPress={() => setBoardJumpVisible(true)} style={styles.headerCenter}>
            <ThemedText type="body" style={{ fontWeight: "600" }}>
              Board {currentBoardNumber}
            </ThemedText>
            {currentBoard ? (
              <View style={styles.headerInfo}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {currentBoard.dealer} deals
                </ThemedText>
                <View style={[styles.headerDot, { backgroundColor: theme.textSecondary }]} />
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Vul: {currentBoard.vulnerability}
                </ThemedText>
              </View>
            ) : null}
          </Pressable>
          <Pressable
            onPress={() => {
              if (game && currentBoardNumber < game.numberOfBoards) {
                setCurrentBoardNumber((n) => n + 1);
                Haptics.selectionAsync();
              }
            }}
            disabled={!game || currentBoardNumber >= game.numberOfBoards}
            style={{ opacity: !game || currentBoardNumber >= game.numberOfBoards ? 0.3 : 1 }}
          >
            <Feather name="chevron-right" size={20} color={theme.text} />
          </Pressable>
        </View>
      ),
      headerLeft: () => (
        <HeaderButton onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </HeaderButton>
      ),
      headerRight: () => (
        <View style={{ flexDirection: "row", gap: Spacing.sm }}>
          <HeaderButton onPress={() => setPbnImportVisible(true)}>
            <Feather name="download" size={22} color={theme.link} />
          </HeaderButton>
          <HeaderButton onPress={() => setLockModalVisible(true)}>
            <Feather
              name={game?.isLocked ? "lock" : "unlock"}
              size={22}
              color={game?.isLocked ? theme.alertActive : theme.text}
            />
          </HeaderButton>
        </View>
      ),
    });
  }, [navigation, theme, currentBoardNumber, game, currentBoard]);

  const updateBoard = (updater: (board: Board) => Board) => {
    if (!game || !currentBoard) return;
    setGame({
      ...game,
      boards: game.boards.map((b) =>
        b.number === currentBoardNumber ? updater(b) : b
      ),
    });
  };

  const getNextPosition = (): Position => {
    if (!currentBoard) return "N";
    const bidCount = currentBoard.bids.length;
    const dealerIndex = POSITIONS.indexOf(currentBoard.dealer);
    return POSITIONS[(dealerIndex + bidCount) % 4];
  };

  const canDouble = (): boolean => {
    if (!currentBoard || currentBoard.bids.length === 0) return false;
    const lastBid = [...currentBoard.bids].reverse().find(
      (b) => b.level && b.suit
    );
    if (!lastBid) return false;
    const lastNonPass = [...currentBoard.bids].reverse().find(
      (b) => b.special !== "Pass"
    );
    return lastNonPass === lastBid;
  };

  const canRedouble = (): boolean => {
    if (!currentBoard || currentBoard.bids.length === 0) return false;
    const lastNonPass = [...currentBoard.bids].reverse().find(
      (b) => b.special !== "Pass"
    );
    return lastNonPass?.special === "X";
  };

  const addBid = (bid: Partial<Bid>) => {
    if (!currentBoard) return;
    
    const newBid: Bid = {
      id: uuidv4(),
      position: getNextPosition(),
      ...bid,
    };

    updateBoard((b) => ({
      ...b,
      bids: [...b.bids, newBid],
    }));
    setSelectedLevel(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleSuitPress = (suit: Suit) => {
    if (selectedLevel) {
      addBid({ level: selectedLevel, suit });
    }
  };

  const handleBidPress = (bid: Bid) => {
    if (game?.isLocked) return;
    setAlertBid(bid);
    setAlertModalVisible(true);
  };

  const handleAlertSave = (text: string) => {
    if (!alertBid || !currentBoard) return;
    updateBoard((b) => ({
      ...b,
      bids: b.bids.map((bid) =>
        bid.id === alertBid.id ? { ...bid, alertText: text } : bid
      ),
    }));
    setAlertBid(null);
  };

  const handleUndoBid = () => {
    if (!currentBoard || currentBoard.bids.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateBoard((b) => ({
      ...b,
      bids: b.bids.slice(0, -1),
    }));
  };

  if (!game || !currentBoard) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText type="body">Loading...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.contentContainer,
        {
          paddingTop: headerHeight + Spacing.md,
          paddingBottom: insets.bottom + Spacing["3xl"],
        },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.biddingPanel}>
        <View
          style={styles.biddingInputPanel}
        >
          <View style={[styles.levelRow, game.isLocked && styles.lockedSection]}>
            {LEVELS.map((level) => (
              <BidButton
                key={level}
                label={String(level)}
                onPress={() => {
                  setSelectedLevel(level === selectedLevel ? null : level);
                  Haptics.selectionAsync();
                }}
                selected={selectedLevel === level}
                disabled={game.isLocked}
              />
            ))}
          </View>

          <View style={[styles.suitRow, game.isLocked && styles.lockedSection]}>
            {SUITS.map((suit) => (
              <BidButton
                key={suit}
                label={getSuitSymbol(suit)}
                onPress={() => handleSuitPress(suit)}
                color={getSuitColor(suit, isDark)}
                size="large"
                disabled={!selectedLevel || game.isLocked}
              />
            ))}
          </View>

          <View style={[styles.specialRow, game.isLocked && styles.lockedSection]}>
            <Pressable
              onPress={() => addBid({ special: "Pass" })}
              disabled={game.isLocked}
              style={[
                styles.specialButton,
                { backgroundColor: theme.pass + "20", borderColor: theme.pass },
                game.isLocked && { opacity: 0.4 },
              ]}
            >
              <ThemedText type="body" style={{ color: theme.pass, fontWeight: "600" }}>
                Pass
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => addBid({ special: "X" })}
              disabled={!canDouble() || game.isLocked}
              style={[
                styles.specialButton,
                {
                  backgroundColor: theme.double + "20",
                  borderColor: theme.double,
                  opacity: canDouble() && !game.isLocked ? 1 : 0.4,
                },
              ]}
            >
              <ThemedText type="body" style={{ color: theme.double, fontWeight: "600" }}>
                X
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => addBid({ special: "XX" })}
              disabled={!canRedouble() || game.isLocked}
              style={[
                styles.specialButton,
                {
                  backgroundColor: theme.redouble + "20",
                  borderColor: theme.redouble,
                  opacity: canRedouble() && !game.isLocked ? 1 : 0.4,
                },
              ]}
            >
              <ThemedText type="body" style={{ color: theme.redouble, fontWeight: "600" }}>
                XX
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={handleUndoBid}
              disabled={currentBoard.bids.length === 0 || game.isLocked}
              style={[
                styles.undoButton,
                {
                  backgroundColor: theme.backgroundDefault,
                  borderColor: theme.border,
                  opacity: (currentBoard.bids.length === 0 || game.isLocked) ? 0.4 : 1,
                  width: 44,
                  height: Spacing.inputHeight,
                  justifyContent: 'center',
                  alignItems: 'center',
                },
              ]}
            >
              <Feather name="corner-up-left" size={20} color={theme.textSecondary} />
            </Pressable>
          </View>
        </View>
      </View>

      {game.isLocked ? (
        <View style={[styles.lockedBanner, { backgroundColor: theme.alertActive + "15", borderColor: theme.alertActive }]}>
          <Feather name="lock" size={16} color={theme.alertActive} />
          <ThemedText type="small" style={{ color: theme.alertActive, fontWeight: "500" }}>
            Bidding is locked. Tap the lock icon to unlock.
          </ThemedText>
        </View>
      ) : null}

      <BiddingTable
        bids={currentBoard.bids}
        dealer={currentBoard.dealer}
        onBidPress={handleBidPress}
        minRows={4}
      />

      {currentBoard.bids.some((b) => b.alertText) ? (
        <View style={styles.alertsSection}>
          <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
            Alerts
          </ThemedText>
          {currentBoard.bids
            .filter((b) => b.alertText)
            .map((bid) => (
              <Pressable
                key={bid.id}
                onPress={() => {
                  setAlertBid(bid);
                  setAlertModalVisible(true);
                }}
                style={[
                  styles.alertItem,
                  { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
                ]}
              >
                <View style={[styles.alertBadge, { backgroundColor: theme.alertActive }]}>
                  <ThemedText style={{ color: "#FFFFFF", fontWeight: "600" }}>
                    {formatBid(bid)}
                  </ThemedText>
                </View>
                <ThemedText type="body" style={{ flex: 1 }}>
                  {bid.alertText}
                </ThemedText>
                <Feather name="edit-2" size={16} color={theme.textSecondary} />
              </Pressable>
            ))}
        </View>
      ) : null}

      <View style={[styles.notesSection, game.isLocked && styles.lockedSection]}>
        <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          Notes
        </ThemedText>
        <TextInput
          value={currentBoard.notes}
          onChangeText={(text) => updateBoard((b) => ({ ...b, notes: text }))}
          placeholder="Add notes about this board..."
          placeholderTextColor={theme.textSecondary}
          multiline
          editable={!game.isLocked}
          style={[
            styles.notesInput,
            {
              backgroundColor: theme.backgroundDefault,
              borderColor: theme.border,
              color: theme.text,
            },
            game.isLocked && { opacity: 0.6 },
          ]}
        />
      </View>

      <View style={[styles.resultSection, game.isLocked && styles.lockedSection]}>
        <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          Result
        </ThemedText>
        
        <View style={styles.compactResultRow}>
          <TricksPicker
            value={currentBoard.result.tricksTaken}
            onChange={(tricks) => {
              updateBoard((b) => ({
                ...b,
                result: { ...b.result, tricksTaken: tricks },
              }));
            }}
            disabled={game.isLocked}
          />

          <LeadCardPicker
            value={currentBoard.result.leadCard}
            onChange={(card) =>
              updateBoard((b) => ({
                ...b,
                result: { ...b.result, leadCard: card },
              }))
            }
            disabled={game.isLocked}
          />

          <View style={styles.compactScoreField}>
            <TextInput
              value={currentBoard.result.score || ""}
              onChangeText={(text) =>
                updateBoard((b) => ({
                  ...b,
                  result: { ...b.result, score: text },
                }))
              }
              placeholder="Score"
              placeholderTextColor={theme.textSecondary}
              keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "default"}
              editable={!game.isLocked}
              style={[
                styles.compactScoreInput,
                {
                  backgroundColor: theme.backgroundDefault,
                  borderColor: theme.border,
                  color: theme.text,
                },
                game.isLocked && { opacity: 0.6 },
              ]}
            />
          </View>
        </View>
      </View>

      <AlertModal
        visible={alertModalVisible}
        bid={alertBid}
        onClose={() => {
          setAlertModalVisible(false);
          setAlertBid(null);
        }}
        onSave={handleAlertSave}
      />

      <BoardJumpModal
        visible={boardJumpVisible}
        currentBoard={currentBoardNumber}
        totalBoards={game.numberOfBoards}
        onClose={() => setBoardJumpVisible(false)}
        onSelect={setCurrentBoardNumber}
      />

      <LockConfirmModal
        visible={lockModalVisible}
        isLocked={game.isLocked || false}
        onClose={() => setLockModalVisible(false)}
        onConfirm={toggleLock}
      />

      <PBNImportModal
        visible={pbnImportVisible}
        game={game}
        onClose={() => setPbnImportVisible(false)}
        onMerge={(updatedGame) => {
          setGame(updatedGame);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }}
      />

      {currentBoard.hands ? (
        <View style={styles.handSection}>
          <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
            Hand Record
          </ThemedText>
          <HandDisplay hands={currentBoard.hands} compact />
        </View>
      ) : null}

      {currentBoard.doubleDummy ? (
        <View style={styles.ddSection}>
          <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
            Double Dummy Analysis
          </ThemedText>
          <DoubleDummyTable doubleDummy={currentBoard.doubleDummy} />
        </View>
      ) : null}
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  headerCenter: {
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
  },
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: 2,
  },
  headerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  biddingTable: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
  },
  tableHeaderCell: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
  },
  tableRow: {
    flexDirection: "row",
    borderTopWidth: 1,
  },
  tableCell: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 36,
  },
  bidCellContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  bidText: {
    fontWeight: "600",
    fontSize: 14,
  },
  alertIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
  },
  alertIndicatorText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  biddingPanel: {
    gap: Spacing.sm,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  panelActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  alertButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
  },
  undoButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
  },
  sectionLabel: {
    fontWeight: "500",
    marginBottom: Spacing.xs,
  },
  biddingInputPanel: {
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  levelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  suitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  specialRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  bidButton: {
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  bidButtonText: {},
  specialButton: {
    flex: 1,
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  alertsSection: {
    gap: Spacing.sm,
  },
  alertItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.md,
  },
  alertBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  notesSection: {
    gap: Spacing.sm,
  },
  notesInput: {
    minHeight: 80,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    fontSize: 16,
    textAlignVertical: "top",
  },
  resultSection: {
    gap: Spacing.md,
  },
  resultRow: {
    gap: Spacing.sm,
  },
  resultField: {
    gap: Spacing.sm,
  },
  tricksRow: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  tricksButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  leadCardPicker: {
    gap: Spacing.sm,
  },
  leadCardRow: {},
  leadCardButtons: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  leadCardButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  leadCardSuits: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  leadSuitButton: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scoreField: {
    gap: Spacing.sm,
  },
  scoreInput: {
    height: Spacing.inputHeight,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
  },
  boardJumpButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  alertModal: {
    width: "85%",
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  alertModalTitle: {
    textAlign: "center",
  },
  alertInput: {
    minHeight: 100,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    fontSize: 16,
    textAlignVertical: "top",
  },
  alertModalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  alertModalButton: {
    flex: 1,
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  boardJumpModal: {
    width: "85%",
    maxHeight: "70%",
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  boardJumpTitle: {
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  boardJumpScroll: {
    maxHeight: 300,
  },
  boardJumpGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    justifyContent: "center",
  },
  compactResultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  tricksPicker: {
    flex: 2,
  },
  compactTricksContainer: {
    paddingRight: Spacing.sm,
  },
  compactTricksButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.xs,
  },
  compactTricksPicker: {
    flex: 1,
  },
  tricksDisplay: {
    height: 36,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  pickerModalContent: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingBottom: 34,
  },
  pickerModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128, 128, 128, 0.2)",
  },
  compactLeadPicker: {
    flex: 1,
  },
  leadCardDisplay: {
    height: 36,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedLeadCard: {
    flexDirection: "row",
    alignItems: "center",
  },
  compactPickerModal: {
    width: "90%",
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rankGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    justifyContent: "center",
  },
  suitGrid: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  gridItem: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  doneButton: {
    height: 48,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.md,
  },
  compactScoreField: {
    flex: 1.5,
  },
  compactScoreInput: {
    height: 36,
    borderWidth: 1,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.sm,
    fontSize: 14,
  },
  lockModal: {
    width: "85%",
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    gap: Spacing.lg,
    alignItems: "center",
  },
  lockModalIcon: {
    marginBottom: Spacing.sm,
  },
  lockModalTitle: {
    textAlign: "center",
  },
  lockModalDescription: {
    textAlign: "center",
    lineHeight: 22,
  },
  lockModalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    width: "100%",
  },
  lockModalButton: {
    flex: 1,
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  lockedSection: {
    opacity: 0.5,
  },
  lockedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  handSection: {
    gap: Spacing.sm,
  },
  ddSection: {
    gap: Spacing.sm,
  },
});
