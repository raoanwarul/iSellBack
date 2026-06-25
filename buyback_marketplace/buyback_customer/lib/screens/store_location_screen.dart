import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../theme/app_theme.dart';

class StoreLocationScreen extends StatelessWidget {
  const StoreLocationScreen({super.key});

  static const String _storeName = 'Macintosh Enterprise';
  static const String _address =
      'Shop No. 157, 1st Floor\nThe Great India Place\nSector 38A, Noida – 201301\nUttar Pradesh, India';
  static const String _phone = '+91 8595611340';
  static const String _email = 'contact@buybackelite.com';
  static const String _hours =
      'Mon – Sat: 10:00 AM – 9:00 PM\nSunday: 11:00 AM – 8:00 PM';
  static const String _mapsUrl =
      'https://www.google.com/maps/search/?api=1&query=The+Great+India+Place+Noida&query_place_id=ChIJKREzGx3lDDkRK0VEzK96bjE';
  static const String _mapsCid =
      'https://google.com/maps?cid=10210490086162651479';

  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Our Store')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Store Header
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    AppColors.primary,
                    AppColors.primary.withValues(alpha: 0.8),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                children: [
                  const Icon(Icons.store, size: 48, color: Colors.white),
                  const SizedBox(height: 12),
                  const Text(
                    _storeName,
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Visit us for in-person assessment & same-day payment',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.white.withValues(alpha: 0.9),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Map Card
            GestureDetector(
              onTap: () => _launchUrl(_mapsCid),
              child: Container(
                width: double.infinity,
                height: 180,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.divider),
                  color: Colors.grey[100],
                ),
                child: Stack(
                  children: [
                    Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.map_outlined,
                            size: 48,
                            color: AppColors.primary.withValues(alpha: 0.6),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Tap to open in Google Maps',
                            style: TextStyle(
                              fontSize: 13,
                              color: AppColors.textSecondary,
                            ),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'The Great India Place, Noida',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textPrimary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Positioned(
                      top: 8,
                      right: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.directions,
                              size: 14,
                              color: Colors.white,
                            ),
                            SizedBox(width: 4),
                            Text(
                              'Directions',
                              style: TextStyle(
                                fontSize: 11,
                                color: Colors.white,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Address
            _InfoCard(
              icon: Icons.location_on,
              title: 'Address',
              content: _address,
              actionIcon: Icons.directions,
              actionLabel: 'Get Directions',
              onAction: () => _launchUrl(_mapsCid),
            ),
            const SizedBox(height: 12),

            // Hours
            _InfoCard(
              icon: Icons.access_time,
              title: 'Store Hours',
              content: _hours,
            ),
            const SizedBox(height: 12),

            // Contact
            _InfoCard(
              icon: Icons.phone,
              title: 'Contact',
              content: '$_phone\n$_email',
              actionIcon: Icons.call,
              actionLabel: 'Call Now',
              onAction: () => _launchUrl('tel:$_phone'),
            ),
            const SizedBox(height: 24),

            // Trust badges
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.green.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.green.withValues(alpha: 0.2)),
              ),
              child: const Column(
                children: [
                  Row(
                    children: [
                      Icon(Icons.verified, color: Colors.green, size: 20),
                      SizedBox(width: 8),
                      Text(
                        'Verified Business',
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(Icons.people, color: Colors.green, size: 20),
                      SizedBox(width: 8),
                      Text(
                        '1000+ Happy Sellers',
                        style: TextStyle(fontSize: 13),
                      ),
                    ],
                  ),
                  SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(Icons.star, color: Colors.amber, size: 20),
                      SizedBox(width: 8),
                      Text(
                        '4.8★ Rating on Google',
                        style: TextStyle(fontSize: 13),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String content;
  final IconData? actionIcon;
  final String? actionLabel;
  final VoidCallback? onAction;

  const _InfoCard({
    required this.icon,
    required this.title,
    required this.content,
    this.actionIcon,
    this.actionLabel,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.divider),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: AppColors.primary, size: 22),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  content,
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppColors.textPrimary,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
          if (onAction != null)
            GestureDetector(
              onTap: onAction,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(actionIcon, size: 14, color: AppColors.primary),
                    const SizedBox(width: 4),
                    Text(
                      actionLabel!,
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.primary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
