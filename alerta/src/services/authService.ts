import { supabase } from '@/lib/supabase';
import { AlertaError } from '@/lib/errors';
import type { Profile } from '@/types/database';

export interface SignUpBusinessInput {
  businessName: string;
  managerName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface SignUpWithInviteInput {
  inviteCode: string;
  email: string;
  password: string;
  phone?: string;
}

/** Creates a brand-new account AND business, making the caller its first manager. */
export async function signUpNewBusiness(input: SignUpBusinessInput) {
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
  });
  if (signUpError) throw signUpError;
  if (!signUpData.user) throw new AlertaError('Could not create your account. Please try again.');

  // If email confirmation is required, there is no session yet — the RPC
  // below needs auth.uid(), so we must have an active session. Try to
  // sign in immediately (works when confirmation is disabled, the
  // default for a fresh Supabase project used in dev/demo).
  if (!signUpData.session) {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });
    if (signInError) {
      throw new AlertaError(
        'Account created. Please check your email to confirm your address, then log in to finish setting up your business.'
      );
    }
  }

  const { data, error } = await supabase.rpc('create_business_and_manager', {
    p_business_name: input.businessName,
    p_manager_name: input.managerName,
    p_phone: input.phone ?? null,
  });
  if (error) throw error;
  return data;
}

/** Creates an account for an employee/manager claiming an invite code. */
export async function signUpWithInvite(input: SignUpWithInviteInput) {
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
  });
  if (signUpError) throw signUpError;
  if (!signUpData.user) throw new AlertaError('Could not create your account. Please try again.');

  if (!signUpData.session) {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });
    if (signInError) {
      throw new AlertaError(
        'Account created. Please check your email to confirm your address, then log in to join your team.'
      );
    }
  }

  const { data, error } = await supabase.rpc('claim_invite', {
    p_invite_code: input.inviteCode,
    p_phone: input.phone ?? null,
  });
  if (error) throw error;
  return data;
}

export async function getInvitePreview(inviteCode: string) {
  const { data, error } = await supabase.rpc('get_invite_preview', {
    p_invite_code: inviteCode,
  });
  if (error) throw error;
  return data?.[0] ?? null;
}

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function fetchMyProfile(): Promise<Profile | null> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userData.user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
}
