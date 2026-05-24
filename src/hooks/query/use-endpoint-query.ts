'use client';

import { honoClient } from '@/app/api/hono-client';
import { type MockDbType } from '@/app/api/routes/example/endpoint/handler';
import { useQuery } from '@tanstack/react-query';

import { type CustomUseQueryOptions } from './types';

export const EXAMPLES_QUERY_KEY = ['examples'] as const;

export type UseExamplesQueryOptions = CustomUseQueryOptions<MockDbType[]>;

export function useExamplesQuery(options?: UseExamplesQueryOptions) {
  return useQuery<MockDbType[]>({
    ...options,
    queryKey: EXAMPLES_QUERY_KEY,
    queryFn: fetchExamples,
  });
}

async function fetchExamples() {
  const res = await honoClient.api.example.$get();

  if (!res.ok) {
    throw new Error('Failed to fetch examples');
  }

  const json = await res.json();

  return json.data;
}
