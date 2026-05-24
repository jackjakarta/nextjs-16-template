import { type UseQueryOptions } from '@tanstack/react-query';

export type CustomUseQueryOptions<T> = Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>;
