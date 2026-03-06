import AsyncStorage from '@react-native-async-storage/async-storage';
import { Game } from '@/types/bridge';
import { v4 as uuidv4 } from 'uuid';

const GAMES_KEY = 'bridge_games';

export async function getAllGames(): Promise<Game[]> {
  try {
    const data = await AsyncStorage.getItem(GAMES_KEY);
    if (!data) return [];
    const games: Game[] = JSON.parse(data);
    return games.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error loading games:', error);
    return [];
  }
}

export async function getGameById(id: string): Promise<Game | null> {
  try {
    const games = await getAllGames();
    return games.find(g => g.id === id) || null;
  } catch (error) {
    console.error('Error loading game:', error);
    return null;
  }
}

export async function saveGame(game: Game): Promise<Game> {
  try {
    const games = await getAllGames();
    const newGame = { ...game, id: game.id || uuidv4() };
    
    const existingIndex = games.findIndex(g => g.id === newGame.id);
    if (existingIndex >= 0) {
      games[existingIndex] = newGame;
    } else {
      games.push(newGame);
    }
    
    await AsyncStorage.setItem(GAMES_KEY, JSON.stringify(games));
    return newGame;
  } catch (error) {
    console.error('Error saving game:', error);
    throw error;
  }
}

export async function deleteGame(id: string): Promise<void> {
  try {
    const games = await getAllGames();
    const filtered = games.filter(g => g.id !== id);
    await AsyncStorage.setItem(GAMES_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting game:', error);
    throw error;
  }
}
