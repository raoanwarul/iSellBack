class SellRequest {
  final String id;
  final String customerId;
  final String variantId;
  final Map<String, dynamic> conditionAnswers;
  final List<String> photos;
  final String? serialNumber;
  final String? description;
  final String? pickupAddressLine1;
  final String? pickupCity;
  final String? pickupPincode;
  final DateTime? pickupDate;
  final String? pickupSlot;
  final String? selectedBusinessId;
  final String? selectedQuoteId;
  final int? customerEstimatedPrice;
  final int? finalPrice;
  final String status;
  final DateTime createdAt;
  final DateTime updatedAt;

  const SellRequest({
    required this.id,
    required this.customerId,
    required this.variantId,
    required this.conditionAnswers,
    this.photos = const [],
    this.serialNumber,
    this.description,
    this.pickupAddressLine1,
    this.pickupCity,
    this.pickupPincode,
    this.pickupDate,
    this.pickupSlot,
    this.selectedBusinessId,
    this.selectedQuoteId,
    this.customerEstimatedPrice,
    this.finalPrice,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
  });

  factory SellRequest.fromJson(Map<String, dynamic> j) => SellRequest(
        id: j['id'] as String,
        customerId: j['customer_id'] as String,
        variantId: j['variant_id'] as String,
        conditionAnswers: (j['condition_answers'] as Map?)?.cast<String, dynamic>() ?? {},
        photos: (j['photos'] as List?)?.cast<String>() ?? [],
        serialNumber: j['serial_number'] as String?,
        description: j['description'] as String?,
        pickupAddressLine1: j['pickup_address_line1'] as String?,
        pickupCity: j['pickup_city'] as String?,
        pickupPincode: j['pickup_pincode'] as String?,
        pickupDate: j['pickup_date'] != null ? DateTime.parse(j['pickup_date'] as String) : null,
        pickupSlot: j['pickup_slot'] as String?,
        selectedBusinessId: j['selected_business_id'] as String?,
        selectedQuoteId: j['selected_quote_id'] as String?,
        customerEstimatedPrice: j['customer_estimated_price'] as int?,
        finalPrice: j['final_price'] as int?,
        status: j['status'] as String,
        createdAt: DateTime.parse(j['created_at'] as String).toLocal(),
        updatedAt: DateTime.parse(j['updated_at'] as String).toLocal(),
      );
}

class Quote {
  final String id;
  final String sellRequestId;
  final String businessId;
  final int quotedPrice;
  final int basePrice;
  final List<Map<String, dynamic>> deductionsBreakdown;
  final String? notes;
  final String status;
  final DateTime expiresAt;
  final DateTime createdAt;

  const Quote({
    required this.id,
    required this.sellRequestId,
    required this.businessId,
    required this.quotedPrice,
    required this.basePrice,
    this.deductionsBreakdown = const [],
    this.notes,
    required this.status,
    required this.expiresAt,
    required this.createdAt,
  });

  factory Quote.fromJson(Map<String, dynamic> j) => Quote(
        id: j['id'] as String,
        sellRequestId: j['sell_request_id'] as String,
        businessId: j['business_id'] as String,
        quotedPrice: j['quoted_price'] as int,
        basePrice: j['base_price'] as int,
        deductionsBreakdown: (j['deductions_breakdown'] as List?)?.cast<Map<String, dynamic>>() ?? [],
        notes: j['notes'] as String?,
        status: j['status'] as String,
        expiresAt: DateTime.parse(j['expires_at'] as String).toLocal(),
        createdAt: DateTime.parse(j['created_at'] as String).toLocal(),
      );
}
