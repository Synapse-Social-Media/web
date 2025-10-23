import { vi } from 'vitest'
import { searchService } from '../search-service'
import { createClient } from '@/lib/supabase/client'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
    createClient: vi.fn()
}))

const mockSupabase = {
    auth: {
        getUser: vi.fn()
    },
    from: vi.fn()
}

const mockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis()
}

describe('SearchService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
            ; (createClient as any).mockReturnValue(mockSupabase)
        mockSupabase.from.mockReturnValue(mockQueryBuilder)
    })

    describe('searchUsers', () => {
        it('searches users with query and returns formatted results', async () => {
            const mockUsers = [
                {
                    id: 'user-1',
                    uid: 'user-1',
                    username: 'john_doe',
                    display_name: 'John Doe',
                    avatar: 'avatar.jpg',
                    verify: true,
                    followers_count: 1000,
                    created_at: '2024-01-01',
                    banned: false
                }
            ]

            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: { id: 'current-user' } }
            })

            mockQueryBuilder.select.mockReturnValue({
                ...mockQueryBuilder,
                then: (callback: any) => callback({ data: mockUsers, error: null })
            })

            const results = await searchService.searchUsers('john', {}, 10)

            expect(results).toHaveLength(1)
            expect(results[0]).toMatchObject({
                id: 'user-user-1',
                type: 'user',
                user: {
                    id: 'user-1',
                    username: 'john_doe',
                    display_name: 'John Doe'
                }
            })
        })

        it('filters out banned users', async () => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: { id: 'current-user' } }
            })

            await searchService.searchUsers('test', {}, 10)

            expect(mockQueryBuilder.eq).toHaveBeenCalledWith('banned', false)
        })

        it('applies verified filter when specified', async () => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: { id: 'current-user' } }
            })

            await searchService.searchUsers('test', { verified: true }, 10)

            expect(mockQueryBuilder.eq).toHaveBeenCalledWith('verify', true)
        })
    })

    describe('searchPosts', () => {
        it('searches posts and excludes deleted posts', async () => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: { id: 'current-user' } }
            })

            await searchService.searchPosts('test content', {}, 10)

            expect(mockQueryBuilder.eq).toHaveBeenCalledWith('is_deleted', false)
            expect(mockQueryBuilder.eq).toHaveBeenCalledWith('users.banned', false)
        })
    })
})