interface Entitlements {
  maxMessagesPerDay: number;
}

type UserType = 'standard';

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  /*
   * For authenticated users (default)
   */
  standard: {
    maxMessagesPerDay: 100,
  },
};
