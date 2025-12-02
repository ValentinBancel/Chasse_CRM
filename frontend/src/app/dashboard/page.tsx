'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useAuthStore } from '@/store/authStore';
import { statsApi, cartridgesApi, gameApi } from '@/lib/api';
import type { Stats, CartridgeStock } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user, hydrated } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [myStock, setMyStock] = useState<CartridgeStock[]>([]);
  const [loading, setLoading] = useState(true);

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
      const [statsData, stockData] = await Promise.all([
        statsApi.getSummary(),
        cartridgesApi.getStock(user?.id),
      ]);

      setStats(statsData);
      setMyStock(stockData);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
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

  const lowStockItems = myStock.filter(item => item.is_low_stock);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Tableau de bord
          </h1>
          <p className="text-gray-600 mt-2">
            Vue d'ensemble de vos activités de chasse
          </p>
        </div>

        {/* Alertes de stock faible */}
        {lowStockItems.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <span className="font-medium">Attention !</span> Vous avez {lowStockItems.length} type(s) de cartouches avec un stock faible (&lt; 20).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Cartes de statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              <span className="text-sm text-gray-500 ml-1">cart/gibier</span>
            </p>
          </div>

          <div className="card">
            <h3 className="text-sm font-medium text-gray-500">Dépenses Totales</h3>
            <p className="text-3xl font-bold text-forest-700 mt-2">
              {stats.total_spent.toFixed(2)}€
            </p>
          </div>
        </div>

        {/* Top 3 chasseurs */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Top 3 Chasseurs
          </h2>
          <div className="space-y-4">
            {stats.top_hunters.map((hunter, index) => (
              <div key={hunter.hunter_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`text-2xl font-bold ${
                    index === 0 ? 'text-yellow-500' :
                    index === 1 ? 'text-gray-400' :
                    'text-orange-600'
                  }`}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{hunter.hunter_name}</p>
                    <p className="text-sm text-gray-500">
                      {hunter.total_games} gibiers · Efficacité: {hunter.efficiency_ratio.toFixed(1)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{hunter.total_cartridges_used} cartouches</p>
                  <p className="text-sm text-gray-500">{hunter.total_spent.toFixed(2)}€</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Distribution par espèce */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Répartition par Espèce
          </h2>
          <div className="space-y-3">
            {stats.species_distribution.slice(0, 5).map((species) => (
              <div key={species.species_name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{species.species_name}</span>
                  <span className="text-gray-500">{species.total_killed} tués</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-forest-600 h-2 rounded-full"
                    style={{
                      width: `${(species.total_killed / stats.total_games) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => router.push('/cartridges')}
            className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
          >
            <h3 className="text-lg font-semibold text-forest-700 mb-2">
              📦 Gérer mes cartouches
            </h3>
            <p className="text-sm text-gray-600">
              Consulter le stock, enregistrer achats et utilisations
            </p>
          </button>

          <button
            onClick={() => router.push('/game')}
            className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
          >
            <h3 className="text-lg font-semibold text-forest-700 mb-2">
              🦌 Enregistrer un gibier
            </h3>
            <p className="text-sm text-gray-600">
              Ajouter une nouvelle prise à votre carnet
            </p>
          </button>

          <button
            onClick={() => router.push('/stats')}
            className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
          >
            <h3 className="text-lg font-semibold text-forest-700 mb-2">
              📊 Voir les statistiques
            </h3>
            <p className="text-sm text-gray-600">
              Analyses détaillées et comparaisons
            </p>
          </button>
        </div>
      </div>
    </Layout>
  );
}
