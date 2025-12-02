'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import PurchaseForm from '@/components/PurchaseForm';
import TransferForm from '@/components/TransferForm';
import { useAuthStore } from '@/store/authStore';
import { cartridgesApi, huntersApi } from '@/lib/api';
import type { CartridgeStock, CartridgeType, User } from '@/types';

export default function CartridgesPage() {
  const router = useRouter();
  const { isAuthenticated, user, hydrated } = useAuthStore();
  const [stock, setStock] = useState<CartridgeStock[]>([]);
  const [hunters, setHunters] = useState<User[]>([]);
  const [selectedHunter, setSelectedHunter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);

  useEffect(() => {
    // Attendre que le store soit hydraté avant de vérifier l'authentification
    if (!hydrated) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    setSelectedHunter(user?.id || '');
    loadData();
  }, [isAuthenticated, hydrated, router, user]);

  const loadData = async () => {
    try {
      const [huntersData] = await Promise.all([
        huntersApi.getHunters(),
      ]);
      setHunters(huntersData);

      if (user?.id) {
        await loadStock(user.id);
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStock = async (hunterId: string) => {
    try {
      const stockData = await cartridgesApi.getStock(hunterId);
      setStock(stockData);
    } catch (error) {
      console.error('Erreur lors du chargement du stock:', error);
    }
  };

  const handleHunterChange = async (hunterId: string) => {
    setSelectedHunter(hunterId);
    await loadStock(hunterId);
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

  const lowStockCount = stock.filter(item => item.is_low_stock).length;
  const totalStock = stock.reduce((acc, item) => acc + item.current_stock, 0);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mes Cartouches</h1>
            <p className="text-gray-600 mt-2">
              Gérez vos stocks de cartouches et enregistrez vos achats
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowTransferForm(!showTransferForm);
                if (!showTransferForm) setShowPurchaseForm(false);
              }}
              className="btn-secondary"
            >
              {showTransferForm ? 'Annuler' : '↔ Donner des Cartouches'}
            </button>
            <button
              onClick={() => {
                setShowPurchaseForm(!showPurchaseForm);
                if (!showPurchaseForm) setShowTransferForm(false);
              }}
              className="btn-primary"
            >
              {showPurchaseForm ? 'Annuler' : '+ Nouvel Achat'}
            </button>
          </div>
        </div>

        {/* Sélecteur de chasseur */}
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Voir le stock de :
          </label>
          <select
            value={selectedHunter}
            onChange={(e) => handleHunterChange(e.target.value)}
            className="input max-w-md"
          >
            {hunters.map((hunter) => (
              <option key={hunter.id} value={hunter.id}>
                {hunter.prenom} {hunter.nom}
              </option>
            ))}
          </select>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500">Stock Total</h3>
            <p className="text-3xl font-bold text-forest-700 mt-2">{totalStock}</p>
          </div>
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500">Types de Cartouches</h3>
            <p className="text-3xl font-bold text-forest-700 mt-2">{stock.length}</p>
          </div>
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500">Stock Faible</h3>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{lowStockCount}</p>
          </div>
        </div>

        {/* Alerte stock faible */}
        {lowStockCount > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="ml-3 text-sm text-yellow-700">
                {lowStockCount} type(s) de cartouches avec un stock inférieur à 20
              </p>
            </div>
          </div>
        )}

        {/* Tableau du stock */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Stock Actuel</h2>
          {stock.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Aucun stock enregistré. Commencez par enregistrer un achat !
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Type de Charge</th>
                    <th>Taille Plomb</th>
                    <th>Marque</th>
                    <th>Acheté</th>
                    <th>Utilisé</th>
                    <th>Stock</th>
                    <th>État</th>
                  </tr>
                </thead>
                <tbody>
                  {stock.map((item) => (
                    <tr key={item.cartridge_type.id}>
                      <td>
                        <span className="px-2 py-1 text-xs font-medium bg-forest-100 text-forest-800 rounded">
                          {item.cartridge_type.charge_type}
                        </span>
                      </td>
                      <td>{item.cartridge_type.pellet_size}</td>
                      <td className="font-medium">{item.cartridge_type.brand}</td>
                      <td>{item.total_purchased}</td>
                      <td>{item.total_used}</td>
                      <td>
                        <span className={`font-bold ${
                          item.is_low_stock ? 'text-yellow-600' : 'text-forest-600'
                        }`}>
                          {item.current_stock}
                        </span>
                      </td>
                      <td>
                        {item.is_low_stock ? (
                          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                            Stock faible
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                            OK
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Formulaire d'achat */}
        {showPurchaseForm && (
          <PurchaseForm
            hunterId={selectedHunter}
            onSuccess={() => {
              setShowPurchaseForm(false);
              loadStock(selectedHunter);
            }}
            onCancel={() => setShowPurchaseForm(false)}
          />
        )}

        {/* Formulaire de transfert */}
        {showTransferForm && (
          <TransferForm
            fromHunterId={user?.id || ''}
            onSuccess={() => {
              setShowTransferForm(false);
              loadStock(selectedHunter);
            }}
            onCancel={() => setShowTransferForm(false)}
          />
        )}
      </div>
    </Layout>
  );
}
