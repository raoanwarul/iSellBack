class AppUser {
  final String id;
  final String email;
  final String? phone;
  final String? fullName;
  final String? avatarUrl;
  final String role;
  final String? businessId;
  final bool isActive;
  final DateTime createdAt;

  const AppUser({
    required this.id,
    required this.email,
    this.phone,
    this.fullName,
    this.avatarUrl,
    required this.role,
    this.businessId,
    required this.isActive,
    required this.createdAt,
  });

  factory AppUser.fromJson(Map<String, dynamic> j) => AppUser(
        id: j['id'] as String,
        email: j['email'] as String,
        phone: j['phone'] as String?,
        fullName: j['full_name'] as String?,
        avatarUrl: j['avatar_url'] as String?,
        role: j['role'] as String,
        businessId: j['business_id'] as String?,
        isActive: j['is_active'] as bool? ?? true,
        createdAt: DateTime.parse(j['created_at'] as String).toLocal(),
      );
}
