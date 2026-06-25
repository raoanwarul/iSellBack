import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../theme/app_theme.dart';
import '../services/supabase_service.dart';
import '../models/device.dart';

class SellDeviceWizard extends StatefulWidget {
  const SellDeviceWizard({super.key});

  @override
  State<SellDeviceWizard> createState() => _SellDeviceWizardState();
}

class _SellDeviceWizardState extends State<SellDeviceWizard> {
  int _step = 0; // 0=category, 1=model, 2=variant, 3=condition, 4=confirm

  List<DeviceCategory> _categories = [];
  List<DeviceModel> _models = [];
  List<DeviceVariant> _variants = [];

  DeviceCategory? _selCategory;
  DeviceModel? _selModel;
  DeviceVariant? _selVariant;

  final Map<String, String> _conditions = {};
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _fetchCategories();
  }

  Future<void> _fetchCategories() async {
    setState(() => _loading = true);
    final res = await SupabaseService.instance.client.from('device_categories').select().eq('is_active', true).order('display_order');
    setState(() {
      _categories = (res as List).map((e) => DeviceCategory.fromJson(e)).toList();
      _loading = false;
    });
  }

  Future<void> _fetchModels(String categoryId) async {
    setState(() => _loading = true);
    final res = await SupabaseService.instance.client.from('device_models').select().eq('category_id', categoryId).eq('is_active', true).order('display_order');
    setState(() {
      _models = (res as List).map((e) => DeviceModel.fromJson(e)).toList();
      _loading = false;
    });
  }

  Future<void> _fetchVariants(String modelId) async {
    setState(() => _loading = true);
    final res = await SupabaseService.instance.client.from('device_variants').select().eq('model_id', modelId).eq('is_active', true).order('display_order');
    setState(() {
      _variants = (res as List).map((e) => DeviceVariant.fromJson(e)).toList();
      _loading = false;
    });
  }

  void _back() {
    if (_step > 0) setState(() => _step--);
  }

  // ── Condition questions fetched from DB ──
  Map<String, List<String>> _conditionQuestions = {};

  Future<void> _fetchConditions() async {
    setState(() => _loading = true);
    final res = await SupabaseService.instance.client
        .from('condition_deductions')
        .select('category, condition_name')
        .eq('is_active', true)
        .order('display_order');
    final Map<String, List<String>> grouped = {};
    for (final row in (res as List)) {
      final cat = row['category'] as String;
      grouped.putIfAbsent(cat, () => []);
      grouped[cat]!.add(row['condition_name'] as String);
    }
    setState(() {
      _conditionQuestions = grouped;
      _loading = false;
    });
  }

  Future<void> _submitRequest() async {
    setState(() => _loading = true);
    try {
      final userId = SupabaseService.instance.client.auth.currentUser!.id;
      await SupabaseService.instance.client.from('sell_requests').insert({
        'customer_id': userId,
        'variant_id': _selVariant!.id,
        'condition_answers': _conditions,
        'status': 'pending',
      });
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Request submitted! Quotes will arrive soon.')));
      context.go('/requests');
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Sell Device'),
        leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: _step == 0 ? () => context.go('/home') : _back),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : AnimatedSwitcher(
              duration: const Duration(milliseconds: 200),
              child: _buildStep(),
            ),
    );
  }

  Widget _buildStep() {
    switch (_step) {
      case 0:
        return _buildList(
          title: 'Select Category',
          items: _categories.map((c) => _SelectItem(label: c.category, onTap: () {
            _selCategory = c;
            _fetchModels(c.id);
            setState(() => _step = 1);
          })).toList(),
        );
      case 1:
        return _buildList(
          title: 'Select Model',
          items: _models.map((m) => _SelectItem(label: m.modelName, subtitle: m.modelYear?.toString(), onTap: () {
            _selModel = m;
            _fetchVariants(m.id);
            setState(() => _step = 2);
          })).toList(),
        );
      case 2:
        return _buildList(
          title: 'Select Variant',
          items: _variants.map((v) => _SelectItem(
            label: v.displayName,
            subtitle: '₹${v.platformBasePrice} estimated',
            onTap: () {
              _selVariant = v;
              _conditions.clear();
              _fetchConditions();
              setState(() => _step = 3);
            },
          )).toList(),
        );
      case 3:
        return _buildConditionStep();
      case 4:
        return _buildConfirm();
      default:
        return const SizedBox();
    }
  }

  Widget _buildList({required String title, required List<_SelectItem> items}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
          child: Text(title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
        ),
        Expanded(
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: items.length,
            separatorBuilder: (_, _) => const Divider(height: 1),
            itemBuilder: (_, i) {
              final item = items[i];
              return ListTile(
                contentPadding: const EdgeInsets.symmetric(vertical: 6),
                title: Text(item.label, style: const TextStyle(fontWeight: FontWeight.w600)),
                subtitle: item.subtitle != null ? Text(item.subtitle!) : null,
                trailing: const Icon(Icons.chevron_right, color: AppColors.textMuted),
                onTap: item.onTap,
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildConditionStep() {
    final allAnswered = _conditionQuestions.keys.every(_conditions.containsKey);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.fromLTRB(20, 20, 20, 12),
          child: Text('Device Condition', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
        ),
        Expanded(
          child: ListView(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            children: _conditionQuestions.entries.map((q) {
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 12),
                  Text(q.key.replaceAll('_', ' ').toUpperCase(), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: q.value.map((opt) {
                      final selected = _conditions[q.key] == opt;
                      return ChoiceChip(
                        label: Text(opt),
                        selected: selected,
                        selectedColor: AppColors.primary.withValues(alpha: 0.15),
                        onSelected: (_) => setState(() => _conditions[q.key] = opt),
                      );
                    }).toList(),
                  ),
                ],
              );
            }).toList(),
          ),
        ),
        Padding(
          padding: const EdgeInsets.all(20),
          child: SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: allAnswered ? () => setState(() => _step = 4) : null,
              child: const Text('Continue'),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildConfirm() {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Confirm Details', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
          const SizedBox(height: 20),
          _SummaryRow(label: 'Category', value: _selCategory?.category ?? ''),
          _SummaryRow(label: 'Model', value: _selModel?.modelName ?? ''),
          _SummaryRow(label: 'Variant', value: _selVariant?.displayName ?? ''),
          const SizedBox(height: 12),
          ..._conditions.entries.map((e) => _SummaryRow(label: e.key.replaceAll('_', ' '), value: e.value)),
          const Spacer(),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: _loading ? null : _submitRequest,
              child: _loading
                  ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Text('Submit & Get Quotes'),
            ),
          ),
        ],
      ),
    );
  }
}

class _SelectItem {
  final String label;
  final String? subtitle;
  final VoidCallback onTap;
  const _SelectItem({required this.label, this.subtitle, required this.onTap});
}

class _SummaryRow extends StatelessWidget {
  final String label;
  final String value;
  const _SummaryRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 14)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
        ],
      ),
    );
  }
}
