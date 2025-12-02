import axios from 'axios';
import type {
  AuthResponse,
  LoginCredentials,
  UserCreate,
  User,
  CartridgeType,
  CartridgePurchase,
  CartridgeUsage,
  CartridgeStock,
  GameSpecies,
  Game,
  GameCreate,
  Stats,
  HunterStats,
  SpeciesStats,
  SeasonStats,
  EfficiencyStats,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Créer l'instance axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token aux requêtes
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Intercepteur pour gérer les erreurs d'authentification
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expiré, déconnecter l'utilisateur
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/login', credentials);
    return data;
  },

  register: async (userData: UserCreate): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/register', userData);
    return data;
  },

  getMe: async (): Promise<User> => {
    const { data } = await api.get('/auth/me');
    return data;
  },
};

// Cartridges API
export const cartridgesApi = {
  getTypes: async (): Promise<CartridgeType[]> => {
    const { data } = await api.get('/cartridges/types');
    return data;
  },

  createType: async (typeData: Omit<CartridgeType, 'id' | 'created_at'>): Promise<CartridgeType> => {
    const { data } = await api.post('/cartridges/types', typeData);
    return data;
  },

  getStock: async (hunterId?: string, chargeType?: string, pelletSize?: string): Promise<CartridgeStock[]> => {
    const params = new URLSearchParams();
    if (hunterId) params.append('hunter_id', hunterId);
    if (chargeType) params.append('charge_type', chargeType);
    if (pelletSize) params.append('pellet_size', pelletSize);

    const { data } = await api.get(`/cartridges/stock?${params.toString()}`);
    return data;
  },

  createPurchase: async (purchaseData: any): Promise<CartridgePurchase> => {
    const { data } = await api.post('/cartridges/purchase', purchaseData);
    return data;
  },

  createUsage: async (usageData: any): Promise<CartridgeUsage> => {
    const { data } = await api.post('/cartridges/use', usageData);
    return data;
  },

  getHistory: async (hunterId?: string, startDate?: string, endDate?: string): Promise<any[]> => {
    const params = new URLSearchParams();
    if (hunterId) params.append('hunter_id', hunterId);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const { data } = await api.get(`/cartridges/history?${params.toString()}`);
    return data;
  },

  transferCartridges: async (transferData: {
    from_hunter_id: string;
    to_hunter_id: string;
    cartridge_type_id: string;
    quantity: number;
    transfer_date: string;
    note?: string;
  }): Promise<any> => {
    const { data } = await api.post('/cartridges/transfer', transferData);
    return data;
  },
};

// Game API
export const gameApi = {
  getSpecies: async (): Promise<GameSpecies[]> => {
    const { data } = await api.get('/game/species');
    return data;
  },

  createSpecies: async (name: string): Promise<GameSpecies> => {
    const { data } = await api.post('/game/species', { name });
    return data;
  },

  getGames: async (filters?: {
    hunter_id?: string;
    species_id?: string;
    start_date?: string;
    end_date?: string;
    season_year?: number;
  }): Promise<Game[]> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, String(value));
      });
    }

    const { data } = await api.get(`/game?${params.toString()}`);
    return data;
  },

  getGame: async (gameId: string): Promise<Game> => {
    const { data } = await api.get(`/game/${gameId}`);
    return data;
  },

  createGame: async (gameData: GameCreate): Promise<Game> => {
    const { data } = await api.post('/game', gameData);
    return data;
  },

  updateGame: async (gameId: string, gameData: Partial<GameCreate>): Promise<Game> => {
    const { data } = await api.put(`/game/${gameId}`, gameData);
    return data;
  },

  deleteGame: async (gameId: string): Promise<void> => {
    await api.delete(`/game/${gameId}`);
  },
};

// Stats API
export const statsApi = {
  getSummary: async (): Promise<Stats> => {
    const { data } = await api.get('/stats/summary');
    return data;
  },

  getByHunter: async (seasonYear?: number): Promise<HunterStats[]> => {
    const params = seasonYear ? `?season_year=${seasonYear}` : '';
    const { data } = await api.get(`/stats/by-hunter${params}`);
    return data;
  },

  getBySpecies: async (seasonYear?: number, hunterId?: string): Promise<SpeciesStats[]> => {
    const params = new URLSearchParams();
    if (seasonYear) params.append('season_year', String(seasonYear));
    if (hunterId) params.append('hunter_id', hunterId);

    const { data } = await api.get(`/stats/by-species?${params.toString()}`);
    return data;
  },

  getBySeason: async (year: number): Promise<SeasonStats> => {
    const { data } = await api.get(`/stats/by-season/${year}`);
    return data;
  },

  getEfficiency: async (seasonYear?: number): Promise<EfficiencyStats[]> => {
    const params = seasonYear ? `?season_year=${seasonYear}` : '';
    const { data } = await api.get(`/stats/efficiency${params}`);
    return data;
  },
};

// Hunters API
export const huntersApi = {
  getHunters: async (): Promise<User[]> => {
    const { data } = await api.get('/hunters');
    return data;
  },

  getHunter: async (hunterId: string): Promise<User> => {
    const { data } = await api.get(`/hunters/${hunterId}`);
    return data;
  },

  createHunter: async (hunterData: UserCreate): Promise<User> => {
    const { data } = await api.post('/hunters', hunterData);
    return data;
  },

  updateHunter: async (hunterId: string, hunterData: Partial<UserCreate>): Promise<User> => {
    const { data } = await api.put(`/hunters/${hunterId}`, hunterData);
    return data;
  },

  deleteHunter: async (hunterId: string): Promise<void> => {
    await api.delete(`/hunters/${hunterId}`);
  },
};

export default api;
