import { useState, useCallback } from 'react';

export function useApi<T = unknown>() {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const execute = useCallback(async (url: string, options?: RequestInit) => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options?.headers,
                },
            });

            if (!res.ok) {
                let errorMessage = 'An error occurred while fetching data.';
                try {
                    const errorData = await res.json();
                    errorMessage = errorData.message || errorData.error || errorMessage;
                } catch {
                    // Fallback to status text if JSON parsing fails
                    errorMessage = `HTTP error! status: ${res.status}`;
                }
                throw new Error(errorMessage);
            }

            // Only attempt to parse JSON if there's content
            const contentType = res.headers.get("content-type");
            let responseData: T | null = null;
            if (contentType && contentType.includes("application/json")) {
                responseData = await res.json();
            }

            setData(responseData);
            return responseData;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unexpected error occurred';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const reset = useCallback(() => {
        setData(null);
        setError(null);
        setLoading(false);
    }, []);

    return { data, loading, error, execute, setData, setError, reset };
}
