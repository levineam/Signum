import { NextRequest, NextResponse } from 'next/server'

type ItemRouteContext = {
  params: Promise<{ id?: string | string[] | undefined }>
}

const getIdFromContext = async (context: ItemRouteContext) => {
  const params = await context.params
  const identifier = Array.isArray(params?.id) ? params?.id[0] : params?.id
  if (!identifier) {
    throw new Error('Missing item id in route parameters')
  }
  return identifier
}

/**
 * GET /api/temporal/items/[id]
 *
 * Fetch a single item by ID.
 *
 * Path parameters:
 * - id: Item UUID
 *
 * Returns: Item (see src/types/temporal.ts)
 *
 * TODO Phase 5:
 * 1. Authenticate user
 * 2. Call itemQueries.getItem(id)
 * 3. Check authorization (user owns this item via RLS)
 * 4. Return item with 200 status
 * 5. Return 404 if not found
 */
export async function GET(request: NextRequest, context: ItemRouteContext) {
  const id = await getIdFromContext(context)
  try {
    // TODO: Implement in Phase 5
    return NextResponse.json(
      {
        error: 'Not implemented in Phase 3',
        message:
          'Phase 5 will implement this endpoint with authorization checks',
        status: 501,
      },
      { status: 501 }
    )
  } catch (error) {
    console.error(`[GET /api/temporal/items/${id}]`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/temporal/items/[id]
 *
 * Update an existing item.
 *
 * Path parameters:
 * - id: Item UUID
 *
 * Request body: UpdateItemRequest (see src/types/temporal.ts)
 * {
 *   title?: string,
 *   description?: string,
 *   dueAt?: ISO timestamp,
 *   priority?: 'low' | 'medium' | 'high',
 *   estimateMinutes?: number,
 *   reminderTime?: ISO timestamp,
 *   snoozeUntil?: ISO timestamp,
 *   status?: 'pending' | 'completed' | 'cancelled',
 *   metadata?: Record<string, unknown>,
 * }
 *
 * Returns: Item (updated)
 *
 * TODO Phase 5:
 * 1. Authenticate user
 * 2. Call itemQueries.getItem(id) to check existence
 * 3. Check authorization (user owns this item)
 * 4. Parse and validate UpdateItemRequest body
 * 5. Call itemQueries.updateItem(id, req)
 * 6. Return updated item with 200 status
 * 7. Return 404 if not found
 */
export async function PATCH(request: NextRequest, context: ItemRouteContext) {
  const id = await getIdFromContext(context)
  try {
    // TODO: Implement in Phase 5
    return NextResponse.json(
      {
        error: 'Not implemented in Phase 3',
        message:
          'Phase 5 will implement this endpoint with validation and updates',
        status: 501,
      },
      { status: 501 }
    )
  } catch (error) {
    console.error(`[PATCH /api/temporal/items/${id}]`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/temporal/items/[id]
 *
 * Delete an item.
 *
 * Path parameters:
 * - id: Item UUID
 *
 * Returns: 204 No Content on success
 *
 * TODO Phase 5:
 * 1. Authenticate user
 * 2. Call itemQueries.getItem(id) to check existence
 * 3. Check authorization (user owns this item)
 * 4. Call itemQueries.deleteItem(id)
 * 5. Return 204 No Content
 * 6. Return 404 if not found
 *
 * Note: Cascading deletes will:
 * - Delete all occurrences for this item
 * - Set schedule_id to NULL if item is deleted (schedule remains)
 */
export async function DELETE(request: NextRequest, context: ItemRouteContext) {
  const id = await getIdFromContext(context)
  try {
    // TODO: Implement in Phase 5
    return NextResponse.json(
      {
        error: 'Not implemented in Phase 3',
        message:
          'Phase 5 will implement this endpoint with deletion and cascading deletes',
        status: 501,
      },
      { status: 501 }
    )
  } catch (error) {
    console.error(`[DELETE /api/temporal/items/${id}]`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
