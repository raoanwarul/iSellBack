import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../theme/app_theme.dart';
import '../services/supabase_service.dart';
import '../models/sell_request.dart';

class RequestsScreen extends StatefulWidget {
  const RequestsScreen({super.key});

  @override
  State<RequestsScreen> createState() => _RequestsScreenState();
}

class _RequestsScreenState extends State<RequestsScreen> {
  List<SellRequest> _requests = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadRequests();
  }

  Future<void> _loadRequests() async {
    try {
      final userId = SupabaseService.instance.client.auth.currentUser!.id;
      final res = await SupabaseService.instance.client
          .from('sell_requests')
          .select()
          .eq('customer_id', userId)
          .order('created_at', ascending: false);
      setState(() {
        _requests = (res as List).map((e) => SellRequest.fromJson(e)).toList();
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'pending': return Colors.orange;
      case 'quoted': return AppColors.accent;
      case 'accepted': return AppColors.success;
      case 'completed': return AppColors.primary;
      case 'cancelled': return AppColors.error;
      default: return AppColors.textMuted;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Requests'),
        leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => context.go('/home')),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _requests.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.inbox_rounded, size: 56, color: AppColors.textMuted.withValues(alpha: 0.4)),
                      const SizedBox(height: 12),
                      const Text('No sell requests yet', style: TextStyle(fontSize: 16, color: AppColors.textSecondary)),
                      const SizedBox(height: 16),
                      ElevatedButton.icon(
                        onPressed: () => context.go('/sell'),
                        icon: const Icon(Icons.add, size: 18),
                        label: const Text('Sell a Device'),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadRequests,
                  child: ListView.separated(
                    padding: const EdgeInsets.all(20),
                    itemCount: _requests.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 12),
                    itemBuilder: (_, i) {
                      final req = _requests[i];
                      return Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: AppColors.divider),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text('Request #${req.id.substring(0, 8)}', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: _statusColor(req.status).withValues(alpha: 0.12),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(req.status.toUpperCase(), style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: _statusColor(req.status))),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text('Variant: ${req.variantId.substring(0, 8)}...', style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)),
                            if (req.selectedQuoteId != null)
                              Padding(
                                padding: const EdgeInsets.only(top: 4),
                                child: Text('Accepted quote: ${req.selectedQuoteId!.substring(0, 8)}...', style: const TextStyle(fontSize: 13, color: AppColors.success)),
                              ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
