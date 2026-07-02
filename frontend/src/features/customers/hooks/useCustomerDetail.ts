import { useQuery } from "@tanstack/react-query";
import { customerService } from "@/services/customers.service";
import { queryKeys } from "@/lib/queryKeys";

export function useCustomerDetail(key: string) {
  return useQuery({
    queryKey: queryKeys.customers.detail(key),
    queryFn: () => customerService.get(key),
    enabled: Boolean(key),
  });
}
