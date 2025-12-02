'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { cartridgesApi, huntersApi } from '@/lib/api';
import type { CartridgeStock, User } from '@/types';

interface TransferFormData {
  to_hunter_id: string;
  cartridge_type_id: string;
  quantity: number;
  transfer_date: string;
  note?: string;
}

interface TransferFormProps {
  fromHunterId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function TransferForm({ fromHunterId, onSuccess, onCancel }: TransferFormProps) {
  const [myStock, setMyStock] = useState<CartridgeStock[]>([]);
  const [hunters, setHunters] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<TransferFormData>({
    defaultValues: {
      to_hunter_id: '',
      cartridge_type_id: '',
      quantity: 1,
      transfer_date: new Date().toISOString().split('T')[0],
      note: '',
    }
  });

  const selectedCartridgeTypeId = watch('cartridge_type_id');
  const selectedStock = myStock.find(s => s.cartridge_type.id === selectedCartridgeTypeId);
  const maxQuantity = selectedStock?.current_stock || 0;

  useEffect(() => {
    loadData();
  }, [fromHunterId]);

  const loadData = async () => {
    try {
      const [stockData, huntersData] = await Promise.all([
        cartridgesApi.getStock(fromHunterId),
        huntersApi.getHunters(),
      ]);

      // Seulement les cartouches en stock
      setMyStock(stockData.filter(s => s.current_stock > 0));
      // Exclure le chasseur actuel de la liste
      setHunters(huntersData.filter(h => h.id !== fromHunterId));
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
      setError('Impossible de charger les données');
    }
  };

  const onSubmit = async (data: TransferFormData) => {
    setLoading(true);
    setError(null);

    try {
      await cartridgesApi.transferCartridges({
        from_hunter_id: fromHunterId,
        to_hunter_id: data.to_hunter_id,
        cartridge_type_id: data.cartridge_type_id,
        quantity: data.quantity,
        transfer_date: new Date(data.transfer_date).toISOString(),
        note: data.note || undefined,
      });

      reset();
      onSuccess();
    } catch (err: any) {
      console.error('Erreur lors du transfert:', err);
      setError(err.response?.data?.detail || 'Erreur lors du transfert des cartouches');
    } finally {
      setLoading(false);
    }
  };

  if (myStock.length === 0) {
    return (
      <div className="card bg-blue-50">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Donner des Cartouches
        </h2>
        <p className="text-gray-600">
          Vous n'avez aucune cartouche en stock à transférer.
        </p>
        <button onClick={onCancel} className="btn-secondary mt-4">
          Fermer
        </button>
      </div>
    );
  }

  return (
    <div className="card bg-blue-50">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Donner des Cartouches à un Chasseur
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Destinataire */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Donner à *
          </label>
          <select
            {...register('to_hunter_id', { required: 'Destinataire requis' })}
            className="input"
          >
            <option value="">Sélectionner un chasseur</option>
            {hunters.map((hunter) => (
              <option key={hunter.id} value={hunter.id}>
                {hunter.prenom} {hunter.nom}
              </option>
            ))}
          </select>
          {errors.to_hunter_id && (
            <p className="mt-1 text-sm text-red-600">{errors.to_hunter_id.message}</p>
          )}
        </div>

        {/* Type de cartouche */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type de Cartouche *
          </label>
          <select
            {...register('cartridge_type_id', { required: 'Type de cartouche requis' })}
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
          {errors.cartridge_type_id && (
            <p className="mt-1 text-sm text-red-600">{errors.cartridge_type_id.message}</p>
          )}
        </div>

        {/* Quantité */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantité *
          </label>
          <input
            type="number"
            {...register('quantity', {
              required: 'Quantité requise',
              min: { value: 1, message: 'Minimum 1 cartouche' },
              max: maxQuantity > 0 ? { value: maxQuantity, message: `Maximum ${maxQuantity} (votre stock)` } : undefined
            })}
            className="input"
            placeholder="1"
          />
          {errors.quantity && (
            <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
          )}
          {maxQuantity > 0 && (
            <p className="mt-1 text-sm text-gray-500">
              Stock disponible: {maxQuantity} cartouches
            </p>
          )}
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date du Don *
          </label>
          <input
            type="date"
            {...register('transfer_date', { required: 'Date requise' })}
            className="input"
          />
          {errors.transfer_date && (
            <p className="mt-1 text-sm text-red-600">{errors.transfer_date.message}</p>
          )}
        </div>

        {/* Note optionnelle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Note (optionnel)
          </label>
          <input
            type="text"
            {...register('note', {
              maxLength: { value: 255, message: 'Maximum 255 caractères' }
            })}
            className="input"
            placeholder="Ex: Pour la sortie de dimanche"
          />
          {errors.note && (
            <p className="mt-1 text-sm text-red-600">{errors.note.message}</p>
          )}
        </div>

        {/* Boutons */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
            disabled={loading}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Transfert en cours...' : 'Transférer les Cartouches'}
          </button>
        </div>
      </form>
    </div>
  );
}
