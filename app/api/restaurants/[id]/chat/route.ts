// /app/api/restaurants/[id]/chat/route.ts
import { NextResponse } from "next/server";
import { generateEmbedding, generateResponseFinal } from "@/lib/services/openAI";
import { IntentionClassifier } from "@/lib/services/agents";
import { FlowMisto, FlowNumérico, FlowTexto } from "@/lib/services/Workflows";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { question } = await req.json();
    if (!question) {
      return NextResponse.json({ error: "Pergunta é obrigatória." }, { status: 400 });
    }
  
    const restaurantId = params.id;

    const embedding_input = await generateEmbedding(question);

    let finalPrompt;
    const intention = await IntentionClassifier(question);
    console.log(intention);
    if(intention === 'texto'){
      finalPrompt = await FlowTexto(question, embedding_input, 5, restaurantId);
    } else if(intention === 'numérico'){
      finalPrompt = await FlowNumérico(question, embedding_input, 5, restaurantId);
    } else{
      finalPrompt = await FlowMisto(question, embedding_input, 5, restaurantId);
    }

             
    console.log(finalPrompt);
    const streamResponse = await generateResponseFinal(finalPrompt);
        
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of streamResponse) {
          const content = chunk.choices[0].delta?.content;
          if (content) {
            controller.enqueue(encoder.encode(content));
          }
        }
        controller.close();
      },
    });

    return new NextResponse(stream, {
      headers: { "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Erro no endpoint de chat:", error);
    return NextResponse.json({ error: "Erro no processamento do chat." }, { status: 500 });
  }
}