// packages/mobile/src/screens/auth/LoginScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { login, clearErrors } from '../../store/slices/authSlice';
import { AuthStackParamList } from '../../navigation/types';

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [inputTouched, setInputTouched] = useState({ email: false, password: false });

  const navigation = useNavigation<LoginScreenNavigationProp>();
  const dispatch = useAppDispatch();
  const { isLoading, error, isAuthenticated } = useAppSelector(state => state.auth);

  // Limpiar errores cuando se desmonta el componente
  useEffect(() => {
    return () => {
      dispatch(clearErrors());
    };
  }, [dispatch]);

  // Mostrar error del servidor si existe
  useEffect(() => {
    if (error) {
      Alert.alert('Error de inicio de sesión', error);
    }
  }, [error]);

  // Validar email
  const validateEmail = () => {
    const emailRegex = /\S+@\S+\.\S+/;
    if (!email.trim()) {
      setEmailError('El email es obligatorio');
      return false;
    } else if (!emailRegex.test(email)) {
      setEmailError('Introduce un email válido');
      return false;
    } else {
      setEmailError('');
      return true;
    }
  };

  // Validar contraseña
  const validatePassword = () => {
    if (!password.trim()) {
      setPasswordError('La contraseña es obligatoria');
      return false;
    } else if (password.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres');
      return false;
    } else {
      setPasswordError('');
      return true;
    }
  };

  // Handler para tocar un input
  const handleTouchInput = (input: 'email' | 'password') => {
    setInputTouched(prev => ({ ...prev, [input]: true }));
  };

  // Handler para submit
  const handleSubmit = () => {
    // Solo validamos si los campos han sido tocados o si se intenta enviar el formulario
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();

    // Marcar todos los inputs como tocados para mostrar errores
    setInputTouched({ email: true, password: true });

    if (isEmailValid && isPasswordValid) {
      dispatch(login({ email, password }));
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Iniciar Sesión</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, emailError && inputTouched.email && styles.inputError]}
              placeholder="tu@email.com"
              value={email}
              onChangeText={setEmail}
              onBlur={() => {
                handleTouchInput('email');
                validateEmail();
              }}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            {emailError && inputTouched.email && (
              <Text style={styles.errorText}>{emailError}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={[styles.input, passwordError && inputTouched.password && styles.inputError]}
              placeholder="Contraseña"
              value={password}
              onChangeText={setPassword}
              onBlur={() => {
                handleTouchInput('password');
                validatePassword();
              }}
              secureTextEntry
            />
            {passwordError && inputTouched.password && (
              <Text style={styles.errorText}>{passwordError}</Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Iniciar Sesión</Text>
            )}
          </TouchableOpacity>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>¿No tienes una cuenta?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Regístrate</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  formContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 20,
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  inputError: {
    borderColor: '#FF0000',
  },
  errorText: {
    color: '#FF0000',
    fontSize: 12,
    marginTop: 5,
  },
  button: {
    backgroundColor: '#3D5AFE',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    color: '#777',
  },
  registerLink: {
    color: '#3D5AFE',
    fontWeight: 'bold',
    marginLeft: 5,
  },
});

export default LoginScreen;