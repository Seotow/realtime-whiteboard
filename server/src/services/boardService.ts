import { PrismaClient } from '@prisma/client';
import { CreateBoardRequest, UpdateBoardRequest, BoardQueryRequest } from '../schemas/boardSchemas';

const prisma = new PrismaClient();

export class BoardService {  // Get user's boards with pagination and search
  static async getUserBoards(userId: string, query: BoardQueryRequest) {
    const { page, limit, search, isPublic } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      OR: [
        { userId }, // User's own boards
        { 
          collaborators: {
            some: { userId }
          }
        } // Boards where user is a collaborator
      ]
    };

    // Add filters
    if (search) {
      where.AND = [
        {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ]
        }
      ];
    }

    if (isPublic !== undefined) {
      where.isPublic = isPublic;
    }

    const [boards, total] = await Promise.all([
      prisma.board.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          user: {
            select: { id: true, username: true, email: true }
          },
          collaborators: {
            select: { userId: true, role: true, addedAt: true }
          },
          _count: {
            select: { activities: true }
          }
        }
      }),
      prisma.board.count({ where })
    ]);

    return {
      boards,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }  // Get board by ID with permission check
  static async getBoardById(boardId: string, userId: string | null) {
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        user: {
          select: { id: true, username: true, email: true }
        },
        collaborators: {
          select: { userId: true, role: true, addedAt: true }
        }
      }
    });

    if (!board) {
      throw new Error('Board not found');
    }

    // Check permissions - allow access if:
    // 1. Board is public (anyone can access)
    // 2. User is authenticated and is the owner
    // 3. User is authenticated and is a collaborator
    const hasAccess = board.isPublic || 
                     (userId && board.userId === userId) || 
                     (userId && board.collaborators.some(c => c.userId === userId));

    if (!hasAccess) {
      throw new Error('Access denied');
    }

    // Log access activity for authenticated users (but not owners)
    if (userId && board.userId !== userId) {
      try {
        // Check if this user has accessed this board recently (within last hour) to avoid spam
        const recentAccess = await prisma.boardActivity.findFirst({
          where: {
            boardId,
            userId,
            action: 'accessed',
            createdAt: {
              gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
            }
          }
        });

        if (!recentAccess) {
          await this.logActivity(boardId, userId, 'accessed', {
            isPublic: board.isPublic,
            via: board.isPublic ? 'public_link' : 'shared_link'
          });
        }
      } catch (error) {
        console.warn('Failed to log board access:', error);
        // Don't throw - access logging failure shouldn't prevent board access
      }
    }

    return board;
  }// Create new board
  static async createBoard(userId: string, data: CreateBoardRequest) {
    const board = await prisma.board.create({
      data: {
        title: data.title,
        description: data.description,
        isPublic: data.isPublic,
        userId
      },
      include: {
        user: {
          select: { id: true, username: true, email: true }
        },
        collaborators: {
          select: { userId: true, role: true, addedAt: true }
        },
        _count: {
          select: { activities: true }
        }
      }
    });

    // Log activity
    await this.logActivity(board.id, userId, 'created', { title: board.title });

    return board;
  }  // Update board
  static async updateBoard(boardId: string, userId: string | null, data: UpdateBoardRequest) {
    // First get the board to check permissions
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        user: {
          select: { id: true, username: true, email: true }
        },
        collaborators: {
          select: { userId: true, role: true, addedAt: true }
        }
      }
    });

    if (!board) {
      throw new Error('Board not found');
    }
    
    // Simplified permission logic:
    // 1. If board is public, allow anyone (including anonymous users) to edit
    // 2. If board is private, only allow owner and collaborators
    if (board.isPublic) {
      // Public boards allow anyone to edit, no further checks needed
    } else if (!userId) {
      // Anonymous user trying to edit private board
      throw new Error('Authentication required for private boards');
    } else {
      // Private board - check if user is owner or collaborator
      const hasPrivateEditPermission = board.userId === userId || 
                                      board.collaborators.some(c => c.userId === userId);
      if (!hasPrivateEditPermission) {
        throw new Error('Permission denied - you must be the owner or a collaborator');
      }
    }

    const updatedBoard = await prisma.board.update({
      where: { id: boardId },
      data,
      include: {
        user: {
          select: { id: true, username: true, email: true }
        },
        collaborators: {
          select: { userId: true, role: true, addedAt: true }
        }
      }
    });    // Log activity (only if user is authenticated)
    if (userId) {
      await this.logActivity(boardId, userId, 'updated', { 
        changes: Object.keys(data) 
      });
    }

    return updatedBoard;
  }

  // Delete board
  static async deleteBoard(boardId: string, userId: string) {
    const board = await this.getBoardById(boardId, userId);

    // Only owner can delete
    if (board.userId !== userId) {
      throw new Error('Only board owner can delete');
    }

    await prisma.board.delete({
      where: { id: boardId }
    });

    return { message: 'Board deleted successfully' };
  }

  // Add collaborator to board
  static async addCollaborator(boardId: string, userId: string, collaboratorUserId: string, role: string = 'viewer') {
    const board = await this.getBoardById(boardId, userId);

    // Only owner or admins can add collaborators
    const canAddCollaborators = board.userId === userId || 
                               board.collaborators.some(c => c.userId === userId && c.role === 'admin');

    if (!canAddCollaborators) {
      throw new Error('Permission denied to add collaborators');
    }

    // Check if user exists
    const collaboratorUser = await prisma.user.findUnique({
      where: { id: collaboratorUserId },
      select: { id: true, username: true, email: true }
    });

    if (!collaboratorUser) {
      throw new Error('User not found');
    }

    // Check if already a collaborator
    const existingCollaborator = await prisma.boardCollaborator.findUnique({
      where: { 
        boardId_userId: { 
          boardId, 
          userId: collaboratorUserId 
        } 
      }
    });

    if (existingCollaborator) {
      throw new Error('User is already a collaborator');
    }

    const collaborator = await prisma.boardCollaborator.create({
      data: {
        boardId,
        userId: collaboratorUserId,
        role
      }
    });

    // Log activity
    await this.logActivity(boardId, userId, 'collaborator_added', { 
      collaboratorId: collaboratorUserId,
      role 
    });

    return { collaborator, user: collaboratorUser };
  }

  // Remove collaborator
  static async removeCollaborator(boardId: string, userId: string, collaboratorUserId: string) {
    const board = await this.getBoardById(boardId, userId);

    // Only owner or the collaborator themselves can remove
    const canRemove = board.userId === userId || userId === collaboratorUserId;

    if (!canRemove) {
      throw new Error('Permission denied');
    }

    await prisma.boardCollaborator.delete({
      where: { 
        boardId_userId: { 
          boardId, 
          userId: collaboratorUserId 
        } 
      }
    });

    // Log activity
    await this.logActivity(boardId, userId, 'collaborator_removed', { 
      collaboratorId: collaboratorUserId 
    });

    return { message: 'Collaborator removed successfully' };
  }
  // Get public boards (templates, featured, etc.)
  static async getPublicBoards(query: BoardQueryRequest) {
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;

    const where: any = { isPublic: true };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [boards, total] = await Promise.all([
      prisma.board.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          user: {
            select: { id: true, username: true }
          },
          _count: {
            select: { activities: true }
          }
        }
      }),
      prisma.board.count({ where })
    ]);

    return {
      boards,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
  // Get boards that user has accessed (but doesn't own or collaborate on)
  static async getAccessedBoards(userId: string, query: BoardQueryRequest) {
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;

    // Get board IDs from activities where user accessed boards, ordered by most recent access
    const accessActivities = await prisma.boardActivity.findMany({
      where: {
        userId,
        action: 'accessed'
      },
      select: {
        boardId: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Create a map of board ID to most recent access time
    const boardAccessMap = new Map<string, Date>();
    const uniqueBoardIds: string[] = [];
    
    // Build unique board IDs array while preserving most recent access order
    for (const activity of accessActivities) {
      if (!boardAccessMap.has(activity.boardId)) {
        boardAccessMap.set(activity.boardId, activity.createdAt);
        uniqueBoardIds.push(activity.boardId);
      }
    }

    if (uniqueBoardIds.length === 0) {
      return {
        boards: [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0
        }
      };
    }

    // Build where clause for accessed boards
    const where: any = {
      id: { in: uniqueBoardIds },
      // Exclude boards where user is owner or collaborator
      AND: [
        { userId: { not: userId } },
        {
          collaborators: {
            none: { userId }
          }
        }
      ]
    };

    // Add search filter
    if (search) {
      where.AND.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      });
    }

    const [fetchedBoards, total] = await Promise.all([
      prisma.board.findMany({
        where,
        include: {
          user: {
            select: { id: true, username: true, email: true }
          },
          collaborators: {
            select: { userId: true, role: true, addedAt: true }
          },
          _count: {
            select: { activities: true }
          }
        }
      }),
      prisma.board.count({ where })
    ]);

    // Sort boards by most recent access time (preserved from uniqueBoardIds order)
    const sortedBoards = fetchedBoards.sort((a, b) => {
      const aIndex = uniqueBoardIds.indexOf(a.id);
      const bIndex = uniqueBoardIds.indexOf(b.id);
      return aIndex - bIndex; // Maintain the access order
    });

    // Apply pagination to the sorted results
    const paginatedBoards = sortedBoards.slice(skip, skip + limit);

    return {
      boards: paginatedBoards,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Log board activity
  private static async logActivity(boardId: string, userId: string, action: string, details?: any) {
    await prisma.boardActivity.create({
      data: {
        boardId,
        userId,
        action,
        details
      }
    });
  }

  // Get board activities
  static async getBoardActivities(boardId: string, userId: string, limit: number = 20) {
    // Check if user has access to board
    await this.getBoardById(boardId, userId);

    return await prisma.boardActivity.findMany({
      where: { boardId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  // Save canvas content
  static async saveCanvasContent(boardId: string, userId: string, content: any, settings?: any) {
    // First check if user has edit permission
    const board = await this.getBoardById(boardId, userId);
    
    const hasEditPermission = board.userId === userId || 
                             board.collaborators.some(c => c.userId === userId && ['editor', 'admin'].includes(c.role));

    if (!hasEditPermission) {
      throw new Error('Edit permission denied');
    }    // Validate and serialize canvas content
    let processedContent;
    try {
      // Store as JSON object in the database
      processedContent = typeof content === 'string' ? JSON.parse(content) : content;
    } catch (error) {
      throw new Error('Invalid canvas content format');
    }

    const updatedBoard = await prisma.board.update({
      where: { id: boardId },
      data: {
        content: processedContent,
        settings: settings || undefined,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: { id: true, username: true, email: true }
        },
        collaborators: {
          select: { userId: true, role: true, addedAt: true }
        }
      }
    });

    // Log activity
    await this.logActivity(boardId, userId, 'canvas_saved', { 
      timestamp: new Date().toISOString()
    });

    return {
      message: 'Canvas saved successfully',
      board: updatedBoard,
      timestamp: new Date().toISOString()
    };
  }
}
