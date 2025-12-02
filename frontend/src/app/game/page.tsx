'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useAuthStore } from '@/store/authStore';
import { gameApi, huntersApi } from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Game, GameSpecies, User } from '@/types';

export default function GamePage() {
  const router = useRouter();
  const { isAuthenticated, hydrated } = useAuthStore();
  const [games, setGames] = useState<Game[]>([]);
  const [species, setSpecies] = useState<GameSpecies[]>([]);
  const [hunters, setHunters] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    hunter_id: '',
    species_id: '',
  });

  useEffect(() => {
    // Attendre que le store soit hydraté avant de vérifier l'authentification
    if (!hydrated) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadData();
  }, [isAuthenticated, hydrated, router]);

  const loadData = async () => {
    try {
      const [gamesData, speciesData, huntersData] = await Promise.all([
        gameApi.getGames(),
        gameApi.getSpecies(),
        huntersApi.getHunters(),
      ]);

      setGames(gamesData);
      setSpecies(speciesData);
      setHunters(huntersData);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = async () => {
    try {
      const filterParams: any = {};
      if (filters.hunter_id) filterParams.hunter_id = filters.hunter_id;
      if (filters.species_id) filterParams.species_id = filters.species_id;

      const gamesData = await gameApi.getGames(filterParams);
      setGames(gamesData);
    } catch (error) {
      console.error('Erreur lors du filtrage:', error);
    }
  };

  const handleDelete = async (gameId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce gibier ?')) {
      return;
    }

    try {
      await gameApi.deleteGame(gameId);
      setGames(games.filter(g => g.id !== gameId));
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mes Prises</h1>
            <p className="text-gray-600 mt-2">
              Consultez et gérez votre carnet de chasse
            </p>
          </div>
          <button
            onClick={() => router.push('/game/new')}
            className="btn-primary"
          >
            + Enregistrer un Gibier
          </button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500">Total Gibiers</h3>
            <p className="text-3xl font-bold text-forest-700 mt-2">{games.length}</p>
          </div>
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500">Cette Saison</h3>
            <p className="text-3xl font-bold text-forest-700 mt-2">
              {games.filter(g => {
                const date = new Date(g.kill_date);
                const currentYear = new Date().getFullYear();
                return date.getFullYear() === currentYear;
              }).length}
            </p>
          </div>
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500">Espèces Différentes</h3>
            <p className="text-3xl font-bold text-forest-700 mt-2">
              {new Set(games.map(g => g.species_id)).size}
            </p>
          </div>
        </div>

        {/* Filtres */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtres</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chasseur
              </label>
              <select
                value={filters.hunter_id}
                onChange={(e) => setFilters({ ...filters, hunter_id: e.target.value })}
                className="input"
              >
                <option value="">Tous</option>
                {hunters.map((hunter) => (
                  <option key={hunter.id} value={hunter.id}>
                    {hunter.prenom} {hunter.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Espèce
              </label>
              <select
                value={filters.species_id}
                onChange={(e) => setFilters({ ...filters, species_id: e.target.value })}
                className="input"
              >
                <option value="">Toutes</option>
                {species.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleFilterChange}
                className="btn-primary w-full"
              >
                Filtrer
              </button>
            </div>
          </div>
        </div>

        {/* Liste des gibiers */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Liste des Gibiers ({games.length})
          </h2>
          {games.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Aucun gibier enregistré. Commencez par ajouter votre première prise !
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Espèce</th>
                    <th>Chasseur</th>
                    <th>Poids</th>
                    <th>Sexe</th>
                    <th>Lieu</th>
                    <th>Cartouches</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {games.map((game) => {
                    const hunter = hunters.find(h => h.id === game.hunter_id);
                    const totalCartridges = game.game_cartridges.reduce(
                      (sum, gc) => sum + gc.quantity,
                      0
                    );

                    return (
                      <tr key={game.id}>
                        <td>
                          {format(new Date(game.kill_date), 'dd MMM yyyy', { locale: fr })}
                        </td>
                        <td>
                          <span className="px-2 py-1 text-xs font-medium bg-forest-100 text-forest-800 rounded">
                            {game.species.name}
                          </span>
                        </td>
                        <td className="font-medium">
                          {hunter ? `${hunter.prenom} ${hunter.nom}` : '-'}
                        </td>
                        <td>{game.weight ? `${game.weight} kg` : '-'}</td>
                        <td>{game.sex || '-'}</td>
                        <td className="max-w-xs truncate">{game.location || '-'}</td>
                        <td>{totalCartridges}</td>
                        <td>
                          <button
                            onClick={() => handleDelete(game.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
