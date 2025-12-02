'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [passwordWarning, setPasswordWarning] = useState(false);

  const MAX_PASSWORD_LENGTH = 72;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Check password length
    if (name === 'password' || name === 'confirmPassword') {
      if (value.length > MAX_PASSWORD_LENGTH) {
        return; // Don't allow input beyond max length
      }
      setPasswordWarning(value.length >= MAX_PASSWORD_LENGTH - 10);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (formData.password !== formData.confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }

    try {
      await register({
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        password: formData.password,
      });
      router.push('/dashboard');
    } catch (err) {
      // L'erreur est déjà gérée dans le store
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-forest-100 to-earth-100 py-12">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-2xl">
        {/* Logo et titre */}
        <div className="text-center">
          <div className="text-5xl mb-4">🦌</div>
          <h2 className="text-3xl font-bold text-forest-800">Chasse App</h2>
          <p className="mt-2 text-sm text-gray-600">
            Créez votre compte
          </p>
        </div>

        {/* Formulaire */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="prenom" className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom
                </label>
                <input
                  id="prenom"
                  name="prenom"
                  type="text"
                  required
                  value={formData.prenom}
                  onChange={handleChange}
                  className="input"
                  placeholder="Jean"
                />
              </div>

              <div>
                <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-1">
                  Nom
                </label>
                <input
                  id="nom"
                  name="nom"
                  type="text"
                  required
                  value={formData.nom}
                  onChange={handleChange}
                  className="input"
                  placeholder="Dupont"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="input"
                placeholder="votre.email@exemple.fr"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                maxLength={MAX_PASSWORD_LENGTH}
                value={formData.password}
                onChange={handleChange}
                className="input"
                placeholder="••••••••"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.password.length}/{MAX_PASSWORD_LENGTH} caractères
              </p>
            </div>

            {passwordWarning && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-lg text-sm">
                Attention : vous approchez de la limite de {MAX_PASSWORD_LENGTH} caractères pour le mot de passe.
              </div>
            )}

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmer le mot de passe
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={6}
                maxLength={MAX_PASSWORD_LENGTH}
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Inscription...' : "S'inscrire"}
          </button>

          <div className="text-center text-sm">
            <span className="text-gray-600">Déjà un compte ? </span>
            <Link href="/login" className="text-forest-600 hover:text-forest-700 font-medium">
              Se connecter
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
