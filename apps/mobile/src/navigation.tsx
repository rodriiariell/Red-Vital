import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SplashScreen, LoginScreen, RegisterScreen, ForgotPasswordScreen, ResetPasswordScreen, HomeScreen, ProfileScreen, EditProfileScreen } from "./screens";
import { useSession } from "./session";
import { Loading } from "./components";
export type RootStackParamList = { Login: undefined; Register: undefined; ForgotPassword: undefined; ResetPassword: { token?: string } | undefined; Home: undefined; Profile: undefined; EditProfile: undefined };
const Stack = createNativeStackNavigator<RootStackParamList>();
export function Navigation() { const { loading, authenticated } = useSession(); if (loading) return <SplashScreen />; return <NavigationContainer><Stack.Navigator screenOptions={{ headerShown: false }}>{authenticated ? <><Stack.Screen name="Home" component={HomeScreen} /><Stack.Screen name="Profile" component={ProfileScreen} /><Stack.Screen name="EditProfile" component={EditProfileScreen} /></> : <><Stack.Screen name="Login" component={LoginScreen} /><Stack.Screen name="Register" component={RegisterScreen} /><Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} /><Stack.Screen name="ResetPassword" component={ResetPasswordScreen} /></>}</Stack.Navigator></NavigationContainer>; }
