import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseService {
  SupabaseService._();
  static final SupabaseService instance = SupabaseService._();

  SupabaseClient get client => Supabase.instance.client;

  static Future<void> init() async {
    final url = dotenv.env['SUPABASE_URL'];
    final anonKey = dotenv.env['SUPABASE_ANON_KEY'];
    if (url == null || anonKey == null) {
      throw Exception('SUPABASE_URL / SUPABASE_ANON_KEY missing from .env');
    }
    await Supabase.initialize(
      url: url,
      anonKey: anonKey,
      debug: false,
    );
  }

  User? get currentUser => client.auth.currentUser;
  bool get isSignedIn => currentUser != null;
}
