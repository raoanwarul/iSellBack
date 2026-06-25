import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../theme/app_theme.dart';
import 'store_location_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // Avatar + Name
          Center(
            child: Column(
              children: [
                CircleAvatar(
                  radius: 40,
                  backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                  child: Text(
                    (user?.fullName ?? '?')[0].toUpperCase(),
                    style: const TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.w700,
                      color: AppColors.primary,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  user?.fullName ?? 'Guest',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  user?.email ?? '',
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),

          _ProfileTile(
            icon: Icons.list_alt,
            label: 'My Requests',
            onTap: () => context.go('/requests'),
          ),
          _ProfileTile(
            icon: Icons.store,
            label: 'Our Store',
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const StoreLocationScreen()),
              );
            },
          ),
          _ProfileTile(
            icon: Icons.help_outline,
            label: 'Help & Support',
            onTap: () {},
          ),
          _ProfileTile(
            icon: Icons.info_outline,
            label: 'About',
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const StoreLocationScreen()),
              );
            },
          ),
          const Divider(height: 32),
          _ProfileTile(
            icon: Icons.logout,
            label: 'Sign Out',
            isDestructive: true,
            onTap: () async {
              await auth.signOut();
              if (context.mounted) context.go('/login');
            },
          ),
        ],
      ),
    );
  }
}

class _ProfileTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool isDestructive;

  const _ProfileTile({
    required this.icon,
    required this.label,
    required this.onTap,
    this.isDestructive = false,
  });

  @override
  Widget build(BuildContext context) {
    final color = isDestructive ? AppColors.error : AppColors.textPrimary;
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 4),
      leading: Icon(icon, color: color),
      title: Text(
        label,
        style: TextStyle(
          fontSize: 15,
          fontWeight: FontWeight.w500,
          color: color,
        ),
      ),
      trailing: Icon(
        Icons.chevron_right,
        color: AppColors.textMuted.withValues(alpha: 0.4),
      ),
      onTap: onTap,
    );
  }
}
