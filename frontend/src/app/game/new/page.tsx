'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import Layout from '@/components/Layout';
import { useAuthStore } from '@/store/authStore';
import { gameApi, cartridgesApi } from '@/lib/api';
import type { GameSpecies, CartridgeType, GameCreate, CartridgeStock } from '@/types';

interface GameFormData {
  hunter_id: string;
  species_id: string;
  kill_date: string;
  weight?: number;
  sex?: string;
  location?: string;
  cartridges: {
    cartridge_type_id: string;
    quantity: number;
  }[];
}

export default function NewGamePage() {
  const router = useRouter();
  const { isAuthenticated, user, hydrated } = useAuthStore();
  const [species, setSpecies] = useState<GameSpecies[]>([]);
  const [myStock, setMyStock] = useState<CartridgeStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, control, formState: { errors } } = useForm<GameFormData>({
    defaultValues: {
      hunter_id: user?.id || '',
      species_id: '',
      kill_date: new Date().toISOString().split('T')[0],
      weight: undefined,
      sex: '',
      location: '',
      cartridges: [{ cartridge_type_id: '', quantity: 1 }],
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'cartridges',
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
      const [speciesData, stockData] = await Promise.all([
        gameApi.getSpecies(),
        cartridgesApi.getStock(user?.id),
      ]);

      setSpecies(speciesData);
      setMyStock(stockData.filter(s => s.current_stock > 0)); // Seulement les cartouches en stock
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: GameFormData) => {
    setSubmitting(true);
    setError(null);

    try {
      // Filtrer les cartouches vides
      const validCartridges = data.cartridges.filter(
        c => c.cartridge_type_id && c.quantity > 0
      );

      if (validCartridges.length === 0) {
        setError('Veuillez ajouter au moins une cartouche utilisée');
        setSubmitting(false);
        return;
      }

      const gameData: GameCreate = {
        hunter_id: data.hunter_id,
        species_id: data.species_id,
        kill_date: new Date(data.kill_date).toISOString(),
        weight: data.weight || undefined,
        sex: data.sex || undefined,
        location: data.location || undefined,
        cartridges: validCartridges,
      };

      await gameApi.createGame(gameData);
      router.push('/game');
    } catch (err: any) {
      console.error('Erreur lors de l\'enregistrement:', err);
      setError(err.response?.data?.detail || 'Erreur lors de l\'enregistrement du gibier');
    } finally {
      setSubmitting(false);
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
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-forest-600 hover:text-forest-800 flex items-center gap-2 mb-4"
          >
            ← Retour
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Enregistrer un Gibier</h1>
          <p className="text-gray-600 mt-2">
            Remplissez les informations de votre prise
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Informations principales */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Informations du Gibier
            </h2>

            <div className="space-y-4">
              {/* Espèce */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Espèce *
                </label>
                <select
                  {...register('species_id', { required: 'Espèce requise' })}
                  className="input"
                >
                  <option value="">Sélectionner une espèce</option>
                  {species.map((sp) => (
                    <option key={sp.id} value={sp.id}>
                      {sp.name}
                    </option>
                  ))}
                </select>
                {errors.species_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.species_id.message}</p>
                )}
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de la Prise *
                </label>
                <input
                  type="date"
                  {...register('kill_date', { required: 'Date requise' })}
                  className="input"
                />
                {errors.kill_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.kill_date.message}</p>
                )}
              </div>

              {/* Poids */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Poids (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  {...register('weight', {
                    min: { value: 0.1, message: 'Poids minimum 0.1 kg' }
                  })}
                  className="input"
                  placeholder="Ex: 1.5"
                />
                {errors.weight && (
                  <p className="mt-1 text-sm text-red-600">{errors.weight.message}</p>
                )}
              </div>

              {/* Sexe */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sexe
                </label>
                <select {...register('sex')} className="input">
                  <option value="">Non spécifié</option>
                  <option value="Mâle">Mâle</option>
                  <option value="Femelle">Femelle</option>
                </select>
              </div>

              {/* Lieu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lieu
                </label>
                <input
                  type="text"
                  {...register('location', {
                    maxLength: { value: 255, message: 'Maximum 255 caractères' }
                  })}
                  className="input"
                  placeholder="Ex: Forêt de Rambouillet"
                />
                {errors.location && (
                  <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Cartouches utilisées */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Cartouches Utilisées *
              </h2>
              <button
                type="button"
                onClick={() => append({ cartridge_type_id: '', quantity: 1 })}
                className="text-sm text-forest-600 hover:text-forest-800 font-medium"
              >
                + Ajouter
              </button>
            </div>

            {myStock.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">
                  Vous n'avez aucune cartouche en stock. Veuillez d'abord enregistrer un achat de cartouches.
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/cartridges')}
                  className="btn-primary"
                >
                  Aller aux Cartouches
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {fields.map((field, index) => {
                    const selectedTypeId = field.cartridge_type_id;
                    const stockItem = myStock.find(s => s.cartridge_type.id === selectedTypeId);
                    const maxQuantity = stockItem?.current_stock || 0;

                    return (
                      <div key={field.id} className="flex gap-3 items-start">
                        <div className="flex-1">
                          <select
                            {...register(`cartridges.${index}.cartridge_type_id`, {
                              required: 'Type requis'
                            })}
                            className="input"
                          >
                            <option value="">Sélectionner un type</option>
                            {myStock.map((stock) => (
                              <option key={stock.cartridge_type.id} value={stock.cartridge_type.id}>
                                {stock.cartridge_type.brand} - {stock.cartridge_type.charge_type} -
                                Plomb {stock.cartridge_type.pellet_size} (Stock: {stock.current_stock})
                              </option>
                            ))}
                          </select>
                          {errors.cartridges?.[index]?.cartridge_type_id && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.cartridges[index]?.cartridge_type_id?.message}
                            </p>
                          )}
                        </div>

                        <div className="w-24">
                          <input
                            type="number"
                            {...register(`cartridges.${index}.quantity`, {
                              required: 'Quantité requise',
                              min: { value: 1, message: 'Min 1' },
                              max: maxQuantity > 0 ? { value: maxQuantity, message: `Max ${maxQuantity}` } : undefined
                            })}
                            className="input"
                            placeholder="Qté"
                          />
                          {errors.cartridges?.[index]?.quantity && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.cartridges[index]?.quantity?.message}
                            </p>
                          )}
                        </div>

                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="mt-2 text-red-600 hover:text-red-800"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <p className="mt-3 text-sm text-gray-500">
                  Seules vos cartouches en stock sont disponibles. Les quantités utilisées seront automatiquement déduites.
                </p>
              </>
            )}
          </div>

          {/* Boutons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary"
              disabled={submitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Enregistrement...' : 'Enregistrer le Gibier'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
