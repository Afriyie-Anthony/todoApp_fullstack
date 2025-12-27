import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

async function getUserId(request: Request) {
    const token = request.headers.get('cookie')?.split('token=')[1]?.split(';')[0];
    if (!token) return null;
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        return payload.userId as number;
    } catch (err) {
        return null;
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const userId = await getUserId(request);
    if (!userId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { completed } = await request.json();

    try {
        const [result] = await pool.execute<ResultSetHeader>(
            'UPDATE todos SET completed = ? WHERE id = ? AND user_id = ?',
            [completed, id, userId]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json({ message: 'Todo not found or not authorized' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Todo updated successfully' });
    } catch (error) {
        console.error('Update todo error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const userId = await getUserId(request);
    if (!userId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const [result] = await pool.execute<ResultSetHeader>(
            'DELETE FROM todos WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json({ message: 'Todo not found or not authorized' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Todo deleted successfully' });
    } catch (error) {
        console.error('Delete todo error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
