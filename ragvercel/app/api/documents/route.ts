import { NextResponse } from "next/server";
import { loadDb, addDocument, deleteDocument } from "@/lib/rag";

export async function GET() {
  try {
    const db = await loadDb();
    
    // Map documents to include chunk counts
    const documentsWithStats = db.documents.map((doc) => {
      const chunkCount = db.chunks.filter((c) => c.documentId === doc.id).length;
      return {
        ...doc,
        chunkCount,
      };
    });

    return NextResponse.json(documentsWithStats);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to list documents" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { name, content } = await req.json();

    if (!name || !content) {
      return NextResponse.json(
        { error: "Document name and content are required." },
        { status: 400 }
      );
    }

    const doc = await addDocument(name, content);
    
    // Count its chunks
    const db = await loadDb();
    const chunkCount = db.chunks.filter((c) => c.documentId === doc.id).length;

    return NextResponse.json({
      ...doc,
      chunkCount,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to add document" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Document ID is required." },
        { status: 400 }
      );
    }

    await deleteDocument(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete document" },
      { status: 500 }
    );
  }
}
