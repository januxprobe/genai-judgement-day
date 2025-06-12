
import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return new NextResponse(JSON.stringify({ message: 'Email is required' }), { status: 400 });
    }

    const db = admin.firestore();
    await db.collection('submissions').add({
      email: email,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return new NextResponse(JSON.stringify({ message: 'Email saved successfully' }), { status: 200 });
  } catch (error) {
    console.error('Error saving email:', error);
    return new NextResponse(JSON.stringify({ message: 'Error saving email' }), { status: 500 });
  }
}
