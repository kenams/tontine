// Champs user sûrs — jamais renvoyer passwordHash/kycSessionId au client
export const safeUserSelect = {
  id: true, email: true, fullName: true, phone: true, role: true,
  status: true, locale: true, kycStatus: true, kycVerifiedAt: true,
  avatarUrl: true, lastLoginAt: true, createdAt: true, updatedAt: true,
  stripeCustomerId: true
} as const;
