import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import GameListScreen from "@/screens/GameListScreen";
import CreateGameScreen from "@/screens/CreateGameScreen";
import BiddingEntryScreen from "@/screens/BiddingEntryScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { HeaderTitle } from "@/components/HeaderTitle";

export type RootStackParamList = {
  GameList: undefined;
  CreateGame: undefined;
  BiddingEntry: { gameId: string; boardNumber?: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="GameList"
        component={GameListScreen}
        options={{
          headerTitle: () => <HeaderTitle title="My Games" />,
        }}
      />
      <Stack.Screen
        name="CreateGame"
        component={CreateGameScreen}
        options={{
          headerTitle: "New Game",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="BiddingEntry"
        component={BiddingEntryScreen}
        options={{
          headerTitle: "Bidding",
        }}
      />
    </Stack.Navigator>
  );
}
