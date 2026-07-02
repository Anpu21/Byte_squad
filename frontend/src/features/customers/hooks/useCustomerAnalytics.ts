import { useQuery } from "@tanstack/react-query";
import { customerService } from "@/services/customers.service";
import { queryKeys } from "@/lib/queryKeys";

export function useCustomerAnalytics(branchId?: string) {
  return useQuery({
    queryKey: queryKeys.customers.analytics(branchId ?? null),
    queryFn: () => customerService.analytics(branchId),
  });
}
