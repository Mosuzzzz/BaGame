import { NextRequest, NextResponse } from 'next/server';
import { deleteGame, getStore } from '../store';
import { auth } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const store = await getStore();
  const game = store.find((g) => g.id === params.id);
  if (!game) {
    return NextResponse.json({ error: `Game with id '${params.id}' not found` }, { status: 404 });
  }
  return NextResponse.json({ game });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization token' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    
    const email = decodedToken.email || '';
    if (!email.endsWith('@rmuti.ac.th')) {
      return NextResponse.json({ error: 'Only @rmuti.ac.th email addresses are allowed' }, { status: 403 });
    }
    
    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(e => e.trim());
    const isAdmin = adminEmails.includes(email);

    const store = await getStore();
    const game = store.find((g) => g.id === params.id);
    
    if (!game) {
      return NextResponse.json({ error: 'ไม่พบเกมที่ต้องการลบ' }, { status: 404 });
    }
    
    if (game.creator_id !== decodedToken.uid && !isAdmin) {
      return NextResponse.json({ error: 'คุณไม่มีสิทธิ์ลบเกมนี้' }, { status: 403 });
    }

    await deleteGame(params.id);
    return NextResponse.json({ message: 'ลบผลงานเกมออกจากระบบเรียบร้อยแล้ว' });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid token or server error' }, { status: 401 });
  }
}
