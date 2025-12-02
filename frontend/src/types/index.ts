// Types pour les utilisateurs
export interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: 'admin' | 'chasseur';
  created_at: string;
}

export interface UserCreate {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  role?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

// Types pour les cartouches
export type ChargeType = 'Normal' | 'Super' | 'Magnum';
export type PelletSize = '2' | '3' | '4' | '5' | '6' | '6.5' | '7' | '7.5' | '8';

export interface CartridgeType {
  id: string;
  charge_type: ChargeType;
  pellet_size: PelletSize;
  brand: string;
  created_at: string;
}

export interface CartridgePurchase {
  id: string;
  hunter_id: string;
  cartridge_type_id: string;
  cartridge_type: CartridgeType;
  quantity: number;
  unit_price: number;
  total_price: number;
  purchase_date: string;
  created_at: string;
}

export interface CartridgeUsage {
  id: string;
  hunter_id: string;
  cartridge_type_id: string;
  cartridge_type: CartridgeType;
  quantity: number;
  usage_date: string;
  game_id?: string;
  created_at: string;
}

export interface CartridgeStock {
  cartridge_type: CartridgeType;
  hunter_id: string;
  total_purchased: number;
  total_used: number;
  current_stock: number;
  is_low_stock: boolean;
}

// Types pour les gibiers
export type GameSex = 'Mâle' | 'Femelle';

export interface GameSpecies {
  id: string;
  name: string;
  created_at: string;
}

export interface GameCartridge {
  id: string;
  cartridge_type_id: string;
  quantity: number;
  cartridge_type: CartridgeType;
}

export interface Game {
  id: string;
  hunter_id: string;
  species_id: string;
  species: GameSpecies;
  kill_date: string;
  weight?: number;
  sex?: GameSex;
  location?: string;
  game_cartridges: GameCartridge[];
  created_at: string;
}

export interface GameCreate {
  hunter_id: string;
  species_id: string;
  kill_date: string;
  weight?: number;
  sex?: GameSex;
  location?: string;
  cartridges: {
    cartridge_type_id: string;
    quantity: number;
  }[];
}

// Types pour les statistiques
export interface HunterStats {
  hunter_id: string;
  hunter_name: string;
  total_games: number;
  total_cartridges_used: number;
  total_cartridges_purchased: number;
  total_spent: number;
  efficiency_ratio: number;
  games_by_species: Record<string, number>;
}

export interface SpeciesStats {
  species_name: string;
  total_killed: number;
  average_cartridges_per_kill: number;
  hunters_count: number;
}

export interface SeasonStats {
  season_name: string;
  year_start: number;
  total_games: number;
  total_cartridges_used: number;
  hunters_stats: HunterStats[];
  species_stats: SpeciesStats[];
}

export interface EfficiencyStats {
  hunter_id: string;
  hunter_name: string;
  total_cartridges: number;
  total_games: number;
  efficiency_ratio: number;
  best_species?: string;
  worst_species?: string;
}

export interface Stats {
  total_hunters: number;
  total_games: number;
  total_cartridges_used: number;
  total_cartridges_purchased: number;
  total_spent: number;
  average_efficiency: number;
  top_hunters: HunterStats[];
  species_distribution: SpeciesStats[];
  last_5_seasons: SeasonStats[];
}
