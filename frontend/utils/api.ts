const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

class ApiClient {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token')
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    return headers
  }

  async get(endpoint: string): Promise<Response> {
    return fetch(`${API_BASE}${endpoint}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })
  }

  async post(endpoint: string, data: any): Promise<Response> {
    return fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    })
  }

  async put(endpoint: string, data: any): Promise<Response> {
    return fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    })
  }

  async delete(endpoint: string): Promise<Response> {
    return fetch(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    })
  }
}

export const apiClient = new ApiClient()
export default apiClient
