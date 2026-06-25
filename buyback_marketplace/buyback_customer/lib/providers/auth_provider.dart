import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/app_user.dart';
import '../services/supabase_service.dart';

class AuthProvider extends ChangeNotifier {
  AppUser? _user;
  bool _isLoading = false;
  String? _error;

  AppUser? get user => _user;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isSignedIn => _user != null;

  SupabaseClient get _client => SupabaseService.instance.client;

  AuthProvider() {
    _client.auth.onAuthStateChange.listen((event) async {
      if (event.session != null) {
        await _loadAppUser();
      } else {
        _user = null;
        notifyListeners();
      }
    });
  }

  Future<void> _loadAppUser() async {
    final authUser = _client.auth.currentUser;
    if (authUser == null) {
      _user = null;
      notifyListeners();
      return;
    }
    try {
      final row = await _client
          .from('app_users')
          .select()
          .eq('id', authUser.id)
          .maybeSingle();
      if (row != null) {
        _user = AppUser.fromJson(row);
      }
      notifyListeners();
    } catch (e) {
      debugPrint('Failed to load app_user: $e');
    }
  }

  Future<bool> signIn(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      await _client.auth.signInWithPassword(email: email, password: password);
      await _loadAppUser();
      return true;
    } on AuthException catch (e) {
      _error = e.message;
      return false;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> signUp({
    required String email,
    required String password,
    required String fullName,
    String? phone,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await _client.auth.signUp(
        email: email,
        password: password,
        data: {'full_name': fullName, 'phone': phone, 'role': 'customer'},
      );
      if (res.user == null) {
        _error = 'Signup failed — no user returned';
        return false;
      }
      // Auth trigger handle_new_user() auto-creates app_users row (SECURITY DEFINER)
      // If session exists (email confirm disabled), load user profile
      if (res.session != null) {
        await _loadAppUser();
      }
      return true;
    } on AuthException catch (e) {
      _error = e.message;
      return false;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> signInWithGoogle() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final webClientId = dotenv.env['GOOGLE_WEB_CLIENT_ID'];
      final googleSignIn = GoogleSignIn(
        serverClientId: webClientId,
      );
      final googleUser = await googleSignIn.signIn();
      if (googleUser == null) {
        // User cancelled
        _isLoading = false;
        notifyListeners();
        return false;
      }
      final googleAuth = await googleUser.authentication;
      final idToken = googleAuth.idToken;
      final accessToken = googleAuth.accessToken;

      if (idToken == null) {
        _error = 'Failed to get Google ID token';
        return false;
      }

      await _client.auth.signInWithIdToken(
        provider: OAuthProvider.google,
        idToken: idToken,
        accessToken: accessToken,
      );

      await _loadAppUser();
      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> signOut() async {
    await _client.auth.signOut();
    _user = null;
    notifyListeners();
  }

  Future<void> refresh() async {
    await _loadAppUser();
  }
}
