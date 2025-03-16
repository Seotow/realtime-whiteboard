const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface Board {
  id: string;
  title: string;
  description?: string;
  isPublic: boolean;
  content?: FabricCanvasData;
  createdAt: string;
  updatedAt: string;
  userId: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
  collaborators: Array<{
    userId: string;
    role: string;
    addedAt: string;
  }>;
  _count?: {
    activities: number;
  };
}

export interface FabricCanvasData {
  version: string;
  objects: Array<Record<string, unknown>>;
}

export interface CreateBoardData {
  title: string;
  description?: string;
  isPublic?: boolean;
}

export interface UpdateBoardData {
  title?: string;
  description?: string;
  isPublic?: boolean;
  content?: FabricCanvasData;
}

export interface BoardsResponse {
  boards: Board[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface BoardActivity {
  id: string;
  action: string;
  details?: Record<string, unknown>;
  createdAt: string;
  boardId: string;
  userId: string;
}

export interface CollaboratorResponse {
  collaborator: {
    id: string;
    boardId: string;
    userId: string;
    role: string;
    addedAt: string;
  };
  user: {
    id: string;
    username: string;
    email: string;
  };
}

class BoardApiService {  private getAuthHeaders() {
    // Try to get token from Zustand persist storage
    let token = null;
    try {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const parsedAuth = JSON.parse(authStorage);
        token = parsedAuth.state?.token;
      }
    } catch (error) {
      console.warn('Failed to parse auth storage:', error);
    }
    
    // Fallback to direct localStorage access
    if (!token) {
      token = localStorage.getItem('accessToken');
    }
    
    console.log('BoardAPI: Retrieved token:', token ? 'present' : 'missing');
    
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    return response.json();
  }

  // Get user's boards
  async getUserBoards(params?: {
    page?: number;
    limit?: number;
    search?: string;
    isPublic?: boolean;
  }): Promise<BoardsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.isPublic !== undefined) searchParams.set('isPublic', params.isPublic.toString());

    const response = await fetch(`${API_BASE_URL}/api/boards?${searchParams}`, {
      headers: this.getAuthHeaders()
    });

    return this.handleResponse<BoardsResponse>(response);
  }

  // Get public boards
  async getPublicBoards(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<BoardsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);

    const response = await fetch(`${API_BASE_URL}/api/boards/public?${searchParams}`, {
      headers: this.getAuthHeaders()
    });

    return this.handleResponse<BoardsResponse>(response);
  }

  // Get board by ID
  async getBoardById(id: string): Promise<Board> {
    const response = await fetch(`${API_BASE_URL}/api/boards/${id}`, {
      headers: this.getAuthHeaders()
    });

    return this.handleResponse<Board>(response);
  }
  // Create new board
  async createBoard(data: CreateBoardData): Promise<Board> {
    console.log('BoardAPI: Creating board with data:', data);
    console.log('BoardAPI: API_BASE_URL:', API_BASE_URL);
    
    const token = localStorage.getItem('accessToken');
    console.log('BoardAPI: Auth token present:', !!token);
    
    const response = await fetch(`${API_BASE_URL}/api/boards`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });

    console.log('BoardAPI: Response status:', response.status);
    console.log('BoardAPI: Response ok:', response.ok);
    
    return this.handleResponse<Board>(response);
  }

  // Update board
  async updateBoard(id: string, data: UpdateBoardData): Promise<Board> {
    const response = await fetch(`${API_BASE_URL}/api/boards/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });

    return this.handleResponse<Board>(response);
  }

  // Delete board
  async deleteBoard(id: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/boards/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    return this.handleResponse<{ message: string }>(response);
  }
  // Add collaborator
  async addCollaborator(boardId: string, email: string, role: string = 'viewer'): Promise<CollaboratorResponse> {
    const response = await fetch(`${API_BASE_URL}/api/boards/${boardId}/collaborators`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ email, role })
    });

    return this.handleResponse<CollaboratorResponse>(response);
  }

  // Remove collaborator
  async removeCollaborator(boardId: string, collaboratorId: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/boards/${boardId}/collaborators/${collaboratorId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    return this.handleResponse<{ message: string }>(response);
  }

  // Get board activities
  async getBoardActivities(boardId: string, limit: number = 20): Promise<BoardActivity[]> {
    const response = await fetch(`${API_BASE_URL}/api/boards/${boardId}/activities?limit=${limit}`, {
      headers: this.getAuthHeaders()
    });

    return this.handleResponse<BoardActivity[]>(response);
  }
}

export const boardApi = new BoardApiService();
