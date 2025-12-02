'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useAuthStore } from '@/store/authStore';
import { statsApi } from '@/lib/api';
import type { Stats } from '@/types';

export default function StatsPage() {
  const router = useRouter();
  const { isAuthenticated, hydrated } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState<number>(new Date().getFullYear());

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
      const statsData = await statsApi.getSummary();
      setStats(statsData);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Statistiques</h1>
          <p className="text-gray-600 mt-2">
            Analyses et comparaisons des performances de chasse
          </p>
        </div>

        {/* Statistiques globales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500">Chasseurs</h3>
            <p className="text-3xl font-bold text-forest-700 mt-2">{stats.total_hunters}</p>
          </div>
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500">Total Gibiers</h3>
            <p className="text-3xl font-bold text-forest-700 mt-2">{stats.total_games}</p>
          </div>
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500">Cartouches Utilisées</h3>
            <p className="text-3xl font-bold text-forest-700 mt-2">{stats.total_cartridges_used}</p>
          </div>
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500">Efficacité Moyenne</h3>
            <p className="text-3xl font-bold text-forest-700 mt-2">
              {stats.average_efficiency.toFixed(1)}
            </p>
          </div>
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500">Dépenses Totales</h3>
            <p className="text-3xl font-bold text-forest-700 mt-2">
              {stats.total_spent.toFixed(0)}€
            </p>
          </div>
        </div>

        {/* Classement des chasseurs */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Classement des Chasseurs
          </h2>
          <div className="space-y-3">
            {stats.top_hunters.map((hunter, index) => (
              <div key={hunter.hunter_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`text-2xl w-10 text-center ${
                    index === 0 ? 'text-yellow-500' :
                    index === 1 ? 'text-gray-400' :
                    index === 2 ? 'text-orange-600' : 'text-gray-500'
                  }`}>
                    {index < 3 ? (
                      index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'
                    ) : (
                      `#${index + 1}`
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{hunter.hunter_name}</p>
                    <p className="text-sm text-gray-500">
                      {hunter.total_games} gibiers · {hunter.total_cartridges_used} cartouches
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-forest-700">
                    Efficacité: {hunter.efficiency_ratio.toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {hunter.total_spent.toFixed(2)}€ dépensés
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Distribution par espèce */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Distribution par Espèce
          </h2>
          <div className="space-y-4">
            {stats.species_distribution.map((species) => {
              const percentage = (species.total_killed / stats.total_games) * 100;
              return (
                <div key={species.species_name}>
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="font-medium text-gray-900">{species.species_name}</span>
                      <span className="ml-2 text-sm text-gray-500">
                        ({species.total_killed} tués)
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-forest-700">
                        {percentage.toFixed(1)}%
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        {species.average_cartridges_per_kill.toFixed(1)} cart/gibier
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-forest-600 h-3 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Évolution sur les 5 dernières saisons */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Évolution sur les 5 Dernières Saisons
          </h2>
          {stats.last_5_seasons.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Pas assez de données pour afficher l'évolution
            </p>
          ) : (
            <div className="space-y-4">
              {stats.last_5_seasons.map((season) => (
                <div key={season.season_name} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-gray-900">
                      Saison {season.season_name}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {season.total_games} gibiers · {season.total_cartridges_used} cartouches
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-3">
                    {season.hunters_stats.slice(0, 3).map((hunter) => (
                      <div key={hunter.hunter_id} className="text-center p-2 bg-white rounded">
                        <p className="text-xs text-gray-500">{hunter.hunter_name}</p>
                        <p className="text-lg font-bold text-forest-700">{hunter.total_games}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Note pour les graphiques */}
        <div className="card bg-blue-50 border border-blue-200">
          <h3 className="font-medium text-blue-900 mb-2">
            📊 Graphiques Interactifs
          </h3>
          <p className="text-sm text-blue-700">
            Les graphiques avec Recharts peuvent être ajoutés ici pour visualiser :
            l'évolution temporelle, les comparaisons entre chasseurs, et les ratios d'efficacité.
          </p>
        </div>
      </div>
    </Layout>
  );
}
