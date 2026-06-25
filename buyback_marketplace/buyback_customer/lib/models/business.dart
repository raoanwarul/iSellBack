class Business {
  final String id;
  final String businessName;
  final String? logoUrl;
  final String? description;
  final String city;
  final String? pincode;
  final List<String> pincodesServed;
  final double? gmbRating;
  final int? gmbReviewCount;
  final String? gmbUrl;
  final bool isVerified;
  final bool isActive;
  final DateTime createdAt;

  const Business({
    required this.id,
    required this.businessName,
    this.logoUrl,
    this.description,
    required this.city,
    this.pincode,
    this.pincodesServed = const [],
    this.gmbRating,
    this.gmbReviewCount,
    this.gmbUrl,
    required this.isVerified,
    required this.isActive,
    required this.createdAt,
  });

  factory Business.fromJson(Map<String, dynamic> j) => Business(
        id: j['id'] as String,
        businessName: j['business_name'] as String,
        logoUrl: j['logo_url'] as String?,
        description: j['description'] as String?,
        city: j['city'] as String? ?? '',
        pincode: j['pincode'] as String?,
        pincodesServed: (j['pincodes_served'] as List?)?.cast<String>() ?? [],
        gmbRating: (j['gmb_rating'] as num?)?.toDouble(),
        gmbReviewCount: j['gmb_review_count'] as int?,
        gmbUrl: j['gmb_url'] as String?,
        isVerified: j['is_verified'] as bool? ?? false,
        isActive: j['is_active'] as bool? ?? false,
        createdAt: DateTime.parse(j['created_at'] as String).toLocal(),
      );
}
