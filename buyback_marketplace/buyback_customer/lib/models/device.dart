class DeviceCategory {
  final String id;
  final String brand;
  final String category;
  final int displayOrder;
  final String? iconUrl;

  const DeviceCategory({
    required this.id,
    required this.brand,
    required this.category,
    required this.displayOrder,
    this.iconUrl,
  });

  factory DeviceCategory.fromJson(Map<String, dynamic> j) => DeviceCategory(
        id: j['id'] as String,
        brand: j['brand'] as String,
        category: j['category'] as String,
        displayOrder: j['display_order'] as int? ?? 0,
        iconUrl: j['icon_url'] as String?,
      );
}

class DeviceModel {
  final String id;
  final String categoryId;
  final String modelName;
  final int? modelYear;
  final String? chip;
  final double? screenSize;
  final String? imageUrl;

  const DeviceModel({
    required this.id,
    required this.categoryId,
    required this.modelName,
    this.modelYear,
    this.chip,
    this.screenSize,
    this.imageUrl,
  });

  factory DeviceModel.fromJson(Map<String, dynamic> j) => DeviceModel(
        id: j['id'] as String,
        categoryId: j['category_id'] as String,
        modelName: j['model_name'] as String,
        modelYear: j['model_year'] as int?,
        chip: j['chip'] as String?,
        screenSize: (j['screen_size'] as num?)?.toDouble(),
        imageUrl: j['image_url'] as String?,
      );
}

class DeviceVariant {
  final String id;
  final String modelId;
  final String? storage;
  final String? ram;
  final String? color;
  final int platformBasePrice;

  const DeviceVariant({
    required this.id,
    required this.modelId,
    this.storage,
    this.ram,
    this.color,
    required this.platformBasePrice,
  });

  factory DeviceVariant.fromJson(Map<String, dynamic> j) => DeviceVariant(
        id: j['id'] as String,
        modelId: j['model_id'] as String,
        storage: j['storage'] as String?,
        ram: j['ram'] as String?,
        color: j['color'] as String?,
        platformBasePrice: j['platform_base_price'] as int? ?? 0,
      );

  String get displayName {
    final parts = [storage, ram, color].whereType<String>().where((s) => s.isNotEmpty);
    return parts.join(' / ');
  }
}
