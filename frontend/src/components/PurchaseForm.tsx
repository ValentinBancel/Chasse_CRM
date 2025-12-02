'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { cartridgesApi } from '@/lib/api';
import type { CartridgeType } from '@/types';

interface PurchaseFormData {
  cartridge_type_id: string;
  quantity: number;
  unit_price: number;
  purchase_date: string;
  // Nouveaux champs pour créer un type de cartouche
  charge_type?: string;
  pellet_size?: string;
  brand?: string;
}

interface PurchaseFormProps {
  hunterId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PurchaseForm({ hunterId, onSuccess, onCancel }: PurchaseFormProps) {
  const [cartridgeTypes, setCartridgeTypes] = useState<CartridgeType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewType, setShowNewType] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<PurchaseFormData>({
    defaultValues: {
      cartridge_type_id: '',
      quantity: 25,
      unit_price: 0.45,
      purchase_date: new Date().toISOString().split('T')[0],
      charge_type: 'Normal',
      pellet_size: '7',
      brand: '',
    }
  });

  const cartridgeTypeId = watch('cartridge_type_id');

  useEffect(() => {
    loadCartridgeTypes();
  }, []);

  const loadCartridgeTypes = async () => {
    try {
      const types = await cartridgesApi.getTypes();
      setCartridgeTypes(types);
    } catch (err) {
      console.error('Erreur lors du chargement des types:', err);
      setError('Impossible de charger les types de cartouches');
    }
  };

  const onSubmit = async (data: PurchaseFormData) => {
    setLoading(true);
    setError(null);

    try {
      let typeId = data.cartridge_type_id;

      // Si création d'un nouveau type
      if (typeId === 'new' && data.charge_type && data.pellet_size && data.brand) {
        const newType = await cartridgesApi.createType({
          charge_type: data.charge_type,
          pellet_size: data.pellet_size,
          brand: data.brand,
        });
        typeId = newType.id;
      }

      if (!typeId || typeId === 'new') {
        setError('Veuillez sélectionner un type de cartouche');
        setLoading(false);
        return;
      }

      // Créer l'achat
      await cartridgesApi.createPurchase({
        hunter_id: hunterId,
        cartridge_type_id: typeId,
        quantity: data.quantity,
        unit_price: data.unit_price,
        purchase_date: new Date(data.purchase_date).toISOString(),
      });

      reset();
      onSuccess();
    } catch (err: any) {
      console.error('Erreur lors de l\'enregistrement:', err);
      setError(err.response?.data?.detail || 'Erreur lors de l\'enregistrement de l\'achat');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card bg-forest-50">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Enregistrer un Achat de Cartouches
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Type de cartouche */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type de Cartouche *
          </label>
          <select
            {...register('cartridge_type_id', { required: 'Type de cartouche requis' })}
            className="input"
            onChange={(e) => setShowNewType(e.target.value === 'new')}
          >
            <option value="">Sélectionner un type</option>
            {cartridgeTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.brand} - {type.charge_type} - Plomb {type.pellet_size}
              </option>
            ))}
            <option value="new">+ Créer un nouveau type</option>
          </select>
          {errors.cartridge_type_id && (
            <p className="mt-1 text-sm text-red-600">{errors.cartridge_type_id.message}</p>
          )}
        </div>

        {/* Formulaire pour nouveau type */}
        {(showNewType || cartridgeTypeId === 'new') && (
          <div className="p-4 bg-white rounded-lg border border-gray-200 space-y-3">
            <h3 className="font-medium text-gray-900">Nouveau Type de Cartouche</h3>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de Charge *
                </label>
                <select {...register('charge_type', { required: showNewType })} className="input">
                  <option value="Normal">Normal</option>
                  <option value="Super">Super</option>
                  <option value="Magnum">Magnum</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Taille Plomb *
                </label>
                <select {...register('pellet_size', { required: showNewType })} className="input">
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                  <option value="6.5">6.5</option>
                  <option value="7">7</option>
                  <option value="7.5">7.5</option>
                  <option value="8">8</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Marque *
                </label>
                <input
                  type="text"
                  {...register('brand', {
                    required: showNewType ? 'Marque requise' : false,
                    minLength: { value: 1, message: 'Marque requise' }
                  })}
                  className="input"
                  placeholder="Winchester, Remington..."
                />
                {errors.brand && (
                  <p className="mt-1 text-sm text-red-600">{errors.brand.message}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quantité */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantité *
          </label>
          <input
            type="number"
            {...register('quantity', {
              required: 'Quantité requise',
              min: { value: 1, message: 'Minimum 1 cartouche' }
            })}
            className="input"
            placeholder="25"
          />
          {errors.quantity && (
            <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
          )}
        </div>

        {/* Prix unitaire */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Prix Unitaire (€) *
          </label>
          <input
            type="number"
            step="0.01"
            {...register('unit_price', {
              required: 'Prix requis',
              min: { value: 0.01, message: 'Prix minimum 0.01€' }
            })}
            className="input"
            placeholder="0.45"
          />
          {errors.unit_price && (
            <p className="mt-1 text-sm text-red-600">{errors.unit_price.message}</p>
          )}
        </div>

        {/* Date d'achat */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date d'Achat *
          </label>
          <input
            type="date"
            {...register('purchase_date', { required: 'Date requise' })}
            className="input"
          />
          {errors.purchase_date && (
            <p className="mt-1 text-sm text-red-600">{errors.purchase_date.message}</p>
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
            {loading ? 'Enregistrement...' : 'Enregistrer l\'Achat'}
          </button>
        </div>
      </form>
    </div>
  );
}
