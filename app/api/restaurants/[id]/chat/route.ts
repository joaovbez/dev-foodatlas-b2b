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

    // Extract chart data if present in the prompt
    let chartData = [];
    const chartDataMatch = finalPrompt.match(/\[CHART_DATA_START\]([\s\S]*?)\[CHART_DATA_END\]/);
    
    if (chartDataMatch && chartDataMatch[1]) {
      try {
        chartData = JSON.parse(chartDataMatch[1]);
        // Remove chart data from the prompt to avoid showing it in the response
        finalPrompt = finalPrompt.replace(/\[CHART_DATA_START\][\s\S]*?\[CHART_DATA_END\]/, '');
      } catch (error) {
        console.error("Error parsing chart data:", error);
      }
    }
    
    // Add chart data as a special message at the beginning of the stream
    const hasChartData = chartData.length > 0;
        
    const streamResponse = await generateResponseFinal(finalPrompt);
        
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // If we have chart data, send it as a special message first
        if (hasChartData) {
          const chartDataMessage = `[CHART_DATA_JSON]${JSON.stringify(chartData)}[/CHART_DATA_JSON]`;
          controller.enqueue(encoder.encode(chartDataMessage));
        }
        
        // Then stream the normal response
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