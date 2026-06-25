import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../screens/splash_screen.dart';
import '../screens/login_screen.dart';
import '../screens/register_screen.dart';
import '../screens/home_screen.dart';
import '../screens/profile_screen.dart';
import '../screens/sell_device_wizard.dart';
import '../screens/requests_screen.dart';

class AppRouter {
  static GoRouter build(BuildContext context) {
    final auth = context.read<AuthProvider>();
    return GoRouter(
      initialLocation: '/splash',
      refreshListenable: auth,
      redirect: (ctx, state) {
        final isSignedIn = auth.isSignedIn;
        final loc = state.matchedLocation;
        final publicRoutes = ['/splash', '/login', '/register'];

        if (!isSignedIn && !publicRoutes.contains(loc)) return '/login';
        if (isSignedIn && (loc == '/login' || loc == '/register' || loc == '/splash')) {
          return '/home';
        }
        return null;
      },
      routes: [
        GoRoute(path: '/splash', builder: (_, _) => const SplashScreen()),
        GoRoute(path: '/login', builder: (_, _) => const LoginScreen()),
        GoRoute(path: '/register', builder: (_, _) => const RegisterScreen()),
        GoRoute(path: '/home', builder: (_, _) => const HomeScreen()),
        GoRoute(path: '/profile', builder: (_, _) => const ProfileScreen()),
        GoRoute(path: '/sell', builder: (_, _) => const SellDeviceWizard()),
        GoRoute(path: '/requests', builder: (_, _) => const RequestsScreen()),
      ],
    );
  }
}
