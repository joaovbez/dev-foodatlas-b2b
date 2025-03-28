import { TextLoader } from "langchain/document_loaders/fs/text";
import { OpenAIEmbeddings } from "@langchain/openai";
const natural = require("natural");
import * as math from "mathjs";
import { quantile } from "d3-array";
import { generateSummary } from "./openAI";

interface SentenceObject {
  sentence: string;
  index: number;
  combined_sentence?: string;
  combined_sentence_embedding?: number[];
  distance_to_next?: number;
}
// Loader para arquivos TXT
const loadTextFile = async (relativePath: string): Promise<string> => {
  const loader = new TextLoader(relativePath);
  const docs = await loader.load();
  const textCorpus = docs[0].pageContent;
  return textCorpus;
};

// Split em frases
const splitToSentencesUsingNLP = (textCorpus: string): string[] => {

  const tokenizer = new natural.RegexpTokenizer({pattern: /(?<=[.?!])\s+|\r?\n/ });
  const normalizedText = textCorpus.replace(/\r\n/g, "\n");
  const sentences = tokenizer.tokenize(normalizedText);  

  return sentences;
};

// Preenche sentence, index e combined_sentence da interface criada no início
const structureSentences = (
  sentences: string[],
  bufferSize: number = 1
): SentenceObject[] => {
  const sentenceObjectArray: SentenceObject[] = sentences.map(
    (sentence, i) => ({
      sentence,
      index: i,
    })
  );

  sentenceObjectArray.forEach((currentSentenceObject, i) => {
    let combinedSentence = "";

    for (let j = i - bufferSize; j < i; j++) {
      if (j >= 0) {
        combinedSentence += sentenceObjectArray[j].sentence + " ";
      }
    }

    combinedSentence += currentSentenceObject.sentence + " ";

    for (let j = i + 1; j <= i + bufferSize; j++) {
      if (j < sentenceObjectArray.length) {
        combinedSentence += sentenceObjectArray[j].sentence;
      }
    }

    sentenceObjectArray[i].combined_sentence = combinedSentence.trim();
  });

  return sentenceObjectArray;
};

// Gera os embeddings de cada sentence
const generateAndAttachEmbeddings = async (
  sentencesArray: SentenceObject[]
): Promise<SentenceObject[]> => {
  
  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-large"
  });

  // Cria uma cópia do array original para mexer apenas nesta cópia (segurança em caso de erro)
  const sentencesArrayCopy: SentenceObject[] = sentencesArray.map(
    (sentenceObject) => ({
      ...sentenceObject,
      combined_sentence_embedding: sentenceObject.combined_sentence_embedding
        ? [...sentenceObject.combined_sentence_embedding]
        : undefined,
    })
  );

  // Extrai as combined_sentences do array
  const combinedSentencesStrings: string[] = sentencesArrayCopy
    .filter((item) => item.combined_sentence !== undefined)
    .map((item) => item.combined_sentence as string);

  // Gera os embeddings para cada combined_sentence
  const embeddingsArray = await embeddings.embedDocuments(
    combinedSentencesStrings
  );

  let embeddingIndex = 0;
  for (let i = 0; i < sentencesArrayCopy.length; i++) {
    if (sentencesArrayCopy[i].combined_sentence !== undefined) {
      sentencesArrayCopy[i].combined_sentence_embedding =
        embeddingsArray[embeddingIndex++];
    }
  }

  return sentencesArrayCopy;
};

const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  const dotProduct = math.dot(vecA, vecB) as number;

  const normA = math.norm(vecA) as number;
  const normB = math.norm(vecB) as number;

  if (normA === 0 || normB === 0) {
    return 0;
  }

  const similarity = dotProduct / (normA * normB);
  return similarity;
};

/* Preenche o array com o distance_to_next e um array que indica 
  onde ocorreram as quebras de semântica significativas (baseada no percentil que escolhermos)
*/
const calculateCosineDistancesAndSignificantShifts = (
  sentenceObjectArray: SentenceObject[],
  percentileThreshold: number
): { updatedArray: SentenceObject[]; significantShiftIndices: number[] } => {
  const distances: number[] = [];
  const updatedSentenceObjectArray = sentenceObjectArray.map(
    (item, index, array) => {
      if (
        index < array.length - 1 &&
        item.combined_sentence_embedding &&
        array[index + 1].combined_sentence_embedding
      ) {
        const embeddingCurrent = item.combined_sentence_embedding!;
        const embeddingNext = array[index + 1].combined_sentence_embedding!;
        const similarity = cosineSimilarity(embeddingCurrent, embeddingNext);
        const distance = 1 - similarity;
        distances.push(distance); // Keep track of calculated distances
        return { ...item, distance_to_next: distance };
      } else {
        return { ...item, distance_to_next: undefined };
      }
    }
  );

  const sortedDistances = [...distances].sort((a, b) => a - b);
  const quantileThreshold = percentileThreshold / 100;
  const breakpointDistanceThreshold = quantile(
    sortedDistances,
    quantileThreshold
  );

  if (breakpointDistanceThreshold === undefined) {
    throw new Error("Failed to calculate breakpoint distance threshold");
  }

  const significantShiftIndices = distances
    .map((distance, index) =>
      distance > breakpointDistanceThreshold ? index : -1
    )
    .filter((index) => index !== -1);

  return {
    updatedArray: updatedSentenceObjectArray,
    significantShiftIndices,
  };
};

const groupSentencesIntoChunks = (
  sentenceObjectArray: SentenceObject[],
  shiftIndices: number[]
): string[] => {
  let startIdx = 0; 
  const chunks: string[] = []; 

  const adjustedBreakpoints = [...shiftIndices, sentenceObjectArray.length - 1];

  adjustedBreakpoints.forEach((breakpoint) => {
    const group = sentenceObjectArray.slice(startIdx, breakpoint + 1);
    const combinedText = group.map((item) => item.sentence).join(" "); 
    chunks.push(combinedText);
    startIdx = breakpoint + 1; 
  });

  console.log(chunks);
  return chunks;
};


export async function processTXTFile(filepath: string){
  try {
    const textCorpus = await loadTextFile(filepath);

    const sentences = splitToSentencesUsingNLP(textCorpus);

    const structuredSentences = structureSentences(sentences, 1); 

    const sentencesWithEmbeddings = await generateAndAttachEmbeddings(
      structuredSentences
    );
    
    const { updatedArray, significantShiftIndices } =
      calculateCosineDistancesAndSignificantShifts(sentencesWithEmbeddings, 92); 

    const semanticChunks = groupSentencesIntoChunks(
      updatedArray,
      significantShiftIndices
    );
     
    const summary = await generateSummary(textCorpus);
    
    return { summary, semanticChunks };
  
  } catch (error) {
    console.error("An error occurred in the main function:", error);
  }

}



