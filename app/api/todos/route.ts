import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

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

export async function GET(request: Request) {
    const userId = await getUserId(request);
    if (!userId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q');

    let query = 'SELECT * FROM todos WHERE user_id = ?';
    const queryParams: (string | number)[] = [userId];

    if (search) {
        query += ' AND title LIKE ?';
        queryParams.push(`%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    try {
        const [rows] = await pool.execute(query, queryParams);
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Fetch todos error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const userId = await getUserId(request);
    if (!userId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { title } = await request.json();
        if (!title) {
            return NextResponse.json({ message: 'Title is required' }, { status: 400 });
        }

        const [result] = await pool.execute<ResultSetHeader>(
            'INSERT INTO todos (user_id, title) VALUES (?, ?)',
            [userId, title]
        );

        return NextResponse.json(
            { id: result.insertId, title, completed: false },
            { status: 201 }
        );
    } catch (error) {
        console.error('Create todo error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
