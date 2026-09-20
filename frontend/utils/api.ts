const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8081'

class ApiClient {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('access_token')
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    return headers
  }

  private normalizeEndpoint(endpoint: string): string {
    // Convert /api/ endpoints to /api/v1/
    if (endpoint.startsWith('/api/') && !endpoint.startsWith('/api/v1/')) {
      return endpoint.replace('/api/', '/api/v1/')
    }
    return endpoint
  }

  async get(endpoint: string): Promise<Response> {
    const normalizedEndpoint = this.normalizeEndpoint(endpoint)
    return fetch(`${API_BASE}${normalizedEndpoint}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })
  }

  async post(endpoint: string, data: any): Promise<Response> {
    const normalizedEndpoint = this.normalizeEndpoint(endpoint)
    return fetch(`${API_BASE}${normalizedEndpoint}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    })
  }

  async put(endpoint: string, data: any): Promise<Response> {
    const normalizedEndpoint = this.normalizeEndpoint(endpoint)
    return fetch(`${API_BASE}${normalizedEndpoint}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    })
  }

  async delete(endpoint: string): Promise<Response> {
    const normalizedEndpoint = this.normalizeEndpoint(endpoint)
    return fetch(`${API_BASE}${normalizedEndpoint}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    })
  }
}

export const apiClient = new ApiClient()
export default apiClient
