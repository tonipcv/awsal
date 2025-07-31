import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // For mobile logout, we simply return a success response
    // The client is responsible for removing the token from storage
    
    return NextResponse.json({
      success: true,
      data: null,
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    console.error('Error in POST /api/v2/auth/mobile/logout:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
