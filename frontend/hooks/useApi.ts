import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { useRouter } from 'next/router';
import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const useApi = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  };

  const formatError = (err: any): string => {
    // Handle FastAPI validation errors
    if (Array.isArray(err)) {
      return err.map((e: any) => e.msg || JSON.stringify(e)).join(', ');
    }
    
    // Handle object errors
    if (typeof err === 'object' && err !== null) {
      if (err.detail) {
        // If detail is an array (FastAPI validation errors)
        if (Array.isArray(err.detail)) {
          return err.detail.map((e: any) => e.msg || JSON.stringify(e)).join(', ');
        }
        // If detail is a string
        if (typeof err.detail === 'string') {
          return err.detail;
        }
        // If detail is an object
        return JSON.stringify(err.detail);
      }
      if (err.message) {
        return err.message;
      }
      return JSON.stringify(err);
    }
    
    // Handle string errors
    if (typeof err === 'string') {
      return err;
    }
    
    return 'An error occurred';
  };

  const request = async <T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      const headers: any = {
        ...config?.headers,
      };

      // Don't set Content-Type if it's already set in config (for form data)
      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axios({
        method,
        url: `${API_URL}${endpoint}`,
        data,
        headers,
        ...config,
      });

      setLoading(false);
      return response.data;
    } catch (err) {
      const axiosError = err as AxiosError<any>;
      let errorMessage = 'An error occurred';

      if (axiosError.response) {
        errorMessage = formatError(axiosError.response.data);
      } else if (axiosError.message) {
        errorMessage = axiosError.message;
      }

      setError(errorMessage);
      setLoading(false);

      // Handle 401 - redirect to login
      if (axiosError.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        router.push('/login');
      }

      return null;
    }
  };

  const get = <T = any>(endpoint: string, config?: AxiosRequestConfig) =>
    request<T>('GET', endpoint, undefined, config);

  const post = <T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig) =>
    request<T>('POST', endpoint, data, config);

  const put = <T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig) =>
    request<T>('PUT', endpoint, data, config);

  const del = <T = any>(endpoint: string, config?: AxiosRequestConfig) =>
    request<T>('DELETE', endpoint, undefined, config);

  return { get, post, put, del, loading, error, setError };
};