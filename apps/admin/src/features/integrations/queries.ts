import type { ApiKeyInput, DeliveryFilters, WebhookInput } from '@indoor/data';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { data } from '../../app/data-client';

const root = ['integrations'] as const;
const keysKey = [...root, 'api-keys'] as const;
const webhooksKey = [...root, 'webhooks'] as const;
const deliveriesKey = [...root, 'deliveries'] as const;

export function useApiKeys() {
  return useQuery({ queryKey: keysKey, queryFn: () => data.integrations.listApiKeys() });
}

export function useWebhooks() {
  return useQuery({ queryKey: webhooksKey, queryFn: () => data.integrations.listWebhooks() });
}

export function useDeliveries(query: {
  q: string;
  page: number;
  size: number;
  filters: DeliveryFilters;
}) {
  return useQuery({
    queryKey: [...deliveriesKey, query],
    queryFn: () => data.integrations.listDeliveries(query),
    placeholderData: keepPreviousData,
    refetchInterval: (state) =>
      state.state.data?.rows.some((d) => ['pending', 'sending', 'retrying'].includes(d.status))
        ? 3000
        : 15_000,
  });
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.invalidateQueries({ queryKey: root });
    await queryClient.invalidateQueries({ queryKey: ['audit'] });
  };
}

export function useCreateApiKey() {
  const onSettled = useInvalidate();
  return useMutation({
    mutationFn: (input: ApiKeyInput) => data.integrations.createApiKey(input),
    onSettled,
  });
}

export function useRevokeApiKey() {
  const onSettled = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => data.integrations.revokeApiKey(id),
    onSettled,
  });
}

export function useCreateWebhook() {
  const onSettled = useInvalidate();
  return useMutation({
    mutationFn: (input: WebhookInput) => data.integrations.createWebhook(input),
    onSettled,
  });
}

export function useUpdateWebhook() {
  const onSettled = useInvalidate();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: WebhookInput & { active: boolean } }) =>
      data.integrations.updateWebhook(id, input),
    onSettled,
  });
}

export function useRemoveWebhook() {
  const onSettled = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => data.integrations.removeWebhook(id),
    onSettled,
  });
}

export function useRotateWebhookSecret() {
  const onSettled = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => data.integrations.rotateWebhookSecret(id),
    onSettled,
  });
}

export function usePingWebhook() {
  const onSettled = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => data.integrations.pingWebhook(id),
    onSettled,
  });
}

export function useRedeliver() {
  const onSettled = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => data.integrations.redeliver(id),
    onSettled,
  });
}
