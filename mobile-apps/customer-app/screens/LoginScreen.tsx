import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';
import { Box, Text, Input, Button } from '../components/ui';
import { Logo } from '../components/Logo';
import { useAuth } from '../context/AuthContext';

interface LoginScreenProps {
  onSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess }) => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!identifier.trim() || !password) {
      setError('Email et mot de passe requis');
      return;
    }
    setLoading(true);
    try {
      await login(identifier.trim(), password);
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.olive, justifyContent: 'center', alignItems: 'center', padding: spacing.md }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Box
        width="100%"
        style={{ maxWidth: 360 }}
        backgroundColor={colors.surface}
        borderRadius={borderRadius.xl}
        p="xl"
        alignItems="center"
      >
        <Logo size="lg" />
        <Text variant="h2" style={{ marginTop: spacing.lg }}>Bienvenue sur AL-baz</Text>
        <Text variant="bodySmall" color="secondary" style={{ marginBottom: spacing.lg }}>Connectez-vous pour continuer</Text>

        <Input
          placeholder="Email ou téléphone"
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
          keyboardType="email-address"
          containerStyle={{ width: '100%', marginBottom: spacing.md }}
        />
        <Input
          placeholder="Mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          containerStyle={{ width: '100%', marginBottom: spacing.md }}
        />

        {error ? (
          <Text variant="bodySmall" style={{ color: colors.error, marginBottom: spacing.sm }}>{error}</Text>
        ) : null}

        <Button
          variant="primary"
          fullWidth
          loading={loading}
          disabled={loading}
          onPress={handleSubmit}
          style={{ marginTop: spacing.sm }}
        >
          Connexion
        </Button>
      </Box>
    </KeyboardAvoidingView>
  );
};
